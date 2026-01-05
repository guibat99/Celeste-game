
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getCelestialGuidance = async (deaths: number, levelName: string) => {
  if (!process.env.API_KEY) return "The mountain is steep, but you are stronger.";
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The player has died ${deaths} times on level "${levelName}". Give a short, poetic, and encouraging 1-sentence advice or flavor text in the style of the game Celeste's Theo or Granny. Don't be too repetitive. Use the character "Crystal" as the narrator.`,
      config: {
        maxOutputTokens: 100,
        temperature: 0.8,
      }
    });
    return response.text?.trim() || "Breathe. You can do this.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Every fall is a lesson. Keep climbing.";
  }
};
