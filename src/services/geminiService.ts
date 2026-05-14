import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface StoryboardPanel {
  sceneNumber: number;
  description: string;
  visualPrompt: string;
  dialogue?: string;
  imageUrl?: string;
}

export async function extractPanels(script: string): Promise<StoryboardPanel[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following movie script and break it down into a sequence of important storyboard panels. 
    For each panel, provide:
    1. Scene number
    2. A brief description of the action.
    3. A detailed visual prompt for an image generation model to illustrate this scene (include style, lighting, and composition).
    4. Any dialogue or captions associated with this specific panel.

    Script:
    ${script}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sceneNumber: { type: Type.NUMBER },
            description: { type: Type.STRING },
            visualPrompt: { type: Type.STRING },
            dialogue: { type: Type.STRING },
          },
          required: ["sceneNumber", "description", "visualPrompt"],
        },
      },
    },
  });

  const jsonStr = response.text?.trim();
  if (!jsonStr) return [];
  return JSON.parse(jsonStr);
}

export async function generatePanelImage(prompt: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            text: `High-quality cinematic storyboard panel, professional concept art style. ${prompt}`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
}
