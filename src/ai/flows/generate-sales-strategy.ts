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

const GenerateSalesStrategyForContactInputSchema = z.object({
  contactSummary: z.string().describe('A summary of interactions with the contact.'),
  locale: z.string().optional().describe('The locale for the output language, e.g., "fr" or "en".'),
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
    const language = input.locale === 'fr' ? 'French' : 'English';
    const prompt = `You are an expert sales strategist. Based on the contact summary provided, generate a comprehensive sales strategy with three key components. **Respond exclusively in ${language}.**

1.  Email Sequences: 3-5 suggested email sequences to engage the contact
2.  Follow-ups: 3-5 recommended follow-up actions
3.  Priorities: 3-5 prioritized actions to move the contact through the sales funnel

Contact Summary: ${input.contactSummary}

Please provide specific, actionable recommendations that are tailored to this contact's situation. Focus on building relationships and moving them toward a sale.`;

    const response = await ai.generate({
      prompt,
      model: 'googleai/gemini-2.0-flash',
    });

    const text = response.text;

    // Parse the response to extract structured data
    const lines = text.split('\n').filter(line => line.trim());

    const emailSequences: string[] = [];
    const followUps: string[] = [];
    const priorities: string[] = [];

    let currentSection = '';

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (
        lowerLine.includes('email') ||
        lowerLine.includes('sequence') ||
        lowerLine.includes('séquence')
      ) {
        currentSection = 'email';
      } else if (
        lowerLine.includes('follow') ||
        lowerLine.includes('action') ||
        lowerLine.includes('suivi')
      ) {
        currentSection = 'followup';
      } else if (
        lowerLine.includes('priority') ||
        lowerLine.includes('focus') ||
        lowerLine.includes('priorité')
      ) {
        currentSection = 'priority';
      } else if (
        line.trim() &&
        !line.startsWith('-') &&
        !line.startsWith('•') &&
        !line.startsWith('*')
      ) {
        continue;
      } else if (
        line.trim() &&
        (line.startsWith('-') || line.startsWith('•') || line.startsWith('*'))
      ) {
        const content = line.replace(/^[-•*]\s*/, '').trim();
        if (content) {
          switch (currentSection) {
            case 'email':
              emailSequences.push(content);
              break;
            case 'followup':
              followUps.push(content);
              break;
            case 'priority':
              priorities.push(content);
              break;
          }
        }
      }
    }

    // Fallback if parsing didn't work well
    if (emailSequences.length === 0 && followUps.length === 0 && priorities.length === 0) {
      priorities.push(...lines);
    }

    return {
      salesStrategy: {
        emailSequences: emailSequences.slice(0, 5),
        followUps: followUps.slice(0, 5),
        priorities: priorities.slice(0, 5),
      },
    };
  }
);
