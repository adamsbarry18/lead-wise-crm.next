'use client';

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/providers/auth-provider';
import { Contact, contactSchema } from '@/types/contact';
import Papa from 'papaparse';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { UploadCloud, File, X, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ImportDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onImportComplete: () => void;
}

type ImportStatus = 'idle' | 'parsing' | 'validating' | 'importing' | 'complete';
type ImportResult = {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: { row: number; message: string }[];
};

export function ImportContactsDialog({
  isOpen,
  onOpenChange,
  onImportComplete,
}: ImportDialogProps) {
  const { user } = useAuth();
  const t = useTranslations('ContactsPage.importDialog');
  const tToast = useTranslations('ContactsPage.importToast');
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const csvFile = acceptedFiles[0];
      if (csvFile && (csvFile.type === 'text/csv' || csvFile.name.endsWith('.csv'))) {
        setFile(csvFile);
        setResult(null);
        setStatus('idle');
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please upload a valid CSV file.',
        });
      }
    },
    [toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  });

  const handleClose = () => {
    if (status !== 'importing' && status !== 'validating') {
      setFile(null);
      setResult(null);
      setStatus('idle');
      setProgress(0);
      onOpenChange(false);
    }
  };
  const handleImport = async () => {
    if (!file || !user) {
      toast({
        title: tToast('noFileTitle'),
        description: tToast('noFileDescription'),
      });
      return;
    }

    setStatus('parsing');
    setProgress(10);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async results => {
        const rows = results.data as any[];
        const errors: { row: number; message: string }[] = [];
        let created = 0,
          updated = 0;
        const skipped = 0;

        setStatus('validating');
        const validContacts: (Omit<Contact, 'companyId'> & { originalRow: number })[] = [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowNum = i + 2; // CSV row number (1-based + header)

          try {
            // Data transformation
            if (row.score) row.score = parseInt(row.score, 10);
            if (row.tags) row.tags = (row.tags as string).split('|');
            else row.tags = [];

            // Zod validation
            const validation = contactSchema.omit({ companyId: true }).safeParse(row);
            if (!validation.success) {
              const formattedErrors = validation.error.errors
                .map(e => `${e.path.join('.')}: ${e.message}`)
                .join(', ');
              throw new Error(formattedErrors);
            }
            validContacts.push({ ...validation.data, originalRow: rowNum });
          } catch (error: any) {
            errors.push({ row: rowNum, message: error.message });
          }
          setProgress(10 + Math.round(((i + 1) / rows.length) * 40));
        }

        if (!user?.uid) return;
        setStatus('importing');
        const companyId = user.uid;
        const contactsRef = collection(db, 'companies', companyId, 'contacts');
        const batchSize = 490; // Firestore batch limit is 500 operations
        const batches = [];
        for (let i = 0; i < validContacts.length; i += batchSize) {
          batches.push(validContacts.slice(i, i + batchSize));
        }

        for (let i = 0; i < batches.length; i++) {
          const batch = writeBatch(db);
          const currentBatch = batches[i];

          for (const contact of currentBatch) {
            if (contact.id) {
              const docRef = doc(contactsRef, contact.id);
              batch.set(
                docRef,
                { ...contact, companyId, updatedAt: serverTimestamp() },
                { merge: true }
              );
              updated++;
            } else {
              const docRef = doc(contactsRef); // Create new doc with new ID
              batch.set(docRef, {
                ...contact,
                companyId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
              created++;
            }
          }

          try {
            await batch.commit();
          } catch (error: any) {
            errors.push({ row: 0, message: `Batch ${i + 1} failed: ${error.message}` });
          }
          setProgress(50 + Math.round(((i + 1) / batches.length) * 50));
        }

        setResult({ created, updated, skipped, failed: errors.length, errors });
        setStatus('complete');
        onImportComplete();
      },
      error: (error: any) => {
        toast({
          variant: 'destructive',
          title: tToast('errorTitle'),
          description: error.message,
        });
        setStatus('idle');
      },
    });
  };

  const renderContent = () => {
    if (status === 'complete' && result) {
      return (
        <div>
          <h3 className="font-semibold">{t('recapTitle')}</h3>
          <p className="text-sm text-muted-foreground">{t('recapDescription')}</p>
          <div className="my-4 rounded-md bg-muted p-4 text-center text-sm font-semibold">
            {t('summary', {
              created: result.created,
              updated: result.updated,
              skipped: result.skipped,
              failed: result.failed,
            })}
          </div>
          {result.errors.length > 0 && (
            <div>
              <h4 className="font-semibold">{t('errorsSectionTitle')}</h4>
              <ScrollArea className="h-40 mt-2 rounded-md border p-2">
                <div className="text-sm space-y-1">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-destructive">
                      - {t('errorRow', { row: err.row, message: err.message })}
                    </p>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      );
    }

    if (status !== 'idle') {
      let progressText = '';
      switch (status) {
        case 'parsing':
          progressText = t('processing');
          break;
        case 'validating':
          progressText = t('validating', { current: '...', total: '...' });
          break;
        case 'importing':
          progressText = t('importing', { currentBatch: '...', totalBatches: '...' });
          break;
      }
      return (
        <div className="flex flex-col items-center justify-center text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="font-semibold text-lg mb-2">{progressText}</p>
          <Progress value={progress} className="w-full" />
        </div>
      );
    }

    return (
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors
        ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="font-semibold">{t('dropzone')}</p>
        <p className="text-sm text-muted-foreground">CSV up to 5MB</p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {file && status === 'idle' && (
            <div className="flex items-center justify-between rounded-md bg-muted p-2 px-4">
              <div className="flex items-center gap-2">
                <File className="h-5 w-5" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          {!file && renderContent()}
          {file && status === 'idle' && <div className="mt-4">{renderContent()}</div>}
          {status !== 'idle' && renderContent()}
        </div>
        <DialogFooter>
          {status === 'complete' ? (
            <Button onClick={handleClose}>{t('close')}</Button>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={handleClose}
                disabled={status === 'importing' || status === 'validating'}
              >
                {t('cancel', { ns: 'ContactsPage' })}
              </Button>
              <Button onClick={handleImport} disabled={!file || status !== 'idle'}>
                <UploadCloud className="mr-2 h-4 w-4" />
                {t('startImport')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
