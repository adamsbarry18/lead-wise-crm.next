import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { AuditLog, AuditLogDetails } from '@/types/audit-log';

interface LogEntry {
  userId: string;
  userEmail: string;
  companyId: string;
  action: 'import' | 'export';
  status: 'success' | 'partial' | 'failed';
  details: AuditLogDetails;
}

export async function createAuditLog(entry: LogEntry) {
  try {
    const auditLogRef = collection(db, 'companies', entry.companyId, 'auditLogs');
    await addDoc(auditLogRef, {
      ...entry,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // On ne propage pas l'erreur pour ne pas bloquer le flux principal
  }
}
