export interface JobPath {
  title: string;
  fitExplanation: string;
  skillsToDevelop: string[];
}

export interface RoadmapStep {
  stepNumber: number;
  title: string;
  description: string;
  resourceLinks: string[];
}

export interface JobListing {
  title: string;
  company: string;
  link: string;
  snippet: string;
}

export interface AssessmentAnswers {
  degree: string;
  experience: string;
  internships: string;
  projects: string;
  programmingLanguages: string;
  interests: string;
  workStyle: string;
}
