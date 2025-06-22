import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Contact } from '@/types/contact';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { safeFormatTimestamp } from './utils';

export type ExportableEntity = 'contacts';

async function fetchContacts(userId: string): Promise<Contact[]> {
  const companyId = userId;
  const contactsCol = collection(db, 'companies', companyId, 'contacts');
  const q = query(contactsCol);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Contact);
}

function prepareContactsForExport(contacts: Contact[]) {
  return contacts.map(contact => {
    const { id, companyId, scoreJustification, tags, lastCommunicationDate, ...rest } = contact;
    return {
      ...rest,
      tags: tags?.join('|') || '',
      lastCommunicationDate: lastCommunicationDate
        ? safeFormatTimestamp(lastCommunicationDate, 'yyyy-MM-dd', '')
        : '',
    };
  });
}

export async function exportData(
  entity: ExportableEntity,
  userId: string,
  format: 'xlsx' | 'csv' = 'xlsx'
): Promise<Blob> {
  let data;
  switch (entity) {
    case 'contacts':
      const contacts = await fetchContacts(userId);
      if (contacts.length === 0) {
        throw new Error('No contacts to export.');
      }
      data = prepareContactsForExport(contacts);
      break;
    default:
      throw new Error('Unsupported entity type for export');
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, entity);

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8;',
  });
}
