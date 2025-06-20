import * as z from 'zod';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp

// Zod schema for validation
export const contactSchema = z.object({
  id: z.string().optional(), // Firestore document ID, optional during creation
  companyId: z.string().describe('ID of the company this contact belongs to'), // Add companyId
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['Prospect', 'Lead', 'MQL', 'Customer', 'Partner']).default('Prospect'),
  jobTitle: z.string().optional(),
  tags: z.array(z.string()).optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
  score: z.number().min(0).max(100).optional().describe('AI-calculated score (0-100)'),
  scoreJustification: z.string().optional().describe('Justification for the AI score'),
  lastScoredAt: z
    .custom<Timestamp>(val => val instanceof Timestamp)
    .optional()
    .describe('Timestamp of the last scoring'),
  timezone: z.string().optional(),
  // Use Firestore Timestamp for dates
  lastCommunicationDate: z.custom<Timestamp>(val => val instanceof Timestamp).optional(),
  lastCommunicationMethod: z.string().optional(),
  communicationSummary: z.string().optional().describe('AI summary of communications'),
  communicatedBy: z.string().optional().describe('Agent/User who last communicated'),
  // Add fields for custom field management if needed later
  // customFields: z.record(z.any()).optional(),
  createdAt: z.custom<Timestamp>(val => val instanceof Timestamp).optional(),
  updatedAt: z.custom<Timestamp>(val => val instanceof Timestamp).optional(),
});

// TypeScript interface derived from the schema
export type Contact = z.infer<typeof contactSchema>;

// Example of Firestore Timestamp creation:
// import { Timestamp } from 'firebase/firestore';
// const now = Timestamp.now();
