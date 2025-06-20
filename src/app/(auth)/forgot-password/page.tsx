// src/app/(auth)/forgot-password/page.tsx
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { MailQuestion } from 'lucide-react';
import { useTranslations } from 'next-intl'; // Import useTranslations

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();
  const t = useTranslations('ForgotPasswordPage'); // Initialize useTranslations

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setLoading(true);
    setEmailSent(false);
    try {
      await sendPasswordResetEmail(auth, values.email);
      toast({
        title: t('resetEmailSentTitle'),
        description: t('resetEmailSentDescription'),
      });
      setEmailSent(true); // Indicate that the email was sent
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        variant: 'destructive',
        title: t('resetFailedTitle'),
        description: error.message || t('resetFailedDescription'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center text-center space-y-2 mb-6">
        <MailQuestion className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>

      {emailSent ? (
        <div className="text-center space-y-4">
          <p className="text-green-600">
            {t('emailSentSuccess', { email: form.getValues('email') })}
          </p>
          <Button variant="outline" asChild>
            <Link href="/login">{t('backToLoginButton')}</Link>
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('loadingButton') : t('sendButton')}
            </Button>
          </form>
        </Form>
      )}

      {!emailSent && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t('rememberPasswordPrompt')}{' '}
          <Link href="/login" className="underline text-primary hover:text-primary/90">
            {t('loginLink')}
          </Link>
        </p>
      )}
    </>
  );
}
