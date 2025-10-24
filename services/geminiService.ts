import { GoogleGenAI, Type } from "@google/genai";
import type { Transcription } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const transcriptionSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'A concise, descriptive title for the transcript, under 10 words.'
    },
    content: {
      type: Type.STRING,
      description: 'The full transcribed text, cleaned and formatted.'
    },
  },
  required: ['title', 'content'],
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<Transcription> => {
  const audioPart = {
    inlineData: {
      data: base64Audio,
      mimeType,
    },
  };

  const textPart = {
    text: `Transcribe the following audio. Your primary goal is to create a clean, highly readable transcript. Perform the following actions:
1.  Remove all filler words (e.g., 'um', 'uh', 'like') and verbal pauses.
2.  Correct grammatical errors and refine sentence structure for clarity.
3.  Group related sentences into logical paragraphs. Add paragraph breaks (double newlines) to separate distinct topics or ideas.
4.  Generate a concise, descriptive title for the transcript.`
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [audioPart, textPart] },
    config: {
      responseMimeType: 'application/json',
      responseSchema: transcriptionSchema,
    },
  });

  const jsonString = response.text.trim();
  return JSON.parse(jsonString) as Transcription;
};

export const reformatText = async (originalText: string, format: string, style: string): Promise<Transcription> => {
  const prompt = `
    Reformat the following text into a "${format}" with a "${style}" tone.
    Generate a new, appropriate title for the reformatted content.

    Original Text:
    ---
    ${originalText}
    ---
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: transcriptionSchema,
      temperature: 0.7,
    }
  });

  const jsonString = response.text.trim();
  return JSON.parse(jsonString) as Transcription;
};
