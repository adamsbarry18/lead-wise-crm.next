import { db } from '@/lib/firebase';
import { contactSchema } from '@/types/contact';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';

export type ImportableEntity = 'contacts';

// Configuration pour chaque type d'entité importable
interface EntityConfig {
  schema: z.ZodSchema<any>;
  collectionPath: (userId: string) => string;
  transformRow: (row: any) => any;
}

const entityConfigs: Record<ImportableEntity, EntityConfig> = {
  contacts: {
    schema: contactSchema.omit({ companyId: true, id: true }), // Exclure les champs gérés par le système
    collectionPath: (userId: string) => `companies/${userId}/contacts`,
    transformRow: (row: any) => {
      // Transformation des données avant validation
      if (row.score && !isNaN(parseInt(row.score, 10))) {
        row.score = parseInt(row.score, 10);
      } else {
        delete row.score; // Supprimer si invalide pour passer la validation Zod
      }
      row.tags =
        typeof row.tags === 'string'
          ? row.tags
              .split('|')
              .map((t: string) => t.trim())
              .filter(Boolean)
          : [];
      return row;
    },
  },
};

/**
 * Valide et importe les données dans Firestore.
 * @param entity Le type d'entité à importer
 * @param userId L'ID de l'utilisateur
 * @param data Les données parsées du fichier CSV
 * @returns Un objet avec les résultats de l'importation
 */
export async function importData(
  entity: ImportableEntity,
  userId: string,
  data: any[]
): Promise<{ created: number; errors: { row: number; message: string }[] }> {
  const config = entityConfigs[entity];
  if (!config) throw new Error(`Unsupported entity type for import: ${entity}`);

  const errors: { row: number; message: string }[] = [];
  let created = 0;

  const validRows: any[] = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2; // +1 pour l'index 0, +1 pour la ligne d'en-tête

    try {
      const transformedRow = config.transformRow(row);
      const validation = config.schema.safeParse(transformedRow);
      if (!validation.success) {
        const formattedErrors = validation.error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        throw new Error(formattedErrors);
      }
      validRows.push(validation.data);
    } catch (error: any) {
      errors.push({ row: rowNum, message: error.message });
    }
  }

  const entityCollectionRef = collection(db, config.collectionPath(userId));
  const batchSize = 490; // La limite Firestore est de 500 opérations par batch

  for (let i = 0; i < validRows.length; i += batchSize) {
    const batchData = validRows.slice(i, i + batchSize);
    const batch = writeBatch(db);

    for (const item of batchData) {
      const docRef = doc(entityCollectionRef); // Créer un nouveau document
      batch.set(docRef, {
        ...item,
        companyId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      created++;
    }

    try {
      await batch.commit();
    } catch (e: any) {
      errors.push({
        row: i,
        message: `Batch (lignes ${i + 2}-${i + 2 + batchData.length}) a échoué: ${e.message}`,
      });
      created -= batchData.length; // Annuler le comptage pour le batch échoué
    }
  }

  return { created, errors };
}
