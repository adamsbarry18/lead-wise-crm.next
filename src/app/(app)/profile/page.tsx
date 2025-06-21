'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/components/providers/auth-provider';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, KeyRound } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required.'),
  address: z.string().optional(),
  logoUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});
type CompanyFormValues = z.infer<typeof companySchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Current password is required.'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters.'),
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match",
    path: ['confirmPassword'],
  });
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('ProfilePage');
  const [companyDataLoading, setCompanyDataLoading] = useState(true);
  const [isUpdatingCompany, setIsUpdatingCompany] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const companyForm = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: { name: '', address: '', logoUrl: '' },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!user) {
        setCompanyDataLoading(false);
        return;
      }
      try {
        const companyRef = doc(db, 'companies', user.uid);
        const companySnap = await getDoc(companyRef);
        if (companySnap.exists()) {
          const data = companySnap.data();
          companyForm.reset({
            name: data.name || '',
            address: data.address || '',
            logoUrl: data.logoUrl || '',
          });
        } else {
          console.warn(t('companyNotFoundError', { uid: user.uid }));
        }
      } catch (error) {
        console.error('Error fetching company data:', error);
        toast({ variant: 'destructive', title: t('errorLoadingCompany') });
      } finally {
        setCompanyDataLoading(false);
      }
    };
    if (!authLoading) {
      fetchCompanyData();
    }
  }, [user, authLoading, companyForm, toast, t]);

  const onCompanySubmit = async (values: CompanyFormValues) => {
    if (!user) return;
    setIsUpdatingCompany(true);
    try {
      const companyRef = doc(db, 'companies', user.uid);
      const companySnap = await getDoc(companyRef);
      if (companySnap.exists()) {
        await updateDoc(companyRef, { ...values, updatedAt: new Date() });
      } else {
        await setDoc(companyRef, {
          ...values,
          adminEmail: user.email,
          createdAt: new Date(),
        });
        console.warn(t('companyCreatedWarning'));
      }
      toast({ title: t('profileUpdateSuccess'), description: t('profileUpdateSuccessDesc') });
    } catch (error: any) {
      toast({ variant: 'destructive', title: t('updateFailedTitle'), description: error.message });
    } finally {
      setIsUpdatingCompany(false);
    }
  };

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    if (!user || !user.email) {
      toast({ variant: 'destructive', title: 'Error', description: t('userNotFoundError') });
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, values.currentPassword);
      await reauthenticateWithCredential(auth.currentUser!, credential);
      await updatePassword(auth.currentUser!, values.newPassword);
      toast({ title: t('passwordUpdateSuccess'), description: t('passwordUpdateSuccessDesc') });
      passwordForm.reset();
      setShowPasswordDialog(false);
    } catch (error: any) {
      let description = t('passwordUpdateFailedGeneric');
      if (error.code === 'auth/wrong-password') {
        description = t('incorrectPasswordError');
        passwordForm.setError('currentPassword', { type: 'manual', message: description });
      } else if (error.code === 'auth/weak-password') {
        description = t('weakPasswordError');
        passwordForm.setError('newPassword', { type: 'manual', message: description });
      }
      toast({ variant: 'destructive', title: t('passwordUpdateFailed'), description });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const isLoading = authLoading || companyDataLoading;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t('companyInfoCardTitle')}</CardTitle>
          <CardDescription>{t('companyInfoCardDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-8 w-32" />
              </div>
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <Form {...companyForm}>
              <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={companyForm.watch('logoUrl') || undefined} />
                    <AvatarFallback className="text-xl">
                      {companyForm.watch('name') ? (
                        companyForm.watch('name').charAt(0).toUpperCase()
                      ) : (
                        <Upload className="h-6 w-6" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <FormField
                    control={companyForm.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>{t('logoUrlLabel')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('logoUrlPlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={companyForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('companyNameLabel')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('companyNameLabel')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('companyAddressLabel')}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t('companyAddressPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isUpdatingCompany}>
                  {isUpdatingCompany ? t('savingCompanyButton') : t('saveCompanyButton')}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t('accountSettingsCardTitle')}</CardTitle>
          <CardDescription>{t('accountSettingsCardDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div>
              <Label>{t('emailLabel')}</Label>
              <Input value={user?.email || ''} disabled />
              <p className="text-sm text-muted-foreground mt-1">{t('emailChangeNotice')}</p>
            </div>
          )}
          <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <KeyRound className="mr-2 h-4 w-4" /> {t('changePasswordButton')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('passwordDialogTitle')}</AlertDialogTitle>
                <AlertDialogDescription>{t('passwordDialogDescription')}</AlertDialogDescription>
              </AlertDialogHeader>
              <Form {...passwordForm}>
                <form
                  id="password-change-form"
                  onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                  className="space-y-4 pt-4"
                >
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('currentPasswordLabel')}</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('newPasswordLabel')}</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('confirmPasswordLabel')}</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isUpdatingPassword}>
                  {t('cancelButton')}
                </AlertDialogCancel>
                <Button type="submit" form="password-change-form" disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? t('updatingPasswordButton') : t('updatePasswordButton')}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div>
            <Label>{t('mfaLabel')}</Label>
            <Button variant="outline" disabled className="w-full mt-1 justify-start">
              {t('mfaButton')}
            </Button>
            <p className="text-sm text-muted-foreground mt-1">{t('mfaDescription')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
