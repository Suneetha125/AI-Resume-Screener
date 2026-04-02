import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Please add it to your environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export async function parseResume(text: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extract the following information from this resume text and return it as JSON:
    - name
    - email
    - phone
    - skills (array of strings)
    - experience (summary string)
    - education (summary string)

    Resume Text:
    ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          email: { type: Type.STRING },
          phone: { type: Type.STRING },
          skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          experience: { type: Type.STRING },
          education: { type: Type.STRING },
        },
        required: ["name", "email", "skills"],
      },
    },
  });

  if (!response.text) {
    throw new Error("AI failed to extract data from the resume.");
  }

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse AI response:", response.text);
    throw new Error("Failed to process AI response.");
  }
}

export async function matchResumeToJob(resumeText: string, jobDescription: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Compare the following resume against the job description. 
    Calculate scores (0-100) and provide a detailed analysis.
    Return the result as JSON.

    Job Description:
    ${jobDescription}

    Resume Text:
    ${resumeText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER, description: "Overall match score (0-100)" },
          similarityScore: { type: Type.NUMBER, description: "Semantic similarity score (0-100)" },
          skillMatchScore: { type: Type.NUMBER, description: "Skill overlap score (0-100)" },
          experienceScore: { type: Type.NUMBER, description: "Experience relevance score (0-100)" },
          analysis: {
            type: Type.OBJECT,
            properties: {
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
              reasoning: { type: Type.STRING },
            },
            required: ["strengths", "missingSkills", "reasoning"],
          },
        },
        required: ["score", "similarityScore", "skillMatchScore", "experienceScore", "analysis"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}
