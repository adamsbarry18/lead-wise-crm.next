'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { doc, getDoc, updateDoc, FirestoreError } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: any; // Firestore Timestamp
  lastLoginAt: any; // Firestore Timestamp
  role: string;
  company?: {
    name: string;
    position: string;
  };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations('ProfilePage');
  const tGeneric = useTranslations('Generic');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const profileRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(profileRef);

        if (docSnap.exists()) {
          setProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
        } else {
          toast({
            variant: 'destructive',
            title: t('notFoundTitle'),
            description: t('notFoundDescription'),
          });
          router.push('/');
        }
      } catch (error) {
        const firestoreError = error as FirestoreError;
        toast({
          variant: 'destructive',
          title: t('loadingErrorTitle'),
          description: firestoreError.message || tGeneric('unexpectedError'),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, router, toast, t, tGeneric]);

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-gray-200 animate-pulse rounded mb-2"></div>
            <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 w-full bg-gray-200 animate-pulse rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{t('notFoundTitle')}</h1>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">{t('notFoundDescription')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center space-x-4 mb-8">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('detailsTitle')}</CardTitle>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.photoURL} alt={profile.displayName} />
              <AvatarFallback>{profile.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{profile.displayName}</h2>
              <p className="text-muted-foreground">{profile.email}</p>
              <Badge variant="outline" className="mt-2">
                {profile.role}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {profile.company && (
              <div>
                <h3 className="font-semibold mb-1">{t('companyInfo')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('companyName')}</p>
                    <p>{profile.company.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('position')}</p>
                    <p>{profile.company.position}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-1">{t('accountInfo')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('createdAt')}</p>
                  <p>
                    {profile.createdAt
                      ? format(new Date(profile.createdAt.seconds * 1000), 'PPP')
                      : tGeneric('na')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('lastLoginAt')}</p>
                  <p>
                    {profile.lastLoginAt
                      ? format(new Date(profile.lastLoginAt.seconds * 1000), 'PPP')
                      : tGeneric('na')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
