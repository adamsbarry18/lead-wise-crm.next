'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl'; // Import useTranslations
import * as z from 'zod';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus } from 'lucide-react'; // Import UserPlus icon

const signupSchema = z.object({
  companyName: z.string().min(1, { message: 'Company name is required.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  plan: z.enum(['Basic', 'Pro', 'Business'], { required_error: 'Please select a plan.' }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const t = useTranslations('SignupPage'); // Initialize translations
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      companyName: '',
      email: '',
      password: '',
      plan: undefined,
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Send email verification
      await sendEmailVerification(user);

      // Create company document in Firestore
      await setDoc(doc(db, 'companies', user.uid), { // Use user UID as company ID for simplicity
        name: values.companyName,
        adminEmail: values.email,
        plan: values.plan,
        createdAt: new Date(),
        // Add default address and logo fields
        address: '',
        logoUrl: '',
      });

       // Create user profile document in Firestore under the company
       // Using user UID as document ID within the users subcollection
       const userDocRef = doc(db, 'companies', user.uid, 'users', user.uid);
       await setDoc(userDocRef, {
         email: user.email,
         role: 'admin', // Initial user is admin
         companyId: user.uid, // Link back to the company
         createdAt: new Date(),
         // Add other user profile fields if needed later
         displayName: user.email, // Default display name
         // profilePictureUrl: '', // Placeholder for profile picture
       });


      toast({
        title: t('signupSuccessTitle'),
        description: t('signupSuccessDescription'),
      });
      router.push('/login'); // Redirect to login page after signup
    } catch (error: any) {
      console.error("Signup error:", error);
      let errorMessage = t('Generic.unexpectedError', { ns: 'Generic' }); // Use generic unexpected error
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = t('emailInUseError');
      } else if (error.code === 'auth/weak-password') {
        errorMessage = t('weakPasswordError');
      } else if (error.message) {
        errorMessage = error.message; // Use Firebase error message if available and not handled above
      }
      toast({
        variant: 'destructive',
        title: t('signupFailedTitle'),
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center text-center space-y-2 mb-6">
        <UserPlus className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('companyNameLabel')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('companyNamePlaceholder')} {...field} />
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('passwordLabel')}</FormLabel>
                <FormControl>
                  <Input type="password" placeholder={t('passwordPlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="plan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('planLabel')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('planPlaceholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Basic">{t('basicPlan')}</SelectItem>
                    <SelectItem value="Pro">{t('proPlan')}</SelectItem>
                    <SelectItem value="Business">{t('businessPlan')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('loadingButton') : t('signupButton')}
          </Button>
        </form>
      </Form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t('loginPrompt')}{' '}
        <Link href="/login" className="underline text-primary hover:text-primary/90">
          {t('loginLink')}
        </Link>
      </p>
    </>
  );
}
