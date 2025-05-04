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
import { PlusCircle, MoreHorizontal, Filter, Download, Zap, Settings2, BrainCircuit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, query, where, doc, getDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Contact, contactSchema } from '@/types/contact'; // Assuming contact types are defined
import { useToast } from '@/hooks/use-toast';
import { scoreLead } from '@/ai/flows/score-lead'; // Import AI functions
import { generateSalesStrategyForContact } from '@/ai/flows/generate-sales-strategy';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns'; // For date formatting
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { Card } from '@/components/ui/card'; // Import Card


// Type for Sales Strategy Result
interface SalesStrategyResult {
  emailSequences: string[];
  followUps: string[];
  priorities: string[];
}

// Define default visible columns
const DEFAULT_VISIBLE_COLUMNS: (keyof Contact | 'actions')[] = ['name', 'type', 'email', 'score', 'lastCommunicationDate', 'actions'];

export default function ContactsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCriteria, setFilterCriteria] = useState<Record<string, any>>({}); // Placeholder for filters
  const [visibleColumns, setVisibleColumns] = useState<Set<keyof Contact | 'actions'>>(new Set(DEFAULT_VISIBLE_COLUMNS));
  const [strategySheetOpen, setStrategySheetOpen] = useState(false);
  const [selectedContactForStrategy, setSelectedContactForStrategy] = useState<Contact | null>(null);
  const [strategyResult, setStrategyResult] = useState<SalesStrategyResult | null>(null);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [isScoring, setIsScoring] = useState<Record<string, boolean>>({}); // Track scoring status per contact

  // Fetch contacts using React Query and Firestore
   const { data: contacts = [], isLoading: isLoadingContacts, error: contactsError } = useQuery<Contact[]>({
     queryKey: ['contacts', user?.uid], // Include user?.uid if contacts are company-specific
     queryFn: async () => {
       if (!user) return []; // Or handle based on your auth structure (e.g., check company ID)

       // Assuming contacts are stored under a company collection identified by user's UID for simplicity
       // Adjust this query based on your actual Firestore structure (e.g., companyId field)
       const companyId = user.uid; // Replace with actual company ID logic if different
       const contactsCol = collection(db, 'companies', companyId, 'contacts');
       const q = query(contactsCol /* Add where clauses for filtering based on filterCriteria */);
       const snapshot = await getDocs(q);
       return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
     },
     enabled: !!user, // Only run query if user is available
     // Add real-time updates if needed
     // refetchOnWindowFocus: false, // Optional: disable refetch on window focus
     // Consider using onSnapshot for real-time updates if necessary
   });

    // Filter contacts based on search term
    const filteredContacts = useMemo(() => {
        if (!searchTerm) return contacts;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return contacts.filter(contact =>
        (contact.name?.toLowerCase().includes(lowerCaseSearch) ||
         contact.email?.toLowerCase().includes(lowerCaseSearch) ||
         contact.jobTitle?.toLowerCase().includes(lowerCaseSearch) ||
         contact.tags?.some(tag => tag.toLowerCase().includes(lowerCaseSearch)))
        );
    }, [contacts, searchTerm]);

  // Mutation for updating score
   const updateScoreMutation = useMutation({
     mutationFn: async ({ contactId, score, justification }: { contactId: string, score: number, justification: string }) => {
       if (!user) throw new Error("User not authenticated");
       const companyId = user.uid; // Replace with actual company ID logic
       const contactRef = doc(db, 'companies', companyId, 'contacts', contactId);
       await updateDoc(contactRef, {
         score: score,
         scoreJustification: justification, // Store justification if needed
         lastScoredAt: new Date(),
       });
       return { contactId, score, justification };
     },
     onSuccess: (data) => {
       queryClient.invalidateQueries({ queryKey: ['contacts', user?.uid] });
       toast({ title: "Score Updated", description: `Contact score set to ${data.score}.` });
     },
     onError: (error: any) => {
       toast({ variant: 'destructive', title: "Scoring Failed", description: error.message });
     },
     onSettled: (data) => {
        if (data?.contactId) {
            setIsScoring(prev => ({ ...prev, [data.contactId]: false }));
        }
     }
   });

    // Mutation for deleting contact
    const deleteContactMutation = useMutation({
        mutationFn: async (contactId: string) => {
        if (!user) throw new Error("User not authenticated");
        const companyId = user.uid; // Replace with actual company ID logic
        const contactRef = doc(db, 'companies', companyId, 'contacts', contactId);
        await deleteDoc(contactRef);
        },
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['contacts', user?.uid] });
        toast({ title: "Contact Deleted", description: "The contact has been removed." });
        },
        onError: (error: any) => {
        toast({ variant: 'destructive', title: "Deletion Failed", description: error.message });
        },
    });


  // Handle AI Scoring
  const handleScoreContact = async (contact: Contact) => {
     if (!contact.id) return;
     setIsScoring(prev => ({ ...prev, [contact.id!]: true }));
     try {
        // Prepare input for the AI scoring function
        const scoreInput = {
            // Map contact fields to the expected input of scoreLead
            // These are just examples, adjust based on scoreLead's actual input needs
            engagement: contact.lastCommunicationMethod || 'N/A', // Example mapping
            exchanges: contact.communicationSummary || 'No summary available.', // Example mapping
            history: `Last contacted: ${contact.lastCommunicationDate ? format(new Date(contact.lastCommunicationDate.seconds * 1000), 'PPP') : 'N/A'}`, // Example mapping
            otherCriteria: `Type: ${contact.type}, Tags: ${contact.tags?.join(', ') || 'None'}`, // Example mapping
        };

        console.log("Scoring input:", scoreInput); // Log input

       const result = await scoreLead(scoreInput);
       console.log("Scoring result:", result); // Log result

       if (result && typeof result.score === 'number') {
         await updateScoreMutation.mutateAsync({
           contactId: contact.id,
           score: result.score,
           justification: result.justification,
         });
       } else {
            throw new Error("Invalid scoring response from AI.");
       }
     } catch (error: any) {
       console.error("Scoring error:", error);
       toast({ variant: 'destructive', title: "Scoring Failed", description: error.message || "Could not score contact." });
       setIsScoring(prev => ({ ...prev, [contact.id!]: false }));
     }
   };

    // Handle Generate Strategy
   const handleGenerateStrategy = async (contact: Contact) => {
     setSelectedContactForStrategy(contact);
     setStrategySheetOpen(true);
     setIsGeneratingStrategy(true);
     setStrategyResult(null); // Clear previous results

     try {
       // Prepare input for the AI strategy function
       const strategyInput = {
         contactSummary: contact.communicationSummary || 'No communication summary available.',
       };
       console.log("Strategy input:", strategyInput); // Log input

       const result = await generateSalesStrategyForContact(strategyInput);
       console.log("Strategy result:", result); // Log result

       if (result && result.salesStrategy) {
         setStrategyResult(result.salesStrategy);
       } else {
            throw new Error("Invalid strategy response from AI.");
       }
     } catch (error: any) {
        console.error("Strategy generation error:", error);
        toast({ variant: 'destructive', title: "Strategy Generation Failed", description: error.message || "Could not generate strategy." });
     } finally {
       setIsGeneratingStrategy(false);
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
        // Optionally save visibleColumns state to localStorage or user settings in Firestore
        return next;
        });
    };

    // Define all possible columns (adjust based on your Contact type)
    const allColumns: { key: keyof Contact | 'actions', label: string }[] = [
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type' },
        { key: 'jobTitle', label: 'Job Title' },
        { key: 'tags', label: 'Tags' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'score', label: 'Score' },
        { key: 'timezone', label: 'Timezone' },
        { key: 'lastCommunicationDate', label: 'Last Contacted' },
        { key: 'lastCommunicationMethod', label: 'Last Method' },
        { key: 'communicationSummary', label: 'Summary' },
        { key: 'communicatedBy', label: 'Agent' },
        { key: 'actions', label: 'Actions' },
        // Add other fields from your Contact type as needed
    ];


    const renderCellContent = (contact: Contact, columnKey: keyof Contact | 'actions') => {
        switch (columnKey) {
          case 'name':
            return contact.name || 'N/A';
          case 'type':
            return <Badge variant={contact.type === 'Customer' ? 'default' : 'secondary'}>{contact.type || 'N/A'}</Badge>;
          case 'tags':
            return (
              <div className="flex flex-wrap gap-1">
                {contact.tags?.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>) || 'N/A'}
              </div>
            );
          case 'email':
            return contact.email ? <a href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a> : 'N/A';
          case 'phone':
             return contact.phone ? <a href={`tel:${contact.phone}`} className="hover:underline">{contact.phone}</a> : 'N/A';
           case 'score':
            return contact.score !== undefined && contact.score !== null
              ? <Badge variant={contact.score > 70 ? 'default' : contact.score > 40 ? 'secondary' : 'outline'} className={contact.score > 70 ? 'bg-green-500 hover:bg-green-600' : contact.score > 40 ? 'bg-yellow-500 hover:bg-yellow-600' : ''}>{contact.score}</Badge>
              : 'N/A';
          case 'lastCommunicationDate':
            return contact.lastCommunicationDate
              ? format(new Date(contact.lastCommunicationDate.seconds * 1000), 'PP') // Format: Jan 1, 2024
              : 'N/A';
          case 'lastCommunicationMethod':
            return contact.lastCommunicationMethod || 'N/A';
          case 'actions':
            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => router.push(`/contacts/edit/${contact.id}`)}>
                    Edit Contact
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleScoreContact(contact)}
                    disabled={isScoring[contact.id!] || updateScoreMutation.isPending}
                    >
                     {isScoring[contact.id!] ? <BrainCircuit className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                     {isScoring[contact.id!] ? 'Scoring...' : 'Recalculate Score'}
                  </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => handleGenerateStrategy(contact)}>
                     <Zap className="mr-2 h-4 w-4" />
                     Generate Strategy
                   </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => deleteContactMutation.mutate(contact.id!)}
                    disabled={deleteContactMutation.isPending}
                    >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Contact
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          default:
            // Handle other contact fields
             const value = contact[columnKey as keyof Contact];
             if (typeof value === 'object' && value !== null && 'seconds' in value && 'nanoseconds' in value) {
               // Handle Firestore Timestamp
               return format(new Date((value as any).seconds * 1000), 'PP');
             }
            return value !== undefined && value !== null ? String(value) : 'N/A';
        }
      };


  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Contacts</h1>
        <Button onClick={() => router.push('/contacts/new')}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Contact
        </Button>
      </div>

        {/* Search and Filter Bar */}
        <div className="flex items-center gap-2">
            <Input
            placeholder="Search contacts (name, email, tags...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
            />
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* Add filter options here */}
                <DropdownMenuItem>Type</DropdownMenuItem>
                <DropdownMenuItem>Score Range</DropdownMenuItem>
                <DropdownMenuItem>Region</DropdownMenuItem>
                {/* Add more filters */}
            </DropdownMenuContent>
            </DropdownMenu>

             {/* Column Visibility Toggle */}
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                    <Settings2 className="mr-2 h-4 w-4" /> Columns
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {allColumns.map((col) => (
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


            <Button variant="outline" disabled> {/* Add export functionality later */}
            <Download className="mr-2 h-4 w-4" /> Export
            </Button>
        </div>


      {/* Contacts Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              {allColumns
                .filter(col => visibleColumns.has(col.key))
                .map((col) => (
                  <TableHead key={col.key}>{col.label}</TableHead>
                ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingContacts ? (
              // Skeleton loading state
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                   {allColumns
                    .filter(col => visibleColumns.has(col.key))
                    .map((col) => (
                      <TableCell key={col.key}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                  ))}
                </TableRow>
              ))
            ) : contactsError ? (
               <TableRow>
                  <TableCell colSpan={visibleColumns.size} className="h-24 text-center text-red-500">
                      Error loading contacts: {(contactsError as Error).message}
                  </TableCell>
               </TableRow>
            ) : filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <TableRow key={contact.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/contacts/${contact.id}`)}>
                   {allColumns
                    .filter(col => visibleColumns.has(col.key))
                    .map((col) => (
                       <TableCell key={col.key} className={col.key === 'actions' ? 'text-right' : ''}>
                         {renderCellContent(contact, col.key)}
                       </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={visibleColumns.size} className="h-24 text-center">
                  No contacts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Sales Strategy Sheet */}
      <Sheet open={strategySheetOpen} onOpenChange={setStrategySheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <ScrollArea className="h-full pr-6">
             <SheetHeader>
               <SheetTitle>Sales Strategy for {selectedContactForStrategy?.name}</SheetTitle>
               <SheetDescription>
                 AI-generated recommendations based on communication history.
               </SheetDescription>
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
                     <h3 className="font-semibold mb-1">Prioritized Actions:</h3>
                     <ul className="list-disc list-inside space-y-1 text-sm">
                       {strategyResult.priorities.map((item, index) => <li key={`prio-${index}`}>{item}</li>)}
                     </ul>
                   </div>
                   <div>
                     <h3 className="font-semibold mb-1">Suggested Email Sequences:</h3>
                     <ul className="list-disc list-inside space-y-1 text-sm">
                       {strategyResult.emailSequences.map((item, index) => <li key={`email-${index}`}>{item}</li>)}
                     </ul>
                   </div>
                   <div>
                     <h3 className="font-semibold mb-1">Recommended Follow-ups:</h3>
                     <ul className="list-disc list-inside space-y-1 text-sm">
                       {strategyResult.followUps.map((item, index) => <li key={`followup-${index}`}>{item}</li>)}
                     </ul>
                   </div>
                 </>
               ) : (
                 <p className="text-muted-foreground">Could not generate strategy.</p>
               )}
             </div>
             <SheetFooter>
                {/* Add actions like 'Copy Strategy' or 'Apply to Sequence' if needed */}
                 <Button variant="outline" onClick={() => setStrategySheetOpen(false)}>Close</Button>
             </SheetFooter>
          </ScrollArea>
        </SheetContent>
      </Sheet>

    </div>
  );
}
