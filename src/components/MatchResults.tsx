import React, { useState } from 'react';
import { MatchResult, Resume, JobDescription } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { db, auth } from '../firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { matchResumeToJob } from '../services/gemini';
import { Brain, CheckCircle2, AlertCircle, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MatchResultsProps {
  matches: MatchResult[];
  resumes: Resume[];
  jobs: JobDescription[];
  selectedJobId: string | null;
}

export default function MatchResults({ matches, resumes, jobs, selectedJobId }: MatchResultsProps) {
  const [isMatching, setIsMatching] = useState(false);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredMatches = selectedJobId 
    ? matches.filter(m => m.jobId === selectedJobId)
    : matches;

  const handleRunMatch = async () => {
    if (!selectedJobId) return;
    const job = jobs.find(j => j.id === selectedJobId);
    if (!job) return;

    setIsMatching(true);
    setError(null);
    try {
      // For each resume that hasn't been matched to this job yet
      const unmatchedResumes = resumes.filter(r => 
        !matches.some(m => m.resumeId === r.id && m.jobId === selectedJobId)
      );

      if (unmatchedResumes.length === 0) {
        setError('All resumes have already been matched to this job.');
        return;
      }

      for (const resume of unmatchedResumes) {
        const result = await matchResumeToJob(resume.rawText, job.description);
        const matchRef = doc(collection(db, 'matches'));
        await setDoc(matchRef, {
          ...result,
          id: matchRef.id,
          userId: auth.currentUser?.uid,
          resumeId: resume.id,
          jobId: selectedJobId,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to match resumes.');
    } finally {
      setIsMatching(false);
    }
  };

  if (!selectedJobId) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
        <Brain className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">Select a job description to view candidate rankings</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700">
          Ranked Candidates ({filteredMatches.length})
        </h3>
        <Button onClick={handleRunMatch} disabled={isMatching || resumes.length === 0} size="sm">
          {isMatching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Run AI Matcher
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-3">
        {filteredMatches.map((match, index) => {
          const resume = resumes.find(r => r.id === match.resumeId);
          const isExpanded = expandedMatch === match.id;

          return (
            <Card key={match.id} className={`overflow-hidden transition-all ${isExpanded ? 'ring-2 ring-indigo-500 border-transparent' : ''}`}>
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedMatch(isExpanded ? null : match.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center w-12 h-12 bg-indigo-50 rounded-xl">
                    <span className="text-xs text-indigo-600 font-bold">#{index + 1}</span>
                    <span className="text-lg font-black text-indigo-700">{Math.round(match.score)}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{resume?.extractedData.name || 'Unknown Candidate'}</h4>
                    <p className="text-sm text-slate-500">{resume?.extractedData.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden md:flex gap-4 text-xs font-medium">
                    <div className="text-center">
                      <p className="text-slate-400 uppercase tracking-wider">Skills</p>
                      <p className="text-slate-900">{Math.round(match.skillMatchScore)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400 uppercase tracking-wider">Exp</p>
                      <p className="text-slate-900">{Math.round(match.experienceScore)}%</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
              </div>

              {isExpanded && (
                <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          Key Strengths
                        </h5>
                        <ul className="space-y-1">
                          {match.analysis.strengths.map((s, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="w-1 h-1 bg-slate-400 rounded-full mt-2 flex-shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                          Missing Skills
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {match.analysis.missingSkills.map((s, i) => (
                            <span key={i} className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded-md border border-amber-100">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <h5 className="text-sm font-bold text-slate-900 mb-2">AI Reasoning</h5>
                      <div className="text-sm text-slate-600 prose prose-slate max-w-none">
                        <ReactMarkdown>{match.analysis.reasoning}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        {filteredMatches.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-500">No matches found for this job. Click "Run AI Matcher" to analyze resumes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
