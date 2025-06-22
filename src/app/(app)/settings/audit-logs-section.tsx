'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, query, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { useTranslations } from 'next-intl';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/auth-provider';
import { AuditLog } from '@/types/audit-log';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const LOGS_PER_PAGE = 10;

export function AuditLogsSection() {
  const t = useTranslations('SettingsPage.auditLogs');
  const { user } = useAuth();
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [allLogs, setAllLogs] = useState<AuditLog[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ['auditLogs', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, 'companies', user.uid, 'auditLogs'),
        orderBy('createdAt', 'desc'),
        limit(LOGS_PER_PAGE)
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      setLastDoc(docs[docs.length - 1]);
      setHasMore(docs.length === LOGS_PER_PAGE);
      const initialLogs = docs.map(doc => ({ id: doc.id, ...doc.data() }) as AuditLog);
      setAllLogs(initialLogs);
      return initialLogs;
    },
    enabled: !!user,
  });

  const loadMore = async () => {
    if (!user || !lastDoc || !hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const q = query(
        collection(db, 'companies', user.uid, 'auditLogs'),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(LOGS_PER_PAGE)
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      setLastDoc(docs[docs.length - 1]);
      setHasMore(docs.length === LOGS_PER_PAGE);

      const newLogs = docs.map(doc => ({ id: doc.id, ...doc.data() }) as AuditLog);
      setAllLogs(prev => [...prev, ...newLogs]);
    } catch (error) {
      console.error('Error loading more logs:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const getStatusVariant = (status: AuditLog['status']) => {
    switch (status) {
      case 'success':
        return 'default';
      case 'partial':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{t('title')}</h3>
      </div>
      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('headerDate')}</TableHead>
              <TableHead>{t('headerUser')}</TableHead>
              <TableHead>{t('headerAction')}</TableHead>
              <TableHead>{t('headerEntity')}</TableHead>
              <TableHead>{t('headerStatus')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : allLogs.length > 0 ? (
              allLogs.map(log => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(log.createdAt.toDate(), 'd MMM yyyy, HH:mm', { locale: fr })}
                  </TableCell>
                  <TableCell>{log.userEmail}</TableCell>
                  <TableCell>{t(log.action)}</TableCell>
                  <TableCell>
                    {t(log.details.entity, { ns: 'SettingsPage.customFields' })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(log.status)}>{t(log.status)}</Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {t('noLogs')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {hasMore && allLogs.length > 0 && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={isLoadingMore}>
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Chargement...
              </>
            ) : (
              t('loadMore')
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
