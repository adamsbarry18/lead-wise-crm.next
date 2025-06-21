import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Vérifier que l'API key est définie
if (!process.env.GOOGLE_GENAI_API_KEY) {
  console.warn('GOOGLE_GENAI_API_KEY is not set. AI features will not work.');
}

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY || '',
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
