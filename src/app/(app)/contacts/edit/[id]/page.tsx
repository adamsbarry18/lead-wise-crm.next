// src/app/(app)/contacts/edit/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema, Contact } from '@/types/contact';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore'; // Import Timestamp
import { db } from '@/lib/firebase';
import { CalendarIcon, ArrowLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { Badge } from '@/components/ui/badge';

// Type for form values, excluding read-only/server-managed fields
type EditContactFormValues = Omit<Contact, 'companyId' | 'createdAt' | 'updatedAt' | 'id' | 'score' | 'scoreJustification' | 'lastScoredAt'>;

export default function EditContactPage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const contactId = params.id as string;
  const { user } = useAuth();
   const [tagInput, setTagInput] = useState('');


  const form = useForm<EditContactFormValues>({
    resolver: zodResolver(contactSchema.omit({ companyId: true, createdAt: true, updatedAt: true, id: true, score: true, scoreJustification: true, lastScoredAt: true })),
    defaultValues: { // Initialize with empty/default values
      name: '',
      type: 'Prospect',
      jobTitle: '',
      tags: [],
      phone: '',
      email: '',
      timezone: '',
      lastCommunicationDate: undefined,
      lastCommunicationMethod: '',
      communicationSummary: '',
      communicatedBy: '',
    },
  });

  // Fetch existing contact data
  useEffect(() => {
    const fetchContactData = async () => {
      if (!user || !contactId) {
           setInitialLoading(false);
           return;
      };
      setInitialLoading(true);
      try {
        const companyId = user.uid; // Replace with actual company ID logic
        const contactRef = doc(db, 'companies', companyId, 'contacts', contactId);
        const docSnap = await getDoc(contactRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as Contact;
          // Convert Firestore Timestamps back to JS Date objects for the form
          const formData: EditContactFormValues = {
            ...data,
            lastCommunicationDate: data.lastCommunicationDate?.toDate(),
             // Ensure tags is an array
            tags: Array.isArray(data.tags) ? data.tags : [],
          };
          // Filter out fields not in EditContactFormValues if necessary
           const validKeys = Object.keys(form.getValues()) as Array<keyof EditContactFormValues>;
           const filteredFormData = Object.fromEntries(
             Object.entries(formData).filter(([key]) => validKeys.includes(key as keyof EditContactFormValues))
           ) as EditContactFormValues;

           form.reset(filteredFormData); // Reset form with fetched data
        } else {
          toast({ variant: 'destructive', title: 'Error', description: 'Contact not found.' });
          router.push('/contacts'); // Redirect if contact doesn't exist
        }
      } catch (error: any) {
        console.error("Error fetching contact:", error);
        toast({ variant: 'destructive', title: 'Error Loading Contact', description: error.message });
      } finally {
        setInitialLoading(false);
      }
    };

    fetchContactData();
  }, [contactId, user, form, toast, router]);

   // Handle adding tags
   const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      const currentTags = form.getValues('tags') || [];
      if (!currentTags.includes(newTag)) {
        form.setValue('tags', [...currentTags, newTag], { shouldDirty: true }); // Mark form as dirty
      }
      setTagInput('');
    }
   };

    // Handle removing tags
    const handleRemoveTag = (tagToRemove: string) => {
        const currentTags = form.getValues('tags') || [];
        form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove), { shouldDirty: true }); // Mark form as dirty
    };


  const onSubmit = async (values: EditContactFormValues) => {
    if (!user || !contactId) return;

    setLoading(true);
    try {
      const companyId = user.uid;
      const contactRef = doc(db, 'companies', companyId, 'contacts', contactId);

      // Convert Date back to Firestore Timestamp if present
       const dataToUpdate = {
         ...values,
         lastCommunicationDate: values.lastCommunicationDate ? Timestamp.fromDate(values.lastCommunicationDate as unknown as Date) : undefined,
         updatedAt: Timestamp.now(), // Add updatedAt timestamp
       };

        // Remove undefined fields before saving
        Object.keys(dataToUpdate).forEach(key => {
            const typedKey = key as keyof typeof dataToUpdate;
            if (dataToUpdate[typedKey] === undefined) {
            delete dataToUpdate[typedKey];
            }
        });


      await updateDoc(contactRef, dataToUpdate);

      toast({
        title: 'Contact Updated',
        description: `${values.name} has been successfully updated.`,
      });
      queryClient.invalidateQueries({ queryKey: ['contact', contactId, user?.uid] }); // Invalidate detail view
      queryClient.invalidateQueries({ queryKey: ['contacts', user?.uid] }); // Invalidate list view
      router.push(`/contacts/${contactId}`); // Redirect back to contact detail page
    } catch (error: any) {
      console.error("Error updating contact:", error);
      toast({
        variant: 'destructive',
        title: 'Failed to Update Contact',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setLoading(false);
    }
  };

   if (initialLoading) {
     return (
        <Card className="max-w-2xl mx-auto">
             <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
             <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                 </div>
                <Skeleton className="h-24 w-full" />
             </CardContent>
             <CardFooter className="flex justify-end gap-2 pt-6">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-24" />
             </CardFooter>
        </Card>
     );
   }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
           <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
             <ArrowLeft className="h-4 w-4" />
           </Button>
          Edit Contact: {form.getValues('name')} {/* Show current name */}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Reuse the form fields from NewContactPage, potentially abstracting into a component */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Full Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="type" render={({ field }) => (
                        <FormItem><FormLabel>Type *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}> {/* Use value prop */}
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent><SelectItem value="Prospect">Prospect</SelectItem><SelectItem value="Lead">Lead</SelectItem><SelectItem value="MQL">MQL</SelectItem><SelectItem value="Customer">Customer</SelectItem><SelectItem value="Partner">Partner</SelectItem></SelectContent>
                            </Select><FormMessage />
                        </FormItem>)}
                   />
                   <FormField control={form.control} name="jobTitle" render={({ field }) => (<FormItem><FormLabel>Job Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="tags" render={({ field }) => (
                        <FormItem><FormLabel>Tags</FormLabel><FormControl>
                             <div><Input placeholder="Add tags (press Enter)" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleAddTag}/>
                                 <div className="flex flex-wrap gap-1 mt-2">
                                     {field.value?.map((tag) => (
                                        <Badge key={tag} variant="secondary">{tag}
                                            <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2" aria-label={`Remove ${tag} tag`}>
                                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                            </button>
                                        </Badge>
                                     ))}
                                 </div>
                             </div>
                        </FormControl><FormMessage /></FormItem>)}
                    />
                   <FormField control={form.control} name="timezone" render={({ field }) => (<FormItem><FormLabel>Timezone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="lastCommunicationDate" render={({ field }) => (
                       <FormItem className="flex flex-col">
                           <FormLabel>Last Communication Date</FormLabel>
                            <Popover>
                               <PopoverTrigger asChild><FormControl>
                                   <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                       {field.value ? format(field.value as unknown as Date, "PPP") : <span>Pick a date</span>}
                                       <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                   </Button>
                               </FormControl></PopoverTrigger>
                               <PopoverContent className="w-auto p-0" align="start">
                                   <Calendar mode="single" selected={field.value as unknown as Date} onSelect={field.onChange} initialFocus />
                               </PopoverContent>
                           </Popover><FormMessage />
                       </FormItem>)}
                   />
                   <FormField control={form.control} name="lastCommunicationMethod" render={({ field }) => (<FormItem><FormLabel>Last Communication Method</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="communicatedBy" render={({ field }) => (<FormItem><FormLabel>Communicated By (Agent)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
               </div>
                <FormField control={form.control} name="communicationSummary" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Communication Summary</FormLabel>
                        <FormControl><Textarea className="resize-y min-h-[100px]" {...field} /></FormControl>
                        <FormDescription>A brief overview of interactions.</FormDescription>
                        <FormMessage />
                    </FormItem>)}
                />
                {/* Custom Fields would be rendered here */}
             <CardFooter className="flex justify-end gap-2 pt-6">
               <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                 Cancel
               </Button>
               <Button type="submit" disabled={loading || !form.formState.isDirty}> {/* Disable if not loading and form hasn't changed */}
                 {loading ? 'Saving...' : 'Save Changes'}
               </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
