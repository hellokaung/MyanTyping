import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBurmeseLesson = async (topic: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<string> => {
  try {
    let constraints = "";
    switch (difficulty) {
        case 'easy':
            constraints = "Use very simple, common words and short, direct sentences (3-5 sentences). Avoid complex script combinations.";
            break;
        case 'medium':
            constraints = "Use standard vocabulary and moderate sentence length (5-8 sentences).";
            break;
        case 'hard':
            constraints = "Use advanced vocabulary, formal/literary style, and complex sentence structures (8-12 sentences). Include diverse script combinations.";
            break;
    }

    const prompt = `Write a paragraph in Burmese (Myanmar Unicode) about "${topic}" for typing practice. 
    Difficulty Level: ${difficulty.toUpperCase()}.
    ${constraints}
    Do not include any English translation or explanation, just the Burmese text.
    Ensure the spelling is grammatically correct.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error generating lesson:", error);
    throw new Error("Failed to generate lesson content.");
  }
};