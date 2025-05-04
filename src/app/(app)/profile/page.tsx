'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/components/providers/auth-provider';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { Upload, KeyRound } from 'lucide-react'; // Import icons
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


// Schema for Company Information
const companySchema = z.object({
  name: z.string().min(1, 'Company name is required.'),
  address: z.string().optional(),
  logoUrl: z.string().url('Invalid URL').optional().or(z.literal('')), // Allow empty string
});
type CompanyFormValues = z.infer<typeof companySchema>;

// Schema for Password Change
const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password is required.'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters.'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ['confirmPassword'], // Set error path to confirmPassword field
});
type PasswordFormValues = z.infer<typeof passwordSchema>;


export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [companyDataLoading, setCompanyDataLoading] = useState(true);
  const [isUpdatingCompany, setIsUpdatingCompany] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);


  const companyForm = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      address: '',
      logoUrl: '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
     resolver: zodResolver(passwordSchema),
     defaultValues: {
       currentPassword: '',
       newPassword: '',
       confirmPassword: '',
     },
   });

  // Fetch company data
  useEffect(() => {
    const fetchCompanyData = async () => {
      if (user) {
        try {
          // Assuming company ID is user's UID for simplicity
          const companyId = user.uid;
          const companyRef = doc(db, 'companies', companyId);
          const companySnap = await getDoc(companyRef);

          if (companySnap.exists()) {
            const data = companySnap.data() as CompanyFormValues; // Cast might need adjustment based on actual data structure
            companyForm.reset({
                name: data.name || '',
                address: data.address || '',
                logoUrl: data.logoUrl || '',
            });
          } else {
             console.warn("Company document not found for user:", user.uid);
              // Maybe set default values or show a message
          }
        } catch (error) {
          console.error('Error fetching company data:', error);
          toast({ variant: 'destructive', title: 'Error', description: 'Could not load company profile.' });
        } finally {
          setCompanyDataLoading(false);
        }
      } else if (!authLoading) {
         // Handle case where user is definitely not logged in (after auth check)
         setCompanyDataLoading(false);
      }
    };

    if (!authLoading) {
        fetchCompanyData();
    }

  }, [user, authLoading, companyForm, toast]);


  const onCompanySubmit = async (values: CompanyFormValues) => {
    if (!user) return;
    setIsUpdatingCompany(true);
    try {
        const companyId = user.uid;
        const companyRef = doc(db, 'companies', companyId);

        // Check if document exists before updating, or use setDoc with merge:true
        const companySnap = await getDoc(companyRef);
        if (companySnap.exists()) {
            await updateDoc(companyRef, {
                ...values,
                updatedAt: new Date(),
            });
        } else {
             // If it doesn't exist (which shouldn't happen if signup creates it), create it.
             await setDoc(companyRef, {
                 ...values,
                 adminEmail: user.email, // Need adminEmail if creating
                 plan: 'Basic', // Default plan or fetch existing if possible
                 createdAt: new Date(),
             });
             console.warn("Company document didn't exist, created one.");
        }


      toast({ title: 'Profile Updated', description: 'Company information saved successfully.' });
    } catch (error: any) {
      console.error('Error updating company profile:', error);
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
      setIsUpdatingCompany(false);
    }
  };


   const onPasswordSubmit = async (values: PasswordFormValues) => {
    if (!user || !user.email) {
        toast({ variant: 'destructive', title: 'Error', description: 'User not found or email missing.' });
        return;
    }
    setIsUpdatingPassword(true);

    try {
      // Re-authenticate the user first
      const credential = EmailAuthProvider.credential(user.email, values.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // If re-authentication is successful, update the password
      await updatePassword(user, values.newPassword);

      toast({ title: 'Password Updated', description: 'Your password has been changed successfully.' });
      passwordForm.reset(); // Clear the form
      setShowPasswordDialog(false); // Close the dialog

    } catch (error: any) {
      console.error('Error updating password:', error);
      let description = 'Failed to update password. Please try again.';
      if (error.code === 'auth/wrong-password') {
        description = 'Incorrect current password.';
        // Set error on the currentPassword field
        passwordForm.setError('currentPassword', { type: 'manual', message: description });
      } else if (error.code === 'auth/weak-password') {
        description = 'The new password is too weak.';
         passwordForm.setError('newPassword', { type: 'manual', message: description });
      } else {
        description = error.message; // General error
      }
      toast({ variant: 'destructive', title: 'Password Update Failed', description });
    } finally {
      setIsUpdatingPassword(false);
    }
   };


   const getInitials = (email: string | null | undefined) => {
     return email ? email.charAt(0).toUpperCase() : '?';
   };

  const isLoading = authLoading || companyDataLoading;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold">Profile & Settings</h1>

      {/* Company Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Update your company's details and logo.</CardDescription>
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
                        {/* Display logo or fallback */}
                        <AvatarImage src={companyForm.watch('logoUrl') || undefined} alt="Company Logo" />
                        <AvatarFallback className="text-xl">
                            {companyForm.watch('name') ? companyForm.watch('name').charAt(0).toUpperCase() : <Upload className="h-6 w-6"/>}
                        </AvatarFallback>
                    </Avatar>
                    {/* Basic Logo URL Input - Consider a file upload component later */}
                    <FormField
                       control={companyForm.control}
                       name="logoUrl"
                       render={({ field }) => (
                         <FormItem className="flex-1">
                           <FormLabel>Logo URL</FormLabel>
                           <FormControl>
                              <Input placeholder="https://example.com/logo.png" {...field} />
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
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Company Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="123 Main St, Anytown, USA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isUpdatingCompany}>
                  {isUpdatingCompany ? 'Saving...' : 'Save Company Info'}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {/* Account Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your login and security preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           {isLoading ? (
               <Skeleton className="h-8 w-full" />
           ) : (
                <div>
                    <Label>Email</Label>
                    <Input value={user?.email || ''} disabled />
                    <p className="text-sm text-muted-foreground mt-1">Email cannot be changed directly. Contact support if needed.</p>
                </div>
           )}

            {/* Change Password */}
            <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                <AlertDialogTrigger asChild>
                    <Button variant="outline">
                        <KeyRound className="mr-2 h-4 w-4" /> Change Password
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Change Your Password</AlertDialogTitle>
                    <AlertDialogDescription>
                        Enter your current password and your new password below.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Form {...passwordForm}>
                         <form id="password-change-form" onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 pt-4">
                            <FormField
                                control={passwordForm.control}
                                name="currentPassword"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Current Password</FormLabel>
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
                                    <FormLabel>New Password</FormLabel>
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
                                    <FormLabel>Confirm New Password</FormLabel>
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
                    <AlertDialogCancel disabled={isUpdatingPassword}>Cancel</AlertDialogCancel>
                     {/* The action button needs to trigger the form submission */}
                     <Button type="submit" form="password-change-form" disabled={isUpdatingPassword}>
                        {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                    </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>


          {/* MFA Placeholder */}
          <div>
            <Label>Multi-Factor Authentication (MFA)</Label>
            <Button variant="outline" disabled className="w-full mt-1 justify-start">
                Enable MFA (Coming Soon)
            </Button>
             <p className="text-sm text-muted-foreground mt-1">Enhance your account security.</p>
          </div>
        </CardContent>
         {/* <CardFooter>
            Optionally add a general save button for the whole page if needed
          </CardFooter> */}
      </Card>
    </div>
  );
}
