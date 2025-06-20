'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { collection, query, getDocs, deleteDoc, doc, FirestoreError } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Contact } from '@/types/contact';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
} from '@/components/ui/alert-dialog';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations('ContactsPage');
  const tGeneric = useTranslations('Generic');

  useEffect(() => {
    const fetchContacts = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const companyId = user.uid;
        const contactsRef = collection(db, 'companies', companyId, 'contacts');
        const q = query(contactsRef);
        const querySnapshot = await getDocs(q);
        const contactsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Contact[];

        setContacts(contactsData);
      } catch (error) {
        const firestoreError = error as FirestoreError;
        toast({
          variant: 'destructive',
          title: t('loadingErrorTitle'),
          description: firestoreError.message || tGeneric('unexpectedError'),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [user, toast, t, tGeneric]);

  const handleDelete = async () => {
    if (!user || !contactToDelete?.id) return;

    try {
      const companyId = user.uid;
      const contactRef = doc(db, 'companies', companyId, 'contacts', contactToDelete.id);
      await deleteDoc(contactRef);

      setContacts(prevContacts =>
        prevContacts.filter(contact => contact.id !== contactToDelete.id)
      );

      toast({
        title: t('deleteSuccessTitle'),
        description: t('deleteSuccessDescription'),
      });
    } catch (error) {
      const firestoreError = error as FirestoreError;
      toast({
        variant: 'destructive',
        title: t('deleteErrorTitle'),
        description: firestoreError.message || tGeneric('unexpectedError'),
      });
    } finally {
      setContactToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const searchLower = searchQuery.toLowerCase();
    return (
      contact.name?.toLowerCase().includes(searchLower) ||
      contact.email?.toLowerCase().includes(searchLower) ||
      contact.phone?.toLowerCase().includes(searchLower) ||
      contact.jobTitle?.toLowerCase().includes(searchLower) ||
      contact.type?.toLowerCase().includes(searchLower) ||
      contact.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <Button onClick={() => router.push('/contacts/new')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('newContactButton')}
        </Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('nameColumn')}</TableHead>
              <TableHead>{t('typeColumn')}</TableHead>
              <TableHead>{t('jobTitleColumn')}</TableHead>
              <TableHead>{t('emailColumn')}</TableHead>
              <TableHead>{t('phoneColumn')}</TableHead>
              <TableHead>{t('tagsColumn')}</TableHead>
              <TableHead>{t('scoreColumn')}</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.map(contact => (
              <TableRow key={contact.id}>
                <TableCell>{contact.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{contact.type}</Badge>
                </TableCell>
                <TableCell>{contact.jobTitle}</TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell>{contact.phone}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {contact.tags?.map(tag => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {contact.score !== undefined && (
                    <Badge
                      variant={
                        contact.score >= 70
                          ? 'default'
                          : contact.score >= 40
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {contact.score}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">{t('openMenu')}</span>
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => router.push(`/contacts/${contact.id}`)}>
                        {t('viewDetails')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/contacts/edit/${contact.id}`)}>
                        {t('edit')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setContactToDelete(contact);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        {t('delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirmDescription', {
                name: contactToDelete?.name || t('unknownContact'),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {t('confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
