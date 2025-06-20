// src/ai/flows/score-lead.ts
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
});
export type ScoreLeadInput = z.infer<typeof ScoreLeadInputSchema>;

const ScoreLeadOutputSchema = z.object({
  score: z.number().describe('The calculated score of the lead.'),
  justification: z.string().describe('The justification for the calculated score.'),
});
export type ScoreLeadOutput = z.infer<typeof ScoreLeadOutputSchema>;

export async function scoreLead(input: ScoreLeadInput): Promise<ScoreLeadOutput> {
  return scoreLeadFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scoreLeadPrompt',
  input: {
    schema: z.object({
      engagement: z.string().describe('The level of engagement of the lead.'),
      exchanges: z.string().describe('A summary of the exchanges with the lead.'),
      history: z.string().describe('The historical interactions with the lead.'),
      otherCriteria: z.string().describe('Other relevant criteria for scoring the lead.'),
    }),
  },
  output: {
    schema: z.object({
      score: z.number().describe('The calculated score of the lead.'),
      justification: z.string().describe('The justification for the calculated score.'),
    }),
  },
  prompt: `You are an AI expert in lead scoring. You will receive information about a lead and must return a numeric score and a justification for that score. Consider engagement, exchanges, historical interactions, and any other relevant criteria provided. Return a score between 0 and 100.

Engagement: {{{engagement}}}
Exchanges: {{{exchanges}}}
History: {{{history}}}
Other Criteria: {{{otherCriteria}}}`,
});

const scoreLeadFlow = ai.defineFlow<typeof ScoreLeadInputSchema, typeof ScoreLeadOutputSchema>(
  {
    name: 'scoreLeadFlow',
    inputSchema: ScoreLeadInputSchema,
    outputSchema: ScoreLeadOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
