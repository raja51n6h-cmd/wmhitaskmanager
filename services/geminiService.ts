
import { GoogleGenAI } from "@google/genai";
import { Message, Job } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const summarizeJobChat = async (job: Job): Promise<string> => {
  const transcript = job.messages.map(m => {
    const sender = m.senderId === 'u1' ? 'Office' : 'Site Team';
    return `${sender}: ${m.text}`;
  }).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        You are a construction project assistant for West Midlands Home Improvements.
        Read the following internal chat transcript for a job at ${job.address}.
        
        Transcript:
        ${transcript}
        
        Provide a concise 3-bullet point summary of the current status and any issues. 
        Format as a plain text list using "• " for bullets.
      `,
    });
    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating summary. Please check API configuration.";
  }
};

export const draftClientUpdate = async (job: Job, notes: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        You are an office manager for West Midlands Home Improvements. 
        Draft a professional, friendly SMS update to the client (${job.clientName}).
        
        Context: The job is a ${job.type} at ${job.address}.
        Internal Site Notes: "${notes}"
        
        The tone should be reassuring and professional. Keep it under 160 characters if possible, or very short.
        Do not include placeholders like [Your Name]. Sign off as "The WMHI Team".
      `,
    });
    return response.text || "Could not generate draft.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating draft.";
  }
};
