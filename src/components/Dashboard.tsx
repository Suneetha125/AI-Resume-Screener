import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Resume, JobDescription, MatchResult } from '../types';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Plus, FileText, Briefcase, BarChart3, LogOut, Search, Filter } from 'lucide-react';
import ResumeUpload from './ResumeUpload';
import JobDescriptionInput from './JobDescriptionInput';
import MatchResults from './MatchResults';

export default function Dashboard() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [activeTab, setActiveTab] = useState<'resumes' | 'jobs' | 'matches'>('matches');
  const [showUpload, setShowUpload] = useState(false);
  const [showJobInput, setShowJobInput] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const resumesQuery = query(
      collection(db, 'resumes'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const matchesQuery = query(
      collection(db, 'matches'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('score', 'desc')
    );

    const unsubResumes = onSnapshot(resumesQuery, (snapshot) => {
      setResumes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resume)));
    });
    const unsubJobs = onSnapshot(jobsQuery, (snapshot) => {
      setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobDescription)));
    });
    const unsubMatches = onSnapshot(matchesQuery, (snapshot) => {
      setMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MatchResult)));
    });

    return () => {
      unsubResumes();
      unsubJobs();
      unsubMatches();
    };
  }, []);

  const handleLogout = () => auth.signOut();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-slate-900">AI Screener</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden sm:block">{auth.currentUser?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 space-y-2">
            <button
              onClick={() => setActiveTab('matches')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'matches' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Rankings
            </button>
            <button
              onClick={() => setActiveTab('resumes')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'resumes' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-5 h-5" />
              Resumes ({resumes.length})
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'jobs' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Briefcase className="w-5 h-5" />
              Job Descriptions ({jobs.length})
            </button>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 capitalize">{activeTab}</h2>
              <div className="flex gap-2">
                {activeTab === 'resumes' && (
                  <Button onClick={() => setShowUpload(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Resumes
                  </Button>
                )}
                {activeTab === 'jobs' && (
                  <Button onClick={() => setShowJobInput(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Job
                  </Button>
                )}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'matches' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Search className="w-4 h-4 text-slate-400" />
                    <Input placeholder="Search candidates..." className="max-w-xs" />
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <span className="text-sm text-slate-500">Filter by Job:</span>
                    <select 
                      className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      onChange={(e) => setSelectedJobId(e.target.value || null)}
                      value={selectedJobId || ''}
                    >
                      <option value="">All Jobs</option>
                      {jobs.map(job => (
                        <option key={job.id} value={job.id}>{job.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <MatchResults matches={matches} resumes={resumes} jobs={jobs} selectedJobId={selectedJobId} />
              </div>
            )}

            {activeTab === 'resumes' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {resumes.map(resume => (
                  <Card key={resume.id} className="p-4 hover:border-indigo-200 transition-colors cursor-pointer group">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                        <FileText className="w-5 h-5 text-slate-500 group-hover:text-indigo-600" />
                      </div>
                      <span className="text-xs text-slate-400">{new Date(resume.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-semibold text-slate-900 truncate">{resume.extractedData.name || resume.fileName}</h3>
                      <p className="text-sm text-slate-500 truncate">{resume.extractedData.email}</p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1">
                      {resume.extractedData.skills?.slice(0, 3).map(skill => (
                        <span key={skill} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{skill}</span>
                      ))}
                      {resume.extractedData.skills?.length > 3 && (
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">+{resume.extractedData.skills.length - 3}</span>
                      )}
                    </div>
                  </Card>
                ))}
                {resumes.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-500">
                    No resumes uploaded yet. Click "Upload Resumes" to get started.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="grid grid-cols-1 gap-4">
                {jobs.map(job => (
                  <Card key={job.id} className="p-6 hover:border-indigo-200 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{job.description}</p>
                      </div>
                      <span className="text-xs text-slate-400">{new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {job.requiredSkills.map(skill => (
                        <span key={skill} className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full font-medium">{skill}</span>
                      ))}
                    </div>
                  </Card>
                ))}
                {jobs.length === 0 && (
                  <div className="py-12 text-center text-slate-500">
                    No job descriptions added yet. Click "New Job" to get started.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {showUpload && <ResumeUpload onClose={() => setShowUpload(false)} />}
      {showJobInput && <JobDescriptionInput onClose={() => setShowJobInput(false)} />}
    </div>
  );
}
