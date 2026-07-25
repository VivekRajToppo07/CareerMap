import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { ChatGroq } from "@langchain/groq";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StateGraph, START, END } from "@langchain/langgraph";
import { requireAuth, optionalAuth, AuthRequest } from './src/middleware/auth.ts';
import { db } from './src/db/index.ts';
import { assessments, savedPaths, pathProgress } from './src/db/schema.ts';
import { eq, desc, and } from 'drizzle-orm';
import { getAdminData } from './src/db/admin.ts';

// Define the state for the LangGraph
interface CareerState {
  answers: any;
  userProfile?: string;
  recommendedPaths?: string;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Check if API key is provided
  const getGroqClient = () => {
    const key = process.env.GROQ_API_KEY;
    if (!key) {
      throw new Error("GROQ_API_KEY environment variable is required. Please set it in the Settings panel.");
    }
    return new ChatGroq({
      apiKey: key,
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
    });
  };

  // Node: Profile Evaluator
  const evaluateProfile = async (state: CareerState) => {
    const llm = getGroqClient();
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "You are an expert career profiler for Tier-2/3 college tech graduates. Summarize the user's skills, core interests, and strengths in a concise paragraph."],
      ["user", "Here are the user's assessment answers: {answers}"]
    ]);
    const chain = prompt.pipe(llm).pipe(new StringOutputParser());
    const profile = await chain.invoke({ answers: JSON.stringify(state.answers) });
    return { userProfile: profile };
  };

  // Node: Path Recommender
  const recommendPaths = async (state: CareerState) => {
    const llm = getGroqClient();
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "You are a pocket AI career counselor. Based on the user's profile, recommend exactly the top 3 job paths that have real traction in regional job markets. Provide clear fit explanations for each. Format your response STRICTLY as a JSON array containing objects with keys: 'title', 'fitExplanation', 'skillsToDevelop' (an array of strings). Return ONLY raw JSON without markdown blocks."],
      ["user", "User Profile: {userProfile}"]
    ]);
    const chain = prompt.pipe(llm).pipe(new StringOutputParser());
    const paths = await chain.invoke({ userProfile: state.userProfile });
    return { recommendedPaths: paths };
  };

  // Build the LangGraph
  const workflow = new StateGraph<CareerState>({
    channels: {
      answers: null,
      userProfile: null,
      recommendedPaths: null
    }
  });

  workflow.addNode("evaluateProfile", evaluateProfile);
  workflow.addNode("recommendPaths", recommendPaths);
  
  workflow.addEdge(START, "evaluateProfile");
  workflow.addEdge("evaluateProfile", "recommendPaths");
  workflow.addEdge("recommendPaths", END);

  const appletWorkflow = workflow.compile();

  // Assessment Endpoint
  app.post("/api/assess", async (req, res) => {
    try {
      const { answers } = req.body;
      
      const finalState = await appletWorkflow.invoke({ answers });
      
      let cleanedResponse = finalState.recommendedPaths?.trim() || "[]";
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/, "").replace(/\n?```$/, "");
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse.replace(/```\n?/, "").replace(/\n?```$/, "");
      }
      
      res.json({
        profile: finalState.userProfile,
        paths: JSON.parse(cleanedResponse)
      });
    } catch (error: any) {
      console.error("Assessment Error:", error);
      res.status(500).json({ error: error.message || "Failed to process assessment." });
    }
  });

  // Roadmap Endpoint
  app.post("/api/roadmap", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { pathTitle } = req.body;
      const userId = req.dbUser?.id;

      if (userId) {
        // Check if progress already exists
        const existingProgress = await db.select().from(pathProgress)
          .where(and(eq(pathProgress.userId, userId), eq(pathProgress.pathTitle, pathTitle)))
          .limit(1);
        
        if (existingProgress.length > 0 && existingProgress[0].roadmap) {
          return res.json({
             roadmap: existingProgress[0].roadmap,
             completedSteps: existingProgress[0].completedSteps || []
          });
        }
      }

      const llm = getGroqClient();
      
      const prompt = ChatPromptTemplate.fromMessages([
        ["system", "You are an expert career counselor. Generate a curated upskilling roadmap built entirely around free online resources for the job path '{pathTitle}'. Break it down into 4 clear steps (e.g., Fundamentals, Core Skills, Projects, Interview Prep). Format as a JSON array of objects with keys: 'stepNumber', 'title', 'description', 'resourceLinks' (an array of string URLs to free resources like YouTube, FreeCodeCamp, etc.). Return only raw JSON."],
        ["user", "Generate the roadmap."]
      ]);
      
      const chain = prompt.pipe(llm).pipe(new StringOutputParser());
      const response = await chain.invoke({ pathTitle });
      
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/, "").replace(/\n?```$/, "");
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse.replace(/```\n?/, "").replace(/\n?```$/, "");
      }
      
      const parsedRoadmap = JSON.parse(cleanedResponse);

      if (userId) {
         await db.insert(pathProgress).values({
            userId,
            pathTitle,
            roadmap: parsedRoadmap,
            completedSteps: []
         });
         return res.json({ roadmap: parsedRoadmap, completedSteps: [] });
      }

      res.json({ roadmap: parsedRoadmap, completedSteps: [] });
    } catch (error: any) {
      console.error("Roadmap Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate roadmap." });
    }
  });

  // Toggle step completion
  app.post("/api/roadmap/progress", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { pathTitle, stepNumber, completed } = req.body;
      const userId = req.dbUser!.id;

      const existingProgress = await db.select().from(pathProgress)
        .where(and(eq(pathProgress.userId, userId), eq(pathProgress.pathTitle, pathTitle)))
        .limit(1);

      if (existingProgress.length === 0) {
        return res.status(404).json({ error: "Roadmap progress not found." });
      }

      let completedSteps: number[] = (existingProgress[0].completedSteps as number[]) || [];
      
      if (completed && !completedSteps.includes(stepNumber)) {
        completedSteps.push(stepNumber);
      } else if (!completed) {
        completedSteps = completedSteps.filter(s => s !== stepNumber);
      }

      await db.update(pathProgress)
        .set({ completedSteps })
        .where(eq(pathProgress.id, existingProgress[0].id));

      res.json({ success: true, completedSteps });
    } catch (error: any) {
      console.error("Update Progress Error:", error);
      res.status(500).json({ error: "Failed to update progress." });
    }
  });

  // Save Assessment Endpoint
  app.post("/api/save-assessment", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { answers, profile, paths } = req.body;
      const userId = req.dbUser!.id;

      // Save assessment
      const [assessment] = await db.insert(assessments).values({
        userId,
        degree: answers.degree,
        experience: answers.experience,
        internships: answers.internships,
        projects: answers.projects,
        programmingLanguages: answers.programmingLanguages,
        interests: answers.interests,
        workStyle: answers.workStyle,
      }).returning();

      // Save recommended paths
      if (paths && paths.length > 0) {
        await db.insert(savedPaths).values(
          paths.map((p: any) => ({
            userId,
            title: p.title,
            fitExplanation: p.fitExplanation,
            skillsToDevelop: p.skillsToDevelop,
          }))
        );
      }

      res.json({ success: true, assessmentId: assessment.id });
    } catch (error: any) {
      console.error("Save Assessment Error:", error);
      res.status(500).json({ error: "Failed to save assessment to database.", cause: error.message });
    }
  });

  // Admin Data Endpoint
  app.get("/api/admin/data", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const data = await getAdminData();
      res.json(data);
    } catch (error: any) {
      console.error("Admin Data Error:", error);
      res.status(500).json({ error: "Failed to fetch admin data." });
    }
  });

  // Get History Endpoint
  app.get("/api/history", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      
      const userAssessments = await db.select().from(assessments)
        .where(eq(assessments.userId, userId))
        .orderBy(desc(assessments.createdAt));
        
      const userPaths = await db.select().from(savedPaths)
        .where(eq(savedPaths.userId, userId))
        .orderBy(desc(savedPaths.createdAt));

      res.json({
        assessments: userAssessments,
        paths: userPaths
      });
    } catch (error: any) {
      console.error("History Error:", error);
      res.status(500).json({ error: "Failed to fetch history.", cause: error.message });
    }
  });

  app.post("/api/generate-resume", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { jobRole, profile } = req.body;
      const model = new ChatGroq({
        modelName: "llama-3.3-70b-versatile",
        temperature: 0.7,
        apiKey: process.env.GROQ_API_KEY,
      });

      const prompt = ChatPromptTemplate.fromTemplate(`
You are an expert resume writer. Generate a professional HTML resume tailored for the job role: {jobRole}.
Use the following user profile as a base:
{profile}

Format the output strictly as valid HTML inside a <div> tag, using semantic tags (<h1>, <h2>, <ul>, <li>, <p>).
Do NOT include \`\`\`html markdown code blocks. Just output the raw HTML.
Ensure the design looks clean by applying inline styles for basic layout, or classes (we are using Tailwind, so you can use basic Tailwind classes like text-xl, font-bold, mb-4, etc.).
Keep it professional, concise, and focused on making the user stand out for this specific role. Include placeholder sections if there is missing data (e.g., Experience: [Add your experience here]).
      `);

      const chain = prompt.pipe(model).pipe(new StringOutputParser());
      const resumeHtml = await chain.invoke({
        jobRole,
        profile: JSON.stringify(profile, null, 2),
      });

      res.json({ resume: resumeHtml });
    } catch (error: any) {
      console.error("Resume Generation Error:", error);
      res.status(500).json({ error: "Failed to generate resume.", cause: error.message });
    }
  });

  // Chat Endpoint
  app.post("/api/chat", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { message, history, context } = req.body;
      const llm = getGroqClient();
      
      const systemPrompt = `You are a helpful and encouraging AI career counselor.
      The user is asking a follow-up question based on their current career exploration.
      
      Context information (may be partial depending on what page they are on):
      ${JSON.stringify(context, null, 2)}
      
      Answer their questions professionally and concisely. Give practical, actionable advice.`;
      
      const formattedHistory = history.map((msg: any) => 
        [msg.role, msg.content]
      );
      
      const messages = [
        ["system", systemPrompt],
        ...formattedHistory,
        ["user", message]
      ];
      
      const prompt = ChatPromptTemplate.fromMessages(messages);
      const chain = prompt.pipe(llm).pipe(new StringOutputParser());
      
      const response = await chain.invoke({});
      
      res.json({ response });
    } catch (error: any) {
      console.error("Chat Error:", error);
      res.status(500).json({ error: "Failed to process chat." });
    }
  });

  // Search Jobs Endpoint using Google Custom Search or DuckDuckGo fallback
  app.post("/api/search-jobs", async (req, res) => {
    try {
      const { query } = req.body;
      const serperKey = process.env.SERPER_API_KEY;
      
      if (serperKey) {
        // Use Serper API for Google Search
        const searchRes = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: {
            "X-API-KEY": serperKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ q: `${query} jobs entry level fresher India`, num: 20 })
        });
        const data = await searchRes.json();
        const jobs = data.organic?.slice(0, 20).map((item: any) => ({
          title: item.title,
          company: item.snippet.split(" ")[0] || "Unknown",
          link: item.link,
          snippet: item.snippet
        })) || [];
        res.json({ jobs });
      } else {
        // Fallback or just prompt user
        res.status(400).json({ error: "SERPER_API_KEY environment variable is missing. Please set it to enable live job search." });
      }
    } catch (error: any) {
      console.error("Job Search Error:", error);
      res.status(500).json({ error: error.message || "Failed to search jobs." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.join(process.cwd(), '../frontend')
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), '../frontend/dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
