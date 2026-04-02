export interface Resume {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  rawText: string;
  extractedData: {
    name: string;
    email: string;
    phone: string;
    skills: string[];
    experience: string;
    education: string;
  };
  createdAt: string;
}

export interface JobDescription {
  id: string;
  userId: string;
  title: string;
  description: string;
  requiredSkills: string[];
  createdAt: string;
}

export interface MatchResult {
  id: string;
  resumeId: string;
  jobId: string;
  score: number; // 0-100
  similarityScore: number; // 0-100
  skillMatchScore: number; // 0-100
  experienceScore: number; // 0-100
  analysis: {
    strengths: string[];
    missingSkills: string[];
    reasoning: string;
  };
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'recruiter' | 'admin';
}
