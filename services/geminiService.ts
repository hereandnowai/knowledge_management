import { GoogleGenAI, GenerateContentResponse, GenerateContentParameters } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY for Gemini is not set. AI features will be disabled. Set process.env.API_KEY.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const GEN_MODEL = 'gemini-2.5';

export const generateText = async (prompt: string): Promise<string> => {
  if (!ai) return "AI service is unavailable (API key missing).";
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEN_MODEL,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating text from Gemini:", error);
    // Return a user-friendly error or re-throw as appropriate
    return `Error from AI: ${error instanceof Error ? error.message : String(error)}`;
  }
};

export const generateJson = async <T,>(prompt: string): Promise<T | null> => {
  if (!ai) {
    console.warn("AI service is unavailable (API key missing). Cannot generate JSON.");
    return null;
  }
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEN_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    // Additional check for empty string before parsing
    if (!jsonStr) {
        console.error("Empty JSON string received from AI.");
        throw new Error("Received empty JSON string from AI.");
    }

    return JSON.parse(jsonStr) as T;

  } catch (error) {
    console.error("Error generating or parsing JSON from Gemini:", error);
    // More specific error for the caller to handle if needed
    throw new Error(`Failed to generate or parse JSON from AI. AI response might not be valid JSON. Raw text (if available): ${ (error as any)?.response?.text || 'N/A'}. Original error: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const generateTextStream = async (
    prompt: string, 
    onChunk: (chunk: string) => void, 
    onError: (error: Error) => void, 
    onComplete: () => void
): Promise<void> => {
  if (!ai) {
    onError(new Error("AI service is unavailable (API key missing)."));
    onComplete();
    return;
  }
  try {
    const responseStream = await ai.models.generateContentStream({
      model: GEN_MODEL,
      contents: prompt,
    });
    for await (const chunk of responseStream) {
      onChunk(chunk.text);
    }
  } catch (error) {
    console.error("Error streaming text from Gemini:", error);
    onError(error instanceof Error ? error : new Error(String(error)));
  } finally {
    onComplete();
  }
};

export const isAIServiceAvailable = (): boolean => !!ai;
