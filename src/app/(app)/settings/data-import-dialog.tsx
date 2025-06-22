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
import Papa from 'papaparse';
import { UploadCloud, File, X, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { importData, ImportableEntity } from '@/lib/import';
import { Separator } from '@/components/ui/separator';
import { createAuditLog } from '@/lib/audit';

interface DataImportDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onImportComplete: () => void;
}

type ImportStep = 'select_entity' | 'upload_file' | 'importing' | 'complete';
type ImportResult = {
  created: number;
  errors: { row: number; message: string }[];
};

export function DataImportDialog({
  isOpen,
  onOpenChange,
  onImportComplete,
}: DataImportDialogProps) {
  const { user } = useAuth();
  const t = useTranslations('SettingsPage.importDialog');
  const { toast } = useToast();

  const [step, setStep] = useState<ImportStep>('select_entity');
  const [entity, setEntity] = useState<ImportableEntity | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  const resetState = () => {
    setStep('select_entity');
    setEntity('');
    setFile(null);
    setProgress(0);
    setResult(null);
  };

  const handleClose = () => {
    if (step !== 'importing') {
      resetState();
      onOpenChange(false);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const csvFile = acceptedFiles[0];
      if (csvFile && (csvFile.type === 'text/csv' || csvFile.name.endsWith('.csv'))) {
        setFile(csvFile);
      } else {
        toast({
          variant: 'destructive',
          title: t('invalidFileTypeTitle'),
          description: t('invalidFileTypeDescription'),
        });
      }
    },
    [toast, t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
    disabled: step !== 'upload_file',
  });

  const handleImport = async () => {
    if (!file || !user || !entity) return;

    setStep('importing');
    setProgress(5);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async results => {
        setProgress(20);
        const rows = results.data as any[];
        const importResult = await importData(entity, user.uid, rows);

        await createAuditLog({
          userId: user.uid,
          userEmail: user.email!,
          companyId: user.uid,
          action: 'import',
          status:
            importResult.errors.length > 0
              ? importResult.created > 0
                ? 'partial'
                : 'failed'
              : 'success',
          details: {
            entity: entity,
            fileType: 'csv',
            recordCount: rows.length,
            errors: importResult.errors,
          },
        });

        setProgress(100);
        setResult(importResult);
        setStep('complete');
        onImportComplete();
      },
      error: async (error: any) => {
        toast({ variant: 'destructive', title: t('parseErrorTitle'), description: error.message });
        setStep('upload_file');
        await createAuditLog({
          userId: user.uid,
          userEmail: user.email!,
          companyId: user.uid,
          action: 'import',
          status: 'failed',
          details: { entity, fileType: 'csv' },
        });
      },
    });
  };

  const renderContent = () => {
    switch (step) {
      case 'select_entity':
        return (
          <div className="space-y-2">
            <Label htmlFor="entity-select">{t('selectEntityLabel')}</Label>
            <Select value={entity} onValueChange={value => setEntity(value as ImportableEntity)}>
              <SelectTrigger id="entity-select">
                <SelectValue placeholder={t('selectEntityPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contacts">{t('entityContacts')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 'upload_file':
        return (
          <div>
            {!file ? (
              <div
                {...getRootProps()}
                className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="font-semibold">{t('dropzone')}</p>
                <p className="text-sm text-muted-foreground">{t('dropzoneHint')}</p>
              </div>
            ) : (
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
          </div>
        );
      case 'importing':
        return (
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="font-semibold text-lg mb-2">{t('importingStatus')}</p>
            <Progress value={progress} className="w-full" />
          </div>
        );
      case 'complete':
        return (
          <div>
            <h3 className="font-semibold">{t('recapTitle')}</h3>
            <div className="my-4 rounded-md bg-muted p-4 text-center text-sm font-semibold">
              {t('summary', {
                created: result?.created || 0,
                updated: 0,
                skipped: 0,
                failed: result?.errors.length || 0,
              })}
            </div>
            {result && result.errors.length > 0 && (
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
  };

  const renderFooter = () => {
    switch (step) {
      case 'select_entity':
        return (
          <>
            <Button variant="ghost" onClick={handleClose}>
              {t('cancel')}
            </Button>
            <Button onClick={() => setStep('upload_file')} disabled={!entity}>
              {t('next')}
            </Button>
          </>
        );
      case 'upload_file':
        return (
          <>
            <Button variant="ghost" onClick={() => setStep('select_entity')}>
              {t('previous')}
            </Button>
            <Button onClick={handleImport} disabled={!file}>
              <UploadCloud className="mr-2 h-4 w-4" />
              {t('startImport')}
            </Button>
          </>
        );
      case 'importing':
        return <Button disabled>{t('importingButton')}</Button>;
      case 'complete':
        return <Button onClick={handleClose}>{t('close')}</Button>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="py-4 min-h-[200px] flex flex-col justify-center">{renderContent()}</div>
        <DialogFooter>{renderFooter()}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
