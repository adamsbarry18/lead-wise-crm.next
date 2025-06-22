import { z } from 'zod';

export const CustomFieldSchema = z.object({
  id: z.string().optional(),
  entity: z.enum(['contacts']), // Pour l'instant, seulement les contacts
  label: z.string().min(1, 'Le nom est requis'),
  name: z
    .string()
    .min(1, 'Le nom interne est requis')
    .regex(
      /^[a-z0-9_]+$/,
      'Le nom interne ne peut contenir que des lettres minuscules, des chiffres et des underscores.'
    ),
  type: z.enum(['text', 'number', 'date', 'select']),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  companyId: z.string(),
});

export type CustomField = z.infer<typeof CustomFieldSchema>;
