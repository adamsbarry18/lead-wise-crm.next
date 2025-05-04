'use client';

import React, { useState } from 'react';
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


  const form = useForm<Contact>({
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
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to add contacts.' });
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
        title: 'Contact Added',
        description: `${values.name} has been successfully added.`,
      });
      router.push('/contacts'); // Redirect back to contacts list
    } catch (error: any) {
      console.error("Error adding contact:", error);
      toast({
        variant: 'destructive',
        title: 'Failed to Add Contact',
        description: error.message || 'An unexpected error occurred.',
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
             Add New Contact
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
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
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
                          <FormLabel>Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select contact type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Prospect">Prospect</SelectItem>
                              <SelectItem value="Lead">Lead</SelectItem>
                              <SelectItem value="MQL">MQL (Marketing Qualified Lead)</SelectItem>
                              <SelectItem value="Customer">Customer</SelectItem>
                              <SelectItem value="Partner">Partner</SelectItem>
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
                       <FormLabel>Job Title</FormLabel>
                       <FormControl>
                         <Input placeholder="CEO, Marketing Manager..." {...field} />
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
                       <FormLabel>Email</FormLabel>
                       <FormControl>
                         <Input type="email" placeholder="john.doe@example.com" {...field} />
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
                       <FormLabel>Phone</FormLabel>
                       <FormControl>
                         <Input placeholder="+1 123 456 7890" {...field} />
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
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                            <div>
                                <Input
                                    placeholder="Add tags (press Enter)"
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
                                            aria-label={`Remove ${tag} tag`}
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
                       <FormLabel>Timezone</FormLabel>
                       <FormControl>
                         {/* Replace with a proper timezone select component later */}
                         <Input placeholder="e.g., America/New_York" {...field} />
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
                         <FormLabel>Last Communication Date</FormLabel>
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
                                   <span>Pick a date</span>
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
                        <FormLabel>Last Communication Method</FormLabel>
                        <FormControl>
                            <Input placeholder="Email, Call, Meeting..." {...field} />
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
                        <FormLabel>Communicated By (Agent)</FormLabel>
                        <FormControl>
                            <Input placeholder="Agent name or email" {...field} />
                        </FormControl>
                        <FormDescription>Who last interacted with the contact.</FormDescription>
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
                       <FormLabel>Communication Summary</FormLabel>
                       <FormControl>
                         <Textarea
                           placeholder="Enter a summary of communications, or let AI generate it later."
                           className="resize-y min-h-[100px]"
                           {...field}
                         />
                       </FormControl>
                       <FormDescription>A brief overview of interactions.</FormDescription>
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
                        Cancel
                    </Button>
                   <Button type="submit" disabled={loading}>
                     {loading ? 'Saving...' : 'Save Contact'}
                   </Button>
               </CardFooter>
             </form>
           </Form>
        </CardContent>
     </Card>
  );
}
