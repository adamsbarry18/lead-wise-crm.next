import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

export const AuditLogDetailsSchema = z.object({
  entity: z.string(),
  fileType: z.string().optional(),
  recordCount: z.number().optional(),
  errors: z
    .array(
      z.object({
        row: z.number(),
        message: z.string(),
      })
    )
    .optional(),
});

export const AuditLogSchema = z.object({
  id: z.string().optional(),
  companyId: z.string(),
  userId: z.string(),
  userEmail: z.string(),
  action: z.enum(['import', 'export']),
  status: z.enum(['success', 'partial', 'failed']),
  createdAt: z.custom<Timestamp>(val => val instanceof Timestamp),
  details: AuditLogDetailsSchema,
});

export type AuditLog = z.infer<typeof AuditLogSchema>;
export type AuditLogDetails = z.infer<typeof AuditLogDetailsSchema>;
