import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Users, FileText, Map, Briefcase, ChevronRight } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    users: any[],
    assessments: any[],
    savedPaths: any[],
    pathProgress: any[]
  } | null>(null);

  useEffect(() => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    axios.get('/api/admin/data', { headers })
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  if (!data) return <div className="min-h-screen flex items-center justify-center text-red-500 bg-[#0a0a0a]">Failed to load admin data</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-300 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <button onClick={() => navigate('/')} className="text-emerald-400 text-sm font-medium mb-4 hover:underline flex items-center">&larr; Back to Home</button>
          <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-400 mt-2 text-sm">Platform overview and statistics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-[#0c0c0e] rounded-xl p-6 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Users</p>
              <h2 className="text-3xl font-bold text-white">{data.users.length}</h2>
            </div>
            <Users className="w-8 h-8 text-indigo-500 opacity-50" />
          </div>
          <div className="bg-[#0c0c0e] rounded-xl p-6 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Assessments Taken</p>
              <h2 className="text-3xl font-bold text-white">{data.assessments.length}</h2>
            </div>
            <FileText className="w-8 h-8 text-emerald-500 opacity-50" />
          </div>
          <div className="bg-[#0c0c0e] rounded-xl p-6 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Generated Paths</p>
              <h2 className="text-3xl font-bold text-white">{data.savedPaths.length}</h2>
            </div>
            <Map className="w-8 h-8 text-blue-500 opacity-50" />
          </div>
          <div className="bg-[#0c0c0e] rounded-xl p-6 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Roadmaps Started</p>
              <h2 className="text-3xl font-bold text-white">{data.pathProgress.length}</h2>
            </div>
            <Briefcase className="w-8 h-8 text-orange-500 opacity-50" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0c0c0e] rounded-xl p-6 border border-slate-800 overflow-x-auto">
            <h3 className="text-xl font-bold text-white mb-4">Recent Users</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-sm text-slate-500">
                  <th className="pb-3 font-medium">ID</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {data.users.slice(0, 10).map((u, i) => (
                  <tr key={i} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-900/30 transition-colors">
                    <td className="py-4 text-slate-400">{u.id}</td>
                    <td className="py-4 text-slate-200">{u.email}</td>
                    <td className="py-4 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-[#0c0c0e] rounded-xl p-6 border border-slate-800 overflow-x-auto">
            <h3 className="text-xl font-bold text-white mb-4">Recent Assessments</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-sm text-slate-500">
                  <th className="pb-3 font-medium">User ID</th>
                  <th className="pb-3 font-medium">Degree</th>
                  <th className="pb-3 font-medium">Skills</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {data.assessments.slice(0, 10).map((a, i) => (
                  <tr key={i} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-900/30 transition-colors">
                    <td className="py-4 text-emerald-400">User {a.userId}</td>
                    <td className="py-4 text-slate-200">{a.degree}</td>
                    <td className="py-4 text-slate-300 truncate max-w-xs">{a.programmingLanguages}</td>
                    <td className="py-4 text-slate-400">{new Date(a.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
