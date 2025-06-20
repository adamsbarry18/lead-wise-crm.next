'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { doc, getDoc, setDoc, FirestoreError } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
} from '@/components/ui/alert-dialog';
import { UserCog, Database, Palette, Bell, Download, ArrowLeft } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Skeleton } from '@/components/ui/skeleton';

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
  const pathname = usePathname();
  const locale = useLocale();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
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
          const data = docSnap.data();
          const loadedSettings: Settings = {
            id: 'preferences',
            theme: data.theme || 'system',
            language: data.language || 'en',
            notifications: {
              email: data['notifications.email'] ?? true,
              push: data['notifications.push'] ?? true,
              inApp: data['notifications.inApp'] ?? true,
            },
          };
          setSettings(loadedSettings);
        } else {
          const defaultSettings: Settings = {
            id: 'preferences',
            theme: 'system',
            language: 'fr',
            notifications: { email: true, push: true, inApp: true },
          };
          await setDoc(doc(db, 'users', user.uid, 'settings', 'preferences'), {
            theme: defaultSettings.theme,
            language: defaultSettings.language,
            'notifications.email': defaultSettings.notifications.email,
            'notifications.push': defaultSettings.notifications.push,
            'notifications.inApp': defaultSettings.notifications.inApp,
          });
          setSettings(defaultSettings);
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: t('loadingErrorTitle'),
          description: (error as FirestoreError).message,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [user, toast, t]);

  const handleSettingChange = async (key: keyof FlattenedSettings, value: any) => {
    if (!user) return;

    try {
      const settingsRef = doc(db, 'users', user.uid, 'settings', 'preferences');
      await setDoc(settingsRef, { [key]: value }, { merge: true });
      toast({
        title: t('languageChangeTitle'),
        description: t('languageChangeDescription', { locale: value }),
      });
    } catch (error) {
      toast({ variant: 'destructive', title: tGeneric('error') });
    }
  };

  const handleLanguageChange = (newLocale: string) => {
    handleSettingChange('language', newLocale);
    const newPath = pathname.replace(new RegExp(`^/${locale}`), `/${newLocale}`);
    router.replace(newPath);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    handleSettingChange('theme', newTheme);
  };

  const handleExport = () => {
    toast({ title: t('exportInitiated'), description: t('exportDescription') });
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-4">
        <Skeleton className="h-8 w-1/4" />
        <div className="flex border-b">
          <Skeleton className="h-10 w-1/4 mr-1" />
          <Skeleton className="h-10 w-1/4 mr-1" />
          <Skeleton className="h-10 w-1/4 mr-1" />
          <Skeleton className="h-10 w-1/4" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">
            <UserCog className="mr-2 h-4 w-4" />
            {t('profileTab')}
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="mr-2 h-4 w-4" />
            {t('dataManagementTab')}
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="mr-2 h-4 w-4" />
            {t('appearanceTab')}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            {t('notificationsTab')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t('profileSettings')}</CardTitle>
              <CardDescription>{t('profileDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                {t('profileContent')}{' '}
                <a href="/profile" className="text-primary underline">
                  {t('profileLink')}
                </a>
                .
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>{t('dataManagement')}</CardTitle>
              <CardDescription>{t('dataDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-medium">{t('customFieldsTitle')}</h3>
                <div className="p-4 border rounded-lg min-h-[150px] bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground">{t('customFieldsComingSoon')}</p>
                </div>
                <Button variant="outline" disabled>
                  {t('addCustomFieldButton')}
                </Button>
              </div>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-medium">{t('dataImportExportTitle')}</h3>
                <p className="text-sm text-muted-foreground">{t('dataImportExportDescription')}</p>
                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline">{t('importContactsButton')}</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('importContactsAlertTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('importContactsAlertDescription')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('okButton')}</AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" /> {t('exportContactsButton')}
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-medium">{t('auditLogsTitle')}</h3>
                <Button variant="outline" disabled>
                  {t('viewAuditLogsButton')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>{t('appearanceTitle')}</CardTitle>
              <CardDescription>{t('appearanceDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t('themeLabel')}</Label>
                <Select
                  onValueChange={value => handleThemeChange(value as any)}
                  defaultValue={theme}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t('selectTheme')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{t('lightTheme')}</SelectItem>
                    <SelectItem value="dark">{t('darkTheme')}</SelectItem>
                    <SelectItem value="system">{t('systemTheme')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('languageLabel')}</Label>
                <Select
                  onValueChange={handleLanguageChange}
                  defaultValue={settings?.language || 'fr'}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t('selectLanguage')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t('english')}</SelectItem>
                    <SelectItem value="fr">{t('french')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t('notificationsTitle')}</CardTitle>
              <CardDescription>{t('notificationsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t('notificationsComingSoon')}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
