'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { doc, getDoc, updateDoc, FirestoreError } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

interface Settings {
  id: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
}

type FlattenedSettings = {
  theme: Settings['theme'];
  language: Settings['language'];
  'notifications.email': boolean;
  'notifications.push': boolean;
  'notifications.inApp': boolean;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations('SettingsPage');
  const tGeneric = useTranslations('Generic');

  React.useEffect(() => {
    const fetchSettings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const settingsRef = doc(db, 'users', user.uid, 'settings', 'preferences');
        const docSnap = await getDoc(settingsRef);

        if (docSnap.exists()) {
          setSettings({ id: docSnap.id, ...docSnap.data() } as Settings);
        } else {
          // Create default settings
          const defaultSettings: Settings = {
            id: 'preferences',
            theme: 'system',
            language: 'en',
            notifications: {
              email: true,
              push: true,
              inApp: true,
            },
          };

          // Create a flattened version for Firebase
          const flattenedSettings: FlattenedSettings = {
            theme: defaultSettings.theme,
            language: defaultSettings.language,
            'notifications.email': defaultSettings.notifications.email,
            'notifications.push': defaultSettings.notifications.push,
            'notifications.inApp': defaultSettings.notifications.inApp,
          };

          await updateDoc(settingsRef, flattenedSettings);
          setSettings(defaultSettings);
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

    fetchSettings();
  }, [user, toast, t, tGeneric]);

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

  if (!settings) {
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
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <h3 className="font-semibold mb-1">{t('themeSettings')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('currentTheme')}</p>
                  <p>{settings.theme}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-1">{t('languageSettings')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('currentLanguage')}</p>
                  <p>{settings.language}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-1">{t('notificationSettings')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('emailNotifications')}</p>
                  <p>{settings.notifications.email ? t('enabled') : t('disabled')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('pushNotifications')}</p>
                  <p>{settings.notifications.push ? t('enabled') : t('disabled')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('inAppNotifications')}</p>
                  <p>{settings.notifications.inApp ? t('enabled') : t('disabled')}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
