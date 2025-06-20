'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { doc, setDoc, Timestamp, FirestoreError } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ArrowLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';
import { collection } from 'firebase/firestore';

// Define the contact schema
const contactSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: 'Name is required' }),
  type: z.enum(['Prospect', 'Lead', 'MQL', 'Customer', 'Partner']),
  jobTitle: z.string().optional(),
  tags: z.array(z.string()),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  timezone: z.string().optional(),
  lastCommunicationDate: z.date().optional(),
  lastCommunicationMethod: z.string().optional(),
  communicationSummary: z.string().optional(),
  communicatedBy: z.string().optional(),
  companyId: z.string().optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
  score: z.number().optional(),
  scoreJustification: z.string().optional(),
  lastScoredAt: z.any().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function NewContactPage() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations('NewContactPage');
  const tGeneric = useTranslations('Generic');
  const [tagInput, setTagInput] = useState('');

  const form = useForm({
    resolver: zodResolver(
      contactSchema.omit({
        companyId: true,
        createdAt: true,
        updatedAt: true,
        id: true,
        score: true,
        scoreJustification: true,
        lastScoredAt: true,
      })
    ), // Omit fields managed server-side or auto-generated
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
    form.setValue(
      'tags',
      currentTags.filter((tag: string) => tag !== tagToRemove)
    );
  };

  const onSubmit = async (values: z.infer<typeof contactSchema>) => {
    if (!user) return;

    setLoading(true);
    try {
      const companyId = user.uid;
      // Create a new document reference with an auto-generated ID
      const contactsRef = doc(collection(db, 'companies', companyId, 'contacts'));

      const dataToSave = {
        ...values,
        id: contactsRef.id, // Use the auto-generated ID
        companyId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastCommunicationDate: values.lastCommunicationDate
          ? Timestamp.fromDate(values.lastCommunicationDate as unknown as Date)
          : null,
      };

      await setDoc(contactsRef, dataToSave);

      toast({
        title: t('successTitle'),
        description: t('successDescription'),
      });

      router.push('/contacts');
    } catch (error) {
      const firestoreError = error as FirestoreError;
      console.error('Error creating contact:', firestoreError);
      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: firestoreError.message || tGeneric('unexpectedError'),
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
          {t('title')}
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
                    <FormLabel>{t('fullNameLabel')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('fullNamePlaceholder')} {...field} />
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
                    <FormLabel>{t('typeLabel')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('typePlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Prospect">{t('prospect')}</SelectItem>
                        <SelectItem value="Lead">{t('lead')}</SelectItem>
                        <SelectItem value="MQL">{t('mql')}</SelectItem>
                        <SelectItem value="Customer">{t('customer')}</SelectItem>
                        <SelectItem value="Partner">{t('partner')}</SelectItem>
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
                    <FormLabel>{t('jobTitleLabel')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('jobTitlePlaceholder')} {...field} />
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
                    <FormLabel>{t('emailLabel')}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder={t('emailPlaceholder')} {...field} />
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
                    <FormLabel>{t('phoneLabel')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('phonePlaceholder')} {...field} />
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
                    <FormLabel>{t('tagsLabel')}</FormLabel>
                    <FormControl>
                      <div>
                        <Input
                          placeholder={t('tagsPlaceholder')}
                          value={tagInput}
                          onChange={e => setTagInput(e.target.value)}
                          onKeyDown={handleAddTag}
                        />
                        <div className="flex flex-wrap gap-1 mt-2">
                          {field.value?.map((tag: string) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                aria-label={t('removeTagLabel', { tag })}
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
                    <FormLabel>{t('timezoneLabel')}</FormLabel>
                    <FormControl>
                      {/* Replace with a proper timezone select component later */}
                      <Input placeholder={t('timezonePlaceholder')} {...field} />
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
                    <FormLabel>{t('lastCommDateLabel')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value as unknown as Date, 'PPP') // Assert type to Date for formatting
                            ) : (
                              <span>{t('pickDate')}</span>
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
                          disabled={date => date > new Date() || date < new Date('1900-01-01')}
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
                    <FormLabel>{t('lastCommMethodLabel')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('lastCommMethodPlaceholder')} {...field} />
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
                    <FormLabel>{t('commByLabel')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('commByPlaceholder')} {...field} />
                    </FormControl>
                    <FormDescription>{t('commByDescription')}</FormDescription>
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
                  <FormLabel>{t('commSummaryLabel')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('commSummaryPlaceholder')}
                      className="resize-y min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t('commSummaryDescription')}</FormDescription>
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
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                {t('cancelButton')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t('savingButton') : t('saveButton')}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
