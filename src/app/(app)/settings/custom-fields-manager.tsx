'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/auth-provider';
import { CustomField, CustomFieldSchema } from '@/types/custom-field';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Trash, Edit, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CustomFieldDialog } from './custom-field-dialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

type EntityType = 'contacts';

export function CustomFieldsManager() {
  const { user } = useAuth();
  const t = useTranslations('SettingsPage.customFields');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [entity, setEntity] = useState<EntityType>('contacts');
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<CustomField | null>(null);

  const queryKey = ['customFields', user?.uid, entity];

  const { data: fields = [], isLoading } = useQuery<CustomField[]>({
    queryKey,
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, 'companies', user.uid, 'customFields'),
        where('entity', '==', entity)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as CustomField);
    },
    enabled: !!user,
  });

  const { mutateAsync: saveField, isPending: isSubmitting } = useMutation({
    mutationFn: async ({ values, fieldId }: { values: any; fieldId?: string }) => {
      if (!user) throw new Error('User not authenticated.');

      const dataToSave = {
        ...values,
        entity,
        companyId: user.uid,
      };

      if (fieldId) {
        await updateDoc(doc(db, 'companies', user.uid, 'customFields', fieldId), dataToSave);
      } else {
        await addDoc(collection(db, 'companies', user.uid, 'customFields'), dataToSave);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: t('saveSuccess') });
      setDialogOpen(false);
    },
    onError: error => {
      toast({ variant: 'destructive', title: t('saveError'), description: error.message });
    },
  });

  const { mutateAsync: deleteField, isPending: isDeleting } = useMutation({
    mutationFn: async (fieldId: string) => {
      if (!user) throw new Error('User not authenticated.');
      await deleteDoc(doc(db, 'companies', user.uid, 'customFields', fieldId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: t('deleteSuccess') });
    },
    onError: error => {
      toast({ variant: 'destructive', title: t('deleteError'), description: error.message });
    },
  });

  const handleEdit = (field: CustomField) => {
    setSelectedField(field);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedField(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Select value={entity} onValueChange={value => setEntity(value as EntityType)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('selectEntityPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="contacts">{t('entityContacts')}</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" /> {t('addButton')}
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaderLabel')}</TableHead>
              <TableHead>{t('tableHeaderType')}</TableHead>
              <TableHead>{t('tableHeaderRequired')}</TableHead>
              <TableHead className="text-right">{t('tableHeaderActions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : fields.length > 0 ? (
              fields.map(field => (
                <TableRow key={field.id}>
                  <TableCell>{field.label}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{t(field.type)}</Badge>
                  </TableCell>
                  <TableCell>{field.required ? t('yes') : t('no')}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(field)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t('editAction')}
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={e => e.preventDefault()}
                              className="text-destructive"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              {t('deleteAction')}
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('deleteConfirmDescription', { label: field.label })}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteField(field.id!)}
                                disabled={isDeleting}
                              >
                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('confirmDelete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  {t('noFields')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <CustomFieldDialog
        isOpen={isDialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={values => saveField({ values, fieldId: selectedField?.id })}
        initialData={selectedField}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
