// src/app/(app)/contacts/edit/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl'; // Import useTranslations
import { useQueryClient } from '@tanstack/react-query'; // Import useQueryClient
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod'; // Import z
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

// Define a specific type for the form, ensuring Date type for the calendar
type ContactFormData = Omit<Contact, 'companyId' | 'createdAt' | 'updatedAt' | 'id' | 'score' | 'scoreJustification' | 'lastScoredAt' | 'lastCommunicationDate'> & {
 lastCommunicationDate?: Date | null; // Allow null to match the schema
};

// Create a specific schema for the edit form that expects a Date object
const editContactFormSchema = contactSchema.omit({
   companyId: true, createdAt: true, updatedAt: true, id: true, score: true, scoreJustification: true, lastScoredAt: true
}).extend({
   lastCommunicationDate: z.date().optional().nullable(), // Override to expect Date or null/undefined
});

export default function EditContactPage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const contactId = params.id as string;
  const { user } = useAuth();
  const queryClient = useQueryClient(); // Initialize queryClient
  const t = useTranslations('EditContactPage'); // Initialize translations
  const tNew = useTranslations('NewContactPage'); // For shared keys like labels/placeholders
  const tGeneric = useTranslations('Generic'); // For generic terms
  const [tagInput, setTagInput] = useState('');


 const form = useForm<ContactFormData>({ // Use the new form data type
    resolver: zodResolver(editContactFormSchema), // Use the form-specific schema
    defaultValues: { // Initialize with empty/default values
       name: '',
       type: 'Prospect',
      jobTitle: '',
      tags: [],
      phone: '',
      email: '',
      timezone: '',
      lastCommunicationDate: null,
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
          const formData: ContactFormData = { // Use the new form data type
            ...data,
            lastCommunicationDate: data.lastCommunicationDate?.toDate(), // Convert Timestamp to Date
             // Ensure tags is an array
            tags: Array.isArray(data.tags) ? data.tags : [],
          };
          // Filter out fields not in ContactFormData if necessary (though Omit should handle this)
           const validKeys = Object.keys(form.getValues()) as Array<keyof ContactFormData>;
           const filteredFormData = Object.fromEntries(
             Object.entries(formData).filter(([key]) => validKeys.includes(key as keyof ContactFormData))
           ) as ContactFormData;

           form.reset(filteredFormData); // Reset form with fetched data
         } else {
           toast({ variant: 'destructive', title: tGeneric('error'), description: t('notFoundError') });
           router.push('/contacts'); // Redirect if contact doesn't exist
         }
       } catch (error: any) {
         console.error("Error fetching contact:", error);
         toast({ variant: 'destructive', title: t('loadingErrorTitle'), description: error.message || tGeneric('unexpectedError') });
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

const onSubmit = async (values: ContactFormData) => { // Use the new form data type
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
        title: t('updateSuccessTitle'),
        description: t('updateSuccessDescription', { name: values.name }),
      });
      queryClient.invalidateQueries({ queryKey: ['contact', contactId, user?.uid] }); // Invalidate detail view
      queryClient.invalidateQueries({ queryKey: ['contacts', user?.uid] }); // Invalidate list view
      router.push(`/contacts/${contactId}`); // Redirect back to contact detail page
    } catch (error: any) {
      console.error("Error updating contact:", error);
      toast({
        variant: 'destructive',
        title: t('updateFailedTitle'),
        description: error.message || tGeneric('unexpectedError'),
      });
    } finally {
      setLoading(false);
    }
  };

   if (initialLoading) {
     return (
        <Card className="max-w-2xl mx-auto">
             <CardHeader><CardTitle>{t('loadingContact')}</CardTitle></CardHeader> {/* Use loading text */}
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
          {t('title', { name: form.getValues('name') || '...' })} {/* Show current name */}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Reuse the form fields from NewContactPage, potentially abstracting into a component */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>{t('fullNameLabel')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="type" render={({ field }) => (
                        <FormItem><FormLabel>{t('typeLabel')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}> {/* Use value prop */}
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Prospect">{t('prospect')}</SelectItem>
                                    <SelectItem value="Lead">{t('lead')}</SelectItem>
                                    <SelectItem value="MQL">{t('mql')}</SelectItem>
                                    <SelectItem value="Customer">{t('customer')}</SelectItem>
                                    <SelectItem value="Partner">{t('partner')}</SelectItem>
                                </SelectContent>
                            </Select><FormMessage />
                        </FormItem>)}
                   />
                   <FormField control={form.control} name="jobTitle" render={({ field }) => (<FormItem><FormLabel>{t('jobTitleLabel')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>{t('emailLabel')}</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>{t('phoneLabel')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="tags" render={({ field }) => (
                        <FormItem><FormLabel>{t('tagsLabel')}</FormLabel><FormControl>
                             <div><Input placeholder={t('tagsPlaceholder')} value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleAddTag}/>
                                 <div className="flex flex-wrap gap-1 mt-2">
                                     {field.value?.map((tag) => (
                                        <Badge key={tag} variant="secondary">{tag}
                                            <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2" aria-label={t('removeTagLabel', { tag })}>
                                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                            </button>
                                        </Badge>
                                     ))}
                                 </div>
                             </div>
                        </FormControl><FormMessage /></FormItem>)}
                    />
                   <FormField control={form.control} name="timezone" render={({ field }) => (<FormItem><FormLabel>{t('timezoneLabel')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="lastCommunicationDate" render={({ field }) => (
                       <FormItem className="flex flex-col">
                           <FormLabel>{t('lastCommDateLabel')}</FormLabel>
                            <Popover>
                               <PopoverTrigger asChild><FormControl>
                                   <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                       {field.value ? format(field.value as unknown as Date, "PPP") : <span>{t('pickDate')}</span>}
                                       <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                   </Button>
                               </FormControl></PopoverTrigger>
                               <PopoverContent className="w-auto p-0" align="start">
                                   <Calendar mode="single" selected={field.value as unknown as Date} onSelect={field.onChange} initialFocus />
                               </PopoverContent>
                           </Popover><FormMessage />
                       </FormItem>)}
                   />
                   <FormField control={form.control} name="lastCommunicationMethod" render={({ field }) => (<FormItem><FormLabel>{t('lastCommMethodLabel')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="communicatedBy" render={({ field }) => (<FormItem><FormLabel>{t('commByLabel')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
               </div>
                <FormField control={form.control} name="communicationSummary" render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('commSummaryLabel')}</FormLabel>
                        <FormControl><Textarea className="resize-y min-h-[100px]" {...field} /></FormControl>
                        <FormDescription>{t('commSummaryDescription')}</FormDescription>
                        <FormMessage />
                    </FormItem>)}
                />
                {/* Custom Fields would be rendered here */}
             <CardFooter className="flex justify-end gap-2 pt-6">
               <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                 {t('cancelButton')}
               </Button>
               <Button type="submit" disabled={loading || !form.formState.isDirty}> {/* Disable if not loading and form hasn't changed */}
                 {loading ? t('savingButton') : t('saveButton')}
               </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
