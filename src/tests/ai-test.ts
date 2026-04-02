import { matchResumeToJob } from '../services/gemini';

/**
 * Simple test script to verify AI Matching logic.
 * Run this in a controlled environment or call it from a dev-only UI button.
 */
export async function testAIMatcher() {
  const sampleResume = `
    John Doe
    Software Engineer
    Skills: React, TypeScript, Node.js, Firebase
    Experience: 5 years of building web applications.
  `;

  const sampleJD = `
    Senior Frontend Developer
    We are looking for someone with expertise in React and TypeScript.
    Experience with Firebase is a plus.
  `;

  console.log('Testing AI Matcher...');
  try {
    const result = await matchResumeToJob(sampleResume, sampleJD);
    console.log('Match Result:', result);
    
    if (typeof result.score === 'number' && result.score >= 0 && result.score <= 100) {
      console.log('✅ AI Matcher test passed!');
    } else {
      console.error('❌ AI Matcher returned invalid score.');
    }
  } catch (error) {
    console.error('❌ AI Matcher test failed:', error);
  }
}
