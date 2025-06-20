'use server';

/**
 * @fileOverview Generates a sales strategy for a given contact based on their interaction history.
 *
 * - generateSalesStrategyForContact - A function that generates a sales strategy for a contact.
 * - GenerateSalesStrategyForContactInput - The input type for the generateSalesStrategyForContact function.
 * - GenerateSalesStrategyForContactOutput - The return type for the generateSalesStrategyForContact function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
import { generateSalesStrategy, InteractionSummary, SalesStrategy } from '@/services/databoutton';

const GenerateSalesStrategyForContactInputSchema = z.object({
  contactSummary: z.string().describe('A summary of interactions with the contact.'),
});
export type GenerateSalesStrategyForContactInput = z.infer<
  typeof GenerateSalesStrategyForContactInputSchema
>;

const GenerateSalesStrategyForContactOutputSchema = z.object({
  salesStrategy: z.object({
    emailSequences: z.array(z.string()).describe('Suggested email sequences.'),
    followUps: z.array(z.string()).describe('Recommended follow-up actions.'),
    priorities: z.array(z.string()).describe('Prioritized actions.'),
  }),
});
export type GenerateSalesStrategyForContactOutput = z.infer<
  typeof GenerateSalesStrategyForContactOutputSchema
>;

export async function generateSalesStrategyForContact(
  input: GenerateSalesStrategyForContactInput
): Promise<GenerateSalesStrategyForContactOutput> {
  return generateSalesStrategyForContactFlow(input);
}

const generateSalesStrategyForContactFlow = ai.defineFlow<
  typeof GenerateSalesStrategyForContactInputSchema,
  typeof GenerateSalesStrategyForContactOutputSchema
>(
  {
    name: 'generateSalesStrategyForContactFlow',
    inputSchema: GenerateSalesStrategyForContactInputSchema,
    outputSchema: GenerateSalesStrategyForContactOutputSchema,
  },
  async input => {
    const interactionSummary: InteractionSummary = {
      summary: input.contactSummary,
    };

    const salesStrategy: SalesStrategy = await generateSalesStrategy(interactionSummary);

    return {
      salesStrategy: {
        emailSequences: salesStrategy.emailSequences,
        followUps: salesStrategy.followUps,
        priorities: salesStrategy.priorities,
      },
    };
  }
);
