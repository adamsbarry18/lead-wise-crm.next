'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { exportData, ExportableEntity } from '@/lib/export';
import { Download, Loader2 } from 'lucide-react';
import { createAuditLog } from '@/lib/audit';
import { db } from '@/lib/firebase';
import { collection, getDocs, QuerySnapshot } from 'firebase/firestore';

interface DataExportDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function DataExportDialog({ isOpen, onOpenChange }: DataExportDialogProps) {
  const [entity, setEntity] = useState<ExportableEntity | ''>('');
  const [isExporting, setIsExporting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('SettingsPage');

  const handleExport = async () => {
    if (!user || !entity) return;

    setIsExporting(true);
    try {
      const blob = await exportData(entity, user.uid);

      const entityCollectionRef = collection(db, 'companies', user.uid, entity);
      const snapshot = await getDocs(entityCollectionRef);
      const recordCount = snapshot.size;

      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `${entity}-export-${new Date().toISOString().split('T')[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: t('exportSuccessTitle'),
        description: t('exportSuccessDescription', { entity }),
      });

      await createAuditLog({
        userId: user.uid,
        userEmail: user.email!,
        companyId: user.uid,
        action: 'export',
        status: 'success',
        details: { entity, recordCount, fileType: 'xlsx' },
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('exportErrorTitle'),
        description: (error as Error).message,
      });
      await createAuditLog({
        userId: user.uid,
        userEmail: user.email!,
        companyId: user.uid,
        action: 'export',
        status: 'failed',
        details: { entity, fileType: 'xlsx' },
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('exportDialogTitle')}</DialogTitle>
          <DialogDescription>{t('exportDialogDescription')}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Label htmlFor="entity-select">{t('selectEntityLabel')}</Label>
          <Select
            value={entity}
            onValueChange={value => setEntity(value as ExportableEntity)}
            disabled={isExporting}
          >
            <SelectTrigger id="entity-select">
              <SelectValue placeholder={t('selectEntityPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contacts">{t('entityContacts')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t('cancelButton')}</Button>
          </DialogClose>
          <Button onClick={handleExport} disabled={!entity || isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isExporting ? t('exportingButton') : t('exportButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
