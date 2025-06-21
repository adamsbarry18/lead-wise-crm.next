'use server';

/**
 * @fileOverview A lead scoring AI agent.
 *
 * - scoreLead - A function that handles the lead scoring process.
 * - ScoreLeadInput - The input type for the scoreLead function.
 * - ScoreLeadOutput - The return type for the scoreLead function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

const ScoreLeadInputSchema = z.object({
  engagement: z.string().describe('The level of engagement of the lead.'),
  exchanges: z.string().describe('A summary of the exchanges with the lead.'),
  history: z.string().describe('The historical interactions with the lead.'),
  otherCriteria: z.string().describe('Other relevant criteria for scoring the lead.'),
  locale: z.string().optional().describe('The locale for the output language, e.g., "fr" or "en".'),
});
export type ScoreLeadInput = z.infer<typeof ScoreLeadInputSchema>;

const ScoreLeadOutputSchema = z.object({
  score: z.number().describe('The calculated score of the lead (0-100).'),
  justification: z.string().describe('The justification for the calculated score.'),
});
export type ScoreLeadOutput = z.infer<typeof ScoreLeadOutputSchema>;

export async function scoreLead(input: ScoreLeadInput): Promise<ScoreLeadOutput> {
  return scoreLeadFlow(input);
}

const scoreLeadFlow = ai.defineFlow<typeof ScoreLeadInputSchema, typeof ScoreLeadOutputSchema>(
  {
    name: 'scoreLeadFlow',
    inputSchema: ScoreLeadInputSchema,
    outputSchema: ScoreLeadOutputSchema,
  },
  async input => {
    const language = input.locale === 'fr' ? 'French' : 'English';
    const prompt = `You are an expert lead scoring AI. Analyze the provided information about a lead and return a score between 0 and 100 along with a detailed justification. **Respond exclusively in ${language}.**

Scoring Guidelines:
- 0-20: Cold lead, no engagement
- 21-40: Warm lead, some interest
- 41-60: Qualified lead, good engagement
- 61-80: Hot lead, high engagement
- 81-100: Very hot lead, ready to convert

Consider these factors:
1. Engagement level and frequency
2. Quality of exchanges and interactions
3. Historical behavior and patterns
4. Additional criteria provided

Lead Information:
- Engagement: ${input.engagement}
- Exchanges: ${input.exchanges}
- History: ${input.history}
- Other Criteria: ${input.otherCriteria}

Please provide a score and detailed justification based on this information.`;

    const response = await ai.generate({
      prompt,
      model: 'googleai/gemini-2.0-flash',
    });

    // Parse the response to extract score and justification
    const text = response.text;

    // Try to extract score from the response
    const scoreMatch = text.match(/(?:score|note|évaluation)[:\s]*(\d{1,3})/i);
    const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1]))) : 50;

    // Use the full response as justification, or extract a specific section
    const justification =
      text.replace(/(?:score|note|évaluation)[:\s]*\d{1,3}/i, '').trim() || text;

    return {
      score,
      justification:
        justification.length > 200 ? justification.substring(0, 200) + '...' : justification,
    };
  }
);
