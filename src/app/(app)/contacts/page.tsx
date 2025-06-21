'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  PlusCircle,
  MoreHorizontal,
  Filter,
  Download,
  Zap,
  Settings2,
  BrainCircuit,
  Trash2,
  Upload,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, query, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Contact } from '@/types/contact';
import { useToast } from '@/hooks/use-toast';
import { scoreLead } from '@/ai/flows/score-lead';
import { generateSalesStrategyForContact } from '@/ai/flows/generate-sales-strategy';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import Papa from 'papaparse';
import { ImportContactsDialog } from './import-dialog';

// Type for Sales Strategy Result
interface SalesStrategyResult {
  emailSequences: string[];
  followUps: string[];
  priorities: string[];
}

// Define default visible columns
const DEFAULT_VISIBLE_COLUMNS: (keyof Contact | 'actions')[] = [
  'fullName',
  'type',
  'email',
  'score',
  'lastCommunicationDate',
  'actions',
];

export default function ContactsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = useTranslations('ContactsPage');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<Set<keyof Contact | 'actions'>>(
    new Set(DEFAULT_VISIBLE_COLUMNS)
  );
  const [strategySheetOpen, setStrategySheetOpen] = useState(false);
  const [selectedContactForStrategy, setSelectedContactForStrategy] = useState<Contact | null>(
    null
  );
  const [strategyResult, setStrategyResult] = useState<SalesStrategyResult | null>(null);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [isScoring, setIsScoring] = useState<Record<string, boolean>>({});
  const [isExporting, setIsExporting] = useState(false);
  const [isImportDialogOpen, setImportDialogOpen] = useState(false);

  // Fetch contacts using React Query
  const {
    data: contacts = [],
    isLoading: isLoadingContacts,
    error: contactsError,
  } = useQuery<Contact[]>({
    queryKey: ['contacts', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const companyId = user.uid;
      const contactsCol = collection(db, 'companies', companyId, 'contacts');
      const q = query(contactsCol);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Contact);
    },
    enabled: !!user,
  });

  // Filter contacts based on search term
  const filteredContacts = useMemo(() => {
    if (!searchTerm) return contacts;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return contacts.filter(
      contact =>
        contact.fullName?.toLowerCase().includes(lowerCaseSearch) ||
        contact.email?.toLowerCase().includes(lowerCaseSearch) ||
        contact.jobTitle?.toLowerCase().includes(lowerCaseSearch) ||
        contact.tags?.some(tag => tag.toLowerCase().includes(lowerCaseSearch))
    );
  }, [contacts, searchTerm]);

  // Mutation for updating score
  const updateScoreMutation = useMutation({
    mutationFn: async ({
      contactId,
      score,
      justification,
    }: {
      contactId: string;
      score: number;
      justification: string;
    }) => {
      if (!user) throw new Error('User not authenticated');
      const companyId = user.uid;
      const contactRef = doc(db, 'companies', companyId, 'contacts', contactId);
      await updateDoc(contactRef, {
        score: score,
        scoreJustification: justification,
        lastScoredAt: new Date(),
      });
      return { contactId, score };
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['contacts', user?.uid] });
      toast({
        title: t('scoreUpdateSuccessTitle'),
        description: t('scoreUpdateSuccessDescription', { score: data.score }),
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: t('scoreUpdateErrorTitle'),
        description: error.message,
      });
    },
    onSettled: data => {
      if (data?.contactId) {
        setIsScoring(prev => ({ ...prev, [data.contactId]: false }));
      }
    },
  });

  // Mutation for deleting contact
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      if (!user) throw new Error('User not authenticated');
      const companyId = user.uid;
      const contactRef = doc(db, 'companies', companyId, 'contacts', contactId);
      await deleteDoc(contactRef);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', user?.uid] });
      toast({
        title: t('deleteSuccessTitle'),
        description: t('deleteSuccessDescription'),
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: t('deleteErrorTitle'),
        description: error.message,
      });
    },
  });

  // Handle AI Scoring
  const handleScoreContact = async (contact: Contact) => {
    if (!contact.id) return;
    setIsScoring(prev => ({ ...prev, [contact.id!]: true }));
    try {
      const scoreInput = {
        engagement: contact.lastCommunicationMethod || 'N/A',
        exchanges: contact.communicationSummary || 'No summary available.',
        history: `Last contacted: ${
          contact.lastCommunicationDate
            ? format(new Date((contact.lastCommunicationDate as any).seconds * 1000), 'PPP')
            : 'N/A'
        }`,
        otherCriteria: `Type: ${contact.type}, Tags: ${contact.tags?.join(', ') || 'None'}`,
      };

      const result = await scoreLead(scoreInput);

      if (result && typeof result.score === 'number') {
        await updateScoreMutation.mutateAsync({
          contactId: contact.id,
          score: result.score,
          justification: result.justification,
        });
      } else {
        throw new Error('Invalid scoring response from AI.');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('scoreUpdateErrorTitle'),
        description: error.message || 'Could not score contact.',
      });
      setIsScoring(prev => ({ ...prev, [contact.id!]: false }));
    }
  };

  // Handle Generate Strategy
  const handleGenerateStrategy = async (contact: Contact) => {
    setSelectedContactForStrategy(contact);
    setStrategySheetOpen(true);
    setIsGeneratingStrategy(true);
    setStrategyResult(null);

    try {
      const strategyInput = {
        contactSummary: contact.communicationSummary || 'No communication summary available.',
      };
      const result = await generateSalesStrategyForContact(strategyInput);

      if (result && result.salesStrategy) {
        setStrategyResult(result.salesStrategy);
      } else {
        throw new Error('Invalid strategy response from AI.');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Strategy Generation Failed',
        description: error.message || 'Could not generate strategy.',
      });
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  // Handle Export to CSV
  const handleExport = () => {
    setIsExporting(true);
    try {
      // Use filteredContacts to export what the user sees
      const dataToExport = filteredContacts.map(contact => {
        // Flatten complex fields for CSV
        const { tags, lastCommunicationDate, ...remaningContact } = contact;
        return {
          ...remaningContact,
          tags: tags?.join('|') || '', // Convert array to a pipe-separated string
          lastCommunicationDate: lastCommunicationDate
            ? format(new Date((lastCommunicationDate as any).seconds * 1000), 'yyyy-MM-dd')
            : '',
        };
      });

      if (dataToExport.length === 0) {
        toast({
          title: 'No Data to Export',
          description: 'There are no contacts to export in the current view.',
        });
        return;
      }

      const csv = Papa.unparse(dataToExport);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `contacts-export-${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: 'Export Successful',
        description: `${dataToExport.length} contacts have been exported.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'An error occurred while exporting contacts.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Function to toggle column visibility
  const toggleColumn = (column: keyof Contact | 'actions') => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(column)) {
        next.delete(column);
      } else {
        next.add(column);
      }
      return next;
    });
  };

  // Define all possible columns
  const allColumns: { key: keyof Contact | 'actions'; label: string }[] = [
    { key: 'fullName', label: t('columnLabels.name') },
    { key: 'type', label: t('columnLabels.type') },
    { key: 'jobTitle', label: t('columnLabels.jobTitle') },
    { key: 'tags', label: t('columnLabels.tags') },
    { key: 'phone', label: t('columnLabels.phone') },
    { key: 'email', label: t('columnLabels.email') },
    { key: 'score', label: t('columnLabels.score') },
    { key: 'timezone', label: t('columnLabels.timezone') },
    { key: 'lastCommunicationDate', label: t('columnLabels.lastContacted') },
    { key: 'lastCommunicationMethod', label: t('columnLabels.lastMethod') },
    { key: 'communicationSummary', label: t('columnLabels.summary') },
    { key: 'communicatedBy', label: t('columnLabels.agent') },
    { key: 'actions', label: t('columnLabels.actions') },
  ];

  const renderCellContent = (contact: Contact, columnKey: keyof Contact | 'actions') => {
    switch (columnKey) {
      case 'fullName':
        return contact.fullName || 'N/A';
      case 'type':
        return (
          <Badge variant={contact.type === 'Customer' ? 'default' : 'secondary'}>
            {contact.type || 'N/A'}
          </Badge>
        );
      case 'tags':
        return (
          <div className="flex flex-wrap gap-1">
            {contact.tags?.map(tag => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            )) || 'N/A'}
          </div>
        );
      case 'email':
        return contact.email ? (
          <a href={`mailto:${contact.email}`} className="hover:underline">
            {contact.email}
          </a>
        ) : (
          'N/A'
        );
      case 'phone':
        return contact.phone ? (
          <a href={`tel:${contact.phone}`} className="hover:underline">
            {contact.phone}
          </a>
        ) : (
          'N/A'
        );
      case 'score':
        return contact.score !== undefined && contact.score !== null ? (
          <Badge
            variant={
              contact.score > 70 ? 'default' : contact.score > 40 ? 'secondary' : 'destructive'
            }
          >
            {contact.score}
          </Badge>
        ) : (
          'N/A'
        );
      case 'lastCommunicationDate':
        return contact.lastCommunicationDate
          ? format(new Date((contact.lastCommunicationDate as any).seconds * 1000), 'PP')
          : 'N/A';
      case 'actions':
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t('openMenu')}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('actionsMenu.label')}</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation();
                  router.push(`/contacts/edit/${contact.id}`);
                }}
              >
                {t('actionsMenu.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation();
                  handleScoreContact(contact);
                }}
                disabled={isScoring[contact.id!] || updateScoreMutation.isPending}
              >
                {isScoring[contact.id!] ? (
                  <BrainCircuit className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <BrainCircuit className="mr-2 h-4 w-4" />
                )}
                {isScoring[contact.id!]
                  ? t('actionsMenu.scoring')
                  : t('actionsMenu.recalculateScore')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation();
                  handleGenerateStrategy(contact);
                }}
              >
                <Zap className="mr-2 h-4 w-4" />
                {t('actionsMenu.generateStrategy')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={e => {
                  e.stopPropagation();
                  deleteContactMutation.mutate(contact.id!);
                }}
                disabled={deleteContactMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('actionsMenu.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      default:
        const value = contact[columnKey as keyof Contact];
        if (typeof value === 'object' && value !== null && 'seconds' in value) {
          return format(new Date((value as any).seconds * 1000), 'PP');
        }
        return value !== undefined && value !== null ? String(value) : 'N/A';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <Button onClick={() => router.push('/contacts/new')}>
          <PlusCircle className="mr-2 h-4 w-4" /> {t('addContactButton')}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder={t('searchPlaceholder')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" /> {t('filterButton')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('filterMenu.label')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>{t('filterMenu.type')}</DropdownMenuItem>
            <DropdownMenuItem>{t('filterMenu.score')}</DropdownMenuItem>
            <DropdownMenuItem>{t('filterMenu.region')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Settings2 className="mr-2 h-4 w-4" /> {t('columnsButton')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t('columnsMenu.label')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allColumns.map(col => (
              <DropdownMenuCheckboxItem
                key={col.key}
                className="capitalize"
                checked={visibleColumns.has(col.key)}
                onCheckedChange={() => toggleColumn(col.key)}
              >
                {col.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" onClick={() => setImportDialogOpen(true)} className="ml-auto">
          <Upload className="mr-2 h-4 w-4" />
          {t('importButton')}
        </Button>

        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isExporting || isLoadingContacts}
        >
          {isExporting ? (
            <Download className="mr-2 h-4 w-4 animate-pulse" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {t('exportButton')}
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              {allColumns
                .filter(col => visibleColumns.has(col.key))
                .map(col => (
                  <TableHead key={col.key}>{col.label}</TableHead>
                ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingContacts ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {Array.from(visibleColumns).map(key => (
                    <TableCell key={key}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : contactsError ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.size}
                  className="h-24 text-center text-destructive"
                >
                  {t('errorLoading', { error: (contactsError as Error).message })}
                </TableCell>
              </TableRow>
            ) : filteredContacts.length > 0 ? (
              filteredContacts.map(contact => (
                <TableRow
                  key={contact.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/contacts/${contact.id}`)}
                >
                  {allColumns
                    .filter(col => visibleColumns.has(col.key))
                    .map(col => (
                      <TableCell
                        key={col.key}
                        className={col.key === 'actions' ? 'text-right' : ''}
                      >
                        {renderCellContent(contact, col.key)}
                      </TableCell>
                    ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={visibleColumns.size} className="h-24 text-center">
                  {t('noContactsFound')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={strategySheetOpen} onOpenChange={setStrategySheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <ScrollArea className="h-full pr-6">
            <SheetHeader>
              <SheetTitle>
                {t('strategySheet.title', { name: selectedContactForStrategy?.fullName || '' })}
              </SheetTitle>
              <SheetDescription>{t('strategySheet.description')}</SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-4">
              {isGeneratingStrategy ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-4 w-1/5" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : strategyResult ? (
                <>
                  <div>
                    <h3 className="font-semibold mb-1">{t('strategySheet.prioritizedActions')}</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {strategyResult.priorities.map((item, index) => (
                        <li key={`prio-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t('strategySheet.emailSequences')}</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {strategyResult.emailSequences.map((item, index) => (
                        <li key={`email-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t('strategySheet.followUps')}</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {strategyResult.followUps.map((item, index) => (
                        <li key={`followup-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">{t('strategySheet.generationError')}</p>
              )}
            </div>
            <SheetFooter>
              <Button variant="outline" onClick={() => setStrategySheetOpen(false)}>
                {t('strategySheet.closeButton')}
              </Button>
            </SheetFooter>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <ImportContactsDialog
        isOpen={isImportDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['contacts', user?.uid] });
        }}
      />
    </div>
  );
}
