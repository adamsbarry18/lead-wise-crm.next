'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl'; // Import useTranslations
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
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { collection, addDoc, Timestamp } from 'firebase/firestore'; // Import Timestamp
import { db } from '@/lib/firebase';
import { CalendarIcon, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';


export default function NewContactPage() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [tagInput, setTagInput] = useState('');
  const t = useTranslations(); 


  const form = useForm({ 
    resolver: zodResolver(contactSchema.omit({ companyId: true, createdAt: true, updatedAt: true, id: true, score: true, scoreJustification: true, lastScoredAt: true})), // Omit fields managed server-side or auto-generated
    defaultValues: {
      name: '',
      type: 'Prospect',
      jobTitle: '',
      tags: [],
      phone: '',
      email: '',
      // score will be calculated by AI later
      timezone: '',
      lastCommunicationDate: undefined, // Initialize as undefined
      lastCommunicationMethod: '',
      communicationSummary: '',
      communicatedBy: user?.email || '', // Default to current user's email
    },
  });

   // Handle adding tags
   const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      const currentTags = form.getValues('tags') || [];
      if (!currentTags.includes(newTag)) {
        form.setValue('tags', [...currentTags, newTag]);
      }
      setTagInput('');
    }
   };

    // Handle removing tags
    const handleRemoveTag = (tagToRemove: string) => {
        const currentTags = form.getValues('tags') || [];
        form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
    };


  const onSubmit = async (values: Omit<Contact, 'companyId' | 'createdAt' | 'updatedAt' | 'id' | 'score' | 'scoreJustification' | 'lastScoredAt'>) => {
    if (!user) {
      toast({ variant: 'destructive', title: t('NewContactPage.authErrorTitle'), description: t('NewContactPage.authErrorDescription') });
      return;
    }
    setLoading(true);
    try {
       const companyId = user.uid; // Assuming user UID is the company ID for simplicity
       const contactsCol = collection(db, 'companies', companyId, 'contacts');

       // Convert Date to Firestore Timestamp if present
       const dataToSave: Omit<Contact, 'id'> & { createdAt: Timestamp, companyId: string } = { // Ensure createdAt and companyId are included
         ...values,
         companyId: companyId, // Add companyId
         lastCommunicationDate: values.lastCommunicationDate ? Timestamp.fromDate(values.lastCommunicationDate as unknown as Date) : undefined, // Convert Date to Timestamp
         createdAt: Timestamp.now(), // Set createdAt timestamp
         // Score will be added/updated by the AI process
       };

       // Remove undefined fields before saving
       Object.keys(dataToSave).forEach(key => {
         if (dataToSave[key as keyof typeof dataToSave] === undefined) {
           delete dataToSave[key as keyof typeof dataToSave];
         }
       });


      const docRef = await addDoc(contactsCol, dataToSave);

      // Optionally trigger AI scoring immediately after creation
      // This might be better handled by a Firebase Function triggered on document create
      // await handleScoreContact({ ...dataToSave, id: docRef.id });

      toast({
        title: t('NewContactPage.addSuccessTitle'),
        description: t('NewContactPage.addSuccessDescription', { name: values.name }),
      });
      router.push('/contacts'); // Redirect back to contacts list
    } catch (error: any) {
      console.error("Error adding contact:", error);
      toast({
        variant: 'destructive',
        title: t('NewContactPage.addFailedTitle'),
        description: error.message || t('Generic.unexpectedError'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
     <Card className="max-w-2xl mx-auto">
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
             {t('NewContactPage.title')}
           </CardTitle>
         </CardHeader>
         <CardContent>
           <Form {...form}>
             <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
               {/* Standard Fields */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('NewContactPage.fullNameLabel')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('NewContactPage.fullNamePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('NewContactPage.typeLabel')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('NewContactPage.typePlaceholder')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Prospect">{t('NewContactPage.prospect')}</SelectItem>
                              <SelectItem value="Lead">{t('NewContactPage.lead')}</SelectItem>
                              <SelectItem value="MQL">{t('NewContactPage.mql')}</SelectItem>
                              <SelectItem value="Customer">{t('NewContactPage.customer')}</SelectItem>
                              <SelectItem value="Partner">{t('NewContactPage.partner')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />


                 <FormField
                   control={form.control}
                   name="jobTitle"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>{t('NewContactPage.jobTitleLabel')}</FormLabel>
                       <FormControl>
                         <Input placeholder={t('NewContactPage.jobTitlePlaceholder')} {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                 <FormField
                   control={form.control}
                   name="email"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>{t('NewContactPage.emailLabel')}</FormLabel>
                       <FormControl>
                         <Input type="email" placeholder={t('NewContactPage.emailPlaceholder')} {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                 <FormField
                   control={form.control}
                   name="phone"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>{t('NewContactPage.phoneLabel')}</FormLabel>
                       <FormControl>
                         <Input placeholder={t('NewContactPage.phonePlaceholder')} {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('NewContactPage.tagsLabel')}</FormLabel>
                          <FormControl>
                              <div>
                                  <Input
                                      placeholder={t('NewContactPage.tagsPlaceholder')}
                                      value={tagInput}
                                      onChange={(e) => setTagInput(e.target.value)}
                                      onKeyDown={handleAddTag}
                                  />
                                  <div className="flex flex-wrap gap-1 mt-2">
                                      {field.value?.map((tag) => (
                                      <Badge key={tag} variant="secondary">
                                          {tag}
                                          <button
                                              type="button"
                                              onClick={() => handleRemoveTag(tag)}
                                              className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                              aria-label={t('NewContactPage.removeTagLabel', { tag })}
                                          >
                                              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                          </button>
                                    </Badge>
                                    ))}
                                </div>
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />


                 <FormField
                   control={form.control}
                   name="timezone"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>{t('NewContactPage.timezoneLabel')}</FormLabel>
                       <FormControl>
                         {/* Replace with a proper timezone select component later */}
                         <Input placeholder={t('NewContactPage.timezonePlaceholder')} {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                 <FormField
                    control={form.control}
                    name="lastCommunicationDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                         <FormLabel>{t('NewContactPage.lastCommDateLabel')}</FormLabel>
                          <Popover>
                           <PopoverTrigger asChild>
                             <FormControl>
                               <Button
                                 variant={"outline"}
                                 className={cn(
                                   "w-full pl-3 text-left font-normal",
                                   !field.value && "text-muted-foreground"
                                 )}
                               >
                                 {field.value ? (
                                    format(field.value as unknown as Date, "PPP") // Assert type to Date for formatting
                                  ) : (
                                   <span>{t('NewContactPage.pickDate')}</span>
                                 )}
                                 <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                               </Button>
                             </FormControl>
                           </PopoverTrigger>
                           <PopoverContent className="w-auto p-0" align="start">
                             <Calendar
                               mode="single"
                               selected={field.value as unknown as Date} // Assert type to Date
                               onSelect={field.onChange}
                                disabled={(date) =>
                                 date > new Date() || date < new Date("1900-01-01")
                               }
                               initialFocus
                             />
                           </PopoverContent>
                         </Popover>
                         <FormMessage />
                      </FormItem>
                    )}
                  />

                <FormField
                    control={form.control}
                    name="lastCommunicationMethod"
                    render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('NewContactPage.lastCommMethodLabel')}</FormLabel>
                          <FormControl>
                              <Input placeholder={t('NewContactPage.lastCommMethodPlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                    )}
                    />

                <FormField
                    control={form.control}
                    name="communicatedBy"
                    render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('NewContactPage.commByLabel')}</FormLabel>
                          <FormControl>
                              <Input placeholder={t('NewContactPage.commByPlaceholder')} {...field} />
                          </FormControl>
                          <FormDescription>{t('NewContactPage.commByDescription')}</FormDescription>
                          <FormMessage />
                        </FormItem>
                    )}
                    />

               </div>

                {/* Full-width fields */}
                 <FormField
                   control={form.control}
                   name="communicationSummary"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>{t('NewContactPage.commSummaryLabel')}</FormLabel>
                       <FormControl>
                         <Textarea
                           placeholder={t('NewContactPage.commSummaryPlaceholder')}
                           className="resize-y min-h-[100px]"
                           {...field}
                         />
                       </FormControl>
                       <FormDescription>{t('NewContactPage.commSummaryDescription')}</FormDescription>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

               {/* Add Custom Fields Section Here Later */}
               {/* <div>
                 <h3 className="text-lg font-medium mb-2">Custom Fields</h3>
                 Render custom fields based on company settings
               </div> */}

                <CardFooter className="flex justify-end gap-2 pt-6">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                        {t('NewContactPage.cancelButton')}
                    </Button>
                   <Button type="submit" disabled={loading}>
                     {loading ? t('NewContactPage.savingButton') : t('NewContactPage.saveButton')}
                   </Button>
               </CardFooter>
             </form>
           </Form>
        </CardContent>
     </Card>
  );
}
