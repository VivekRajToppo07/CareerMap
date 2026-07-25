import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Briefcase, Map, Target, ExternalLink, Loader2, Search, BookOpen, FileText, X } from 'lucide-react';
import { AssessmentAnswers, JobPath, RoadmapStep, JobListing } from './types';
import AdminPage from './AdminPage';
import FloatingChat from './FloatingChat';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// =======================
// Resume Modal
// =======================
function ResumeModal({ isOpen, onClose, jobRole, profile, token }: { isOpen: boolean, onClose: () => void, jobRole: string, profile: string, token: string | null }) {
  const [loading, setLoading] = useState(false);
  const [resumeHtml, setResumeHtml] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && jobRole && profile) {
      setLoading(true);
      setError('');
      setResumeHtml('');
      
      axios.post('/api/generate-resume', { jobRole, profile }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      .then(res => {
        setResumeHtml(res.data.resume);
      })
      .catch(err => {
        console.error(err);
        setError(err.response?.data?.error || 'Failed to generate resume.');
      })
      .finally(() => {
        setLoading(false);
      });
    }
  }, [isOpen, jobRole, profile, token]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden relative text-black">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-xl font-bold">Resume: {jobRole}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
              <p>Generating a tailored resume...</p>
            </div>
          ) : error ? (
            <div className="text-red-500 p-4 bg-red-50 rounded-lg border border-red-100">
              {error}
            </div>
          ) : (
            <div className="prose prose-sm max-w-none prose-h1:text-2xl prose-h2:text-xl prose-h2:border-b prose-h2:pb-2 prose-h2:mt-6 prose-a:text-emerald-600" dangerouslySetInnerHTML={{ __html: resumeHtml }} />
          )}
        </div>
        
        {!loading && resumeHtml && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
            <button 
              onClick={() => {
                const blob = new Blob([`<style>body{font-family:sans-serif;line-height:1.6;padding:2rem;max-width:800px;margin:auto}</style>` + resumeHtml], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Resume_${jobRole.replace(/\s+/g, '_')}.html`;
                a.click();
              }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center"
            >
              <FileText className="w-4 h-4 mr-2" />
              Download as HTML
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// =======================
// LandingPage
// =======================
function LandingPage() {
  const navigate = useNavigate();
  const { user, signIn, logOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-300 flex flex-col items-center justify-center p-6 relative">
      <div className="absolute top-6 right-6 flex items-center space-x-4">
        {user ? (
          <>
            <span className="text-sm text-slate-400">{user.email}</span>
            <button onClick={() => navigate('/admin')} className="text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors">Admin</button>
            <button onClick={() => navigate('/history')} className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors">History</button>
            <button onClick={logOut} className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors">Sign Out</button>
          </>
        ) : (
          <button onClick={signIn} className="text-xs bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">Sign In</button>
        )}
      </div>

      <div className="max-w-3xl w-full text-center space-y-8">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
          CareerMap
        </h1>
        <p className="text-xl text-slate-400 leading-relaxed">
          A pocket AI career counselor tuned specifically for regional job markets. Stop random applications. Find your clear, targeted job path and upskill with curated free resources.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-12">
          <div className="bg-[#0c0c0e] p-6 rounded-2xl shadow-xl border border-slate-800">
            <Target className="w-10 h-10 text-emerald-500 mb-4" />
            <h3 className="font-bold text-white mb-2">Targeted Fit</h3>
            <p className="text-slate-400 text-sm">Discover paths matched to your exact skills and local market realities.</p>
          </div>
          <div className="bg-[#0c0c0e] p-6 rounded-2xl shadow-xl border border-slate-800">
            <Map className="w-10 h-10 text-emerald-500 mb-4" />
            <h3 className="font-bold text-white mb-2">Curated Roadmap</h3>
            <p className="text-slate-400 text-sm">Step-by-step upskilling built entirely around free online resources.</p>
          </div>
          <div className="bg-[#0c0c0e] p-6 rounded-2xl shadow-xl border border-slate-800">
            <Briefcase className="w-10 h-10 text-emerald-500 mb-4" />
            <h3 className="font-bold text-white mb-2">Real Traction</h3>
            <p className="text-slate-400 text-sm">Connect directly to live, active entry-level job listings.</p>
          </div>
        </div>

        <div className="pt-8">
          <button
            onClick={() => navigate('/assessment')}
            className="inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-black bg-emerald-500 border border-transparent rounded-lg shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-colors"
          >
            Start Free Assessment
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// =======================
// Assessment Page
// =======================
function AssessmentPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<AssessmentAnswers>({
    degree: '',
    experience: '',
    internships: '',
    projects: '',
    programmingLanguages: '',
    interests: '',
    workStyle: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('/api/assess', { answers });
      
      if (token) {
        // Save to DB
        await axios.post('/api/save-assessment', {
          answers,
          profile: response.data.profile,
          paths: response.data.paths
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }).catch(err => console.error("Failed to save to db:", err));
      }
      
      navigate('/results', { state: { data: response.data } });
    } catch (error) {
      console.error(error);
      alert('Failed to process assessment. Check console and make sure GROQ_API_KEY is set.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-300 flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-[#050505] rounded-xl shadow-2xl border border-slate-800 p-8">
        <h2 className="text-3xl font-bold text-white mb-6 tracking-tight">Let's build your profile</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">What is your degree and graduation year?</label>
            <input
              
              type="text"
              className="w-full bg-[#0c0c0e] px-4 py-3 rounded-lg border border-slate-700 text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500/50 outline-none transition-colors"
              placeholder="e.g. B.Tech Computer Science, 2024"
              value={answers.degree}
              onChange={e => setAnswers({...answers, degree: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">How many years of professional experience do you have?</label>
            <input
              
              type="text"
              className="w-full bg-[#0c0c0e] px-4 py-3 rounded-lg border border-slate-700 text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500/50 outline-none transition-colors"
              placeholder="e.g. 0 (Fresher), 1-2 years, 3+ years"
              value={answers.experience}
              onChange={e => setAnswers({...answers, experience: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Have you completed any internships? If yes, briefly describe.</label>
            <input
              
              type="text"
              className="w-full bg-[#0c0c0e] px-4 py-3 rounded-lg border border-slate-700 text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500/50 outline-none transition-colors"
              placeholder="e.g. 1 summer internship at a startup doing web dev, or None"
              value={answers.internships}
              onChange={e => setAnswers({...answers, internships: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">What key projects have you built?</label>
            <textarea
              
              rows={2}
              className="w-full bg-[#0c0c0e] px-4 py-3 rounded-lg border border-slate-700 text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500/50 outline-none transition-colors"
              placeholder="e.g. Created a weather app in React, built a simple API in Node.js"
              value={answers.projects}
              onChange={e => setAnswers({...answers, projects: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">What programming languages or tools are you most comfortable with?</label>
            <input
              
              type="text"
              className="w-full bg-[#0c0c0e] px-4 py-3 rounded-lg border border-slate-700 text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500/50 outline-none transition-colors"
              placeholder="e.g. Java, basic Python, HTML/CSS"
              value={answers.programmingLanguages}
              onChange={e => setAnswers({...answers, programmingLanguages: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">What kind of work excites you?</label>
            <textarea
              
              rows={3}
              className="w-full bg-[#0c0c0e] px-4 py-3 rounded-lg border border-slate-700 text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500/50 outline-none transition-colors"
              placeholder="e.g. Building websites, analyzing data, talking to clients..."
              value={answers.interests}
              onChange={e => setAnswers({...answers, interests: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Do you prefer working on logic/backend, visuals/frontend, or managing things?</label>
            <input
              
              type="text"
              className="w-full bg-[#0c0c0e] px-4 py-3 rounded-lg border border-slate-700 text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500/50 outline-none transition-colors"
              placeholder="e.g. Logic and problem solving"
              value={answers.workStyle}
              onChange={e => setAnswers({...answers, workStyle: e.target.value})}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center px-8 py-4 text-sm font-bold text-black bg-emerald-500 border border-transparent rounded-lg shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-colors disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Discover My Paths'}
          </button>
        </form>
      </div>
    </div>
  );
}

// =======================
// Results Page
// =======================
function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const data = location.state?.data;
  
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [resumeJobRole, setResumeJobRole] = useState('');

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button onClick={() => navigate('/')} className="text-indigo-600">Go back home</button>
      </div>
    );
  }

  const profile = data.profile;
  const paths: JobPath[] = data.paths;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-300 p-6 md:p-12">
      <FloatingChat context={{ page: 'results', profile, paths }} />
      <ResumeModal 
        isOpen={resumeModalOpen} 
        onClose={() => setResumeModalOpen(false)} 
        jobRole={resumeJobRole} 
        profile={profile} 
        token={token} 
      />
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="space-y-4">
          <h1 className="text-4xl font-bold text-white tracking-tight">Your CareerMap</h1>
          <div className="bg-[#050505] p-6 rounded-xl border border-slate-800 shadow-2xl">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Profile Summary</h3>
            <p className="text-slate-300 leading-relaxed text-sm">{profile}</p>
          </div>
        </header>

        <section>
          <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Top Recommended Paths</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {paths.map((path, idx) => (
              <div key={idx} className="bg-[#0c0c0e] rounded-xl p-6 border border-slate-800 shadow-xl flex flex-col">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-3">{path.title}</h3>
                  <p className="text-slate-400 text-sm mb-4 leading-relaxed">{path.fitExplanation}</p>
                  
                  <div className="mb-6">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Key Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {path.skillsToDevelop.map((skill, sIdx) => (
                        <span key={sIdx} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
                  <button
                    onClick={() => navigate('/roadmap', { state: { pathTitle: path.title } })}
                    className="w-full flex items-center justify-center px-4 py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg font-medium hover:bg-emerald-500/20 transition-colors text-sm"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    View Roadmap
                  </button>
                  <button
                    onClick={() => navigate('/jobs', { state: { query: path.title, profile: profile } })}
                    className="w-full flex items-center justify-center px-4 py-3 bg-[#151518] border border-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-800 transition-colors text-sm"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Find Jobs
                  </button>
                  <button
                    onClick={() => {
                      setResumeJobRole(path.title);
                      setResumeModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center px-4 py-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg font-medium hover:bg-indigo-500/20 transition-colors text-sm"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Resume
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// =======================
// Roadmap Page
// =======================
function RoadmapPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const pathTitle = location.state?.pathTitle;
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<RoadmapStep[]>([]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!pathTitle) {
      navigate('/');
      return;
    }
    
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    axios.post('/api/roadmap', { pathTitle }, { headers })
      .then(res => {
        // Backend now returns { roadmap: [...], completedSteps: [...] } or just an array (for backward compat)
        if (Array.isArray(res.data)) {
          setSteps(res.data);
        } else {
          setSteps(res.data.roadmap);
          setCompletedSteps(res.data.completedSteps || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load roadmap.');
        setLoading(false);
      });
  }, [pathTitle, navigate, token]);

  const toggleStep = async (stepNumber: number) => {
    if (!token) return;
    const isCompleted = completedSteps.includes(stepNumber);
    const newStatus = !isCompleted;
    
    // Optimistic update
    setCompletedSteps(prev => newStatus ? [...prev, stepNumber] : prev.filter(s => s !== stepNumber));
    
    try {
      await axios.post('/api/roadmap/progress', { 
        pathTitle, 
        stepNumber, 
        completed: newStatus 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Failed to save progress", error);
      // Revert on error
      setCompletedSteps(prev => !newStatus ? [...prev, stepNumber] : prev.filter(s => s !== stepNumber));
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500 bg-[#0a0a0a]">{error}</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-300 p-6 md:p-12">
      <FloatingChat context={{ page: 'roadmap', pathTitle, steps }} />
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <button onClick={() => navigate(-1)} className="text-emerald-400 text-sm font-medium mb-4 hover:underline flex items-center">&larr; Back to Paths</button>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Roadmap: {pathTitle}</h1>
              <p className="text-slate-400 mt-2 text-sm">Curated free resources to build your skills step-by-step.</p>
            </div>
            {token && (
              <div className="text-sm font-medium text-slate-400 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700/50">
                Progress: <span className="text-emerald-400">{completedSteps.length}</span> / {steps.length}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {steps.map((step, idx) => {
            const isCompleted = completedSteps.includes(step.stepNumber);
            return (
              <div key={idx} className={`bg-[#0c0c0e] rounded-xl p-6 border ${isCompleted ? 'border-emerald-500/50' : 'border-slate-800'} shadow-xl flex gap-6 transition-colors`}>
                {token ? (
                  <button 
                    onClick={() => toggleStep(step.stepNumber)}
                    className={`flex-shrink-0 w-10 h-10 rounded flex items-center justify-center font-bold text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#0c0c0e] ${isCompleted ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'}`}
                    aria-label={isCompleted ? "Mark as incomplete" : "Mark as complete"}
                  >
                    {isCompleted ? "✓" : step.stepNumber}
                  </button>
                ) : (
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded flex items-center justify-center font-bold text-lg">
                    {step.stepNumber}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className={`text-xl font-bold mb-2 ${isCompleted ? 'text-emerald-400' : 'text-white'}`}>{step.title}</h3>
                  <p className="text-slate-400 text-sm mb-4 leading-relaxed">{step.description}</p>
                  
                  {step.resourceLinks && step.resourceLinks.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Recommended Free Resources:</h4>
                    <ul className="space-y-2">
                      {step.resourceLinks.map((link, lIdx) => (
                        <li key={lIdx}>
                          <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-emerald-400 hover:text-emerald-300 hover:underline">
                            <ExternalLink className="w-4 h-4 mr-1" />
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// =======================
// Jobs Page
// =======================
function JobsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const query = location.state?.query;
  const profile = location.state?.profile || 'A motivated professional seeking an entry level position.';
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [error, setError] = useState('');
  
  const [resumeModalOpen, setResumeModalOpen] = useState(false);

  useEffect(() => {
    if (!query) {
      navigate('/');
      return;
    }
    
    axios.post('/api/search-jobs', { query })
      .then(res => {
        setJobs(res.data.jobs || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.response?.data?.error || 'Failed to search jobs. Is SERPER_API_KEY set?');
        setLoading(false);
      });
  }, [query, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-300 p-6 md:p-12">
      <ResumeModal 
        isOpen={resumeModalOpen} 
        onClose={() => setResumeModalOpen(false)} 
        jobRole={query} 
        profile={profile} 
        token={token} 
      />
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <button onClick={() => navigate(-1)} className="text-emerald-400 text-sm font-medium mb-4 hover:underline flex items-center">&larr; Back</button>
            <h1 className="text-3xl font-bold text-white tracking-tight">Live Jobs: {query}</h1>
            <p className="text-slate-400 mt-2 text-sm">Fetched via Google Search for entry-level roles in India.</p>
          </div>
          <button
            onClick={() => setResumeModalOpen(true)}
            className="flex items-center justify-center px-4 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg font-medium hover:bg-indigo-500/20 transition-colors text-sm whitespace-nowrap"
          >
            <FileText className="w-4 h-4 mr-2" />
            Generate Resume for {query}
          </button>
        </div>
        
        {error ? (
          <div className="bg-red-500/10 text-red-400 p-4 rounded-xl border border-red-500/20 text-sm">
            {error}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">No jobs found.</div>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job, idx) => (
              <a key={idx} href={job.link} target="_blank" rel="noopener noreferrer" className="block bg-[#151518] rounded-xl p-6 border border-slate-800 shadow-xl hover:bg-[#1a1a1e] transition-colors">
                <h3 className="text-lg font-bold text-white mb-1">{job.title}</h3>
                <p className="text-xs font-medium text-emerald-400 mb-3">{job.company}</p>
                <p className="text-slate-400 text-sm line-clamp-2">{job.snippet}</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


// =======================
// History Page
// =======================
function HistoryPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<{ assessments: any[], paths: any[] }>({ assessments: [], paths: [] });
  
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [resumeJobRole, setResumeJobRole] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    axios.get('/api/history', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setHistory(res.data);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [token, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  const latestProfile = history.assessments.length > 0 
    ? `Degree: ${history.assessments[0].degree}\nSkills: ${history.assessments[0].programmingLanguages}\nInterests: ${history.assessments[0].interests}\nWork Style: ${history.assessments[0].workStyle}`
    : '';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-300 p-6 md:p-12">
      <ResumeModal 
        isOpen={resumeModalOpen} 
        onClose={() => setResumeModalOpen(false)} 
        jobRole={resumeJobRole} 
        profile={latestProfile} 
        token={token} 
      />
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <button onClick={() => navigate(-1)} className="text-emerald-400 text-sm font-medium mb-4 hover:underline flex items-center">&larr; Back</button>
          <h1 className="text-3xl font-bold text-white tracking-tight">Your Saved History</h1>
          <p className="text-slate-400 mt-2 text-sm">Past assessments and recommended paths.</p>
        </div>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">Saved Paths</h2>
          <div className="grid gap-4">
            {history.paths.length === 0 ? (
              <div className="text-slate-500 text-sm">No paths saved yet.</div>
            ) : history.paths.map((path, idx) => (
              <div key={idx} className="bg-[#151518] rounded-xl p-6 border border-slate-800 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-2">{path.title}</h3>
                <p className="text-slate-400 text-sm mb-4">{path.fitExplanation}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(path.skillsToDevelop || []).map((skill: string, sIdx: number) => (
                    <span key={sIdx} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/roadmap', { state: { pathTitle: path.title } })}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg font-medium hover:bg-emerald-500/20 transition-colors text-sm"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Roadmap
                  </button>
                  <button
                    onClick={() => navigate('/jobs', { state: { query: path.title, profile: latestProfile } })}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-[#0c0c0e] border border-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-800 transition-colors text-sm"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Jobs
                  </button>
                  <button
                    onClick={() => {
                      setResumeJobRole(path.title);
                      setResumeModalOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg font-medium hover:bg-indigo-500/20 transition-colors text-sm"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Resume
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// =======================
// Main App Component
// =======================
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/assessment" element={<AssessmentPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
