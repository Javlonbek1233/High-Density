import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function getAssistantResponse(history: ChatMessage[], prompt: string) {
  try {
    const chat = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: "You are VoltX AI, a high-performance EV driving assistant. You provide technical insights about battery health, range optimization, and charging strategy. Keep responses concise and futuristic." }]
        },
        ...history.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })),
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    });

    const response = await chat;
    return response.text || "I am currently recalibrating my sensors. Please standby.";
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return "Connection lost. Re-establishing link to central command...";
  }
}
