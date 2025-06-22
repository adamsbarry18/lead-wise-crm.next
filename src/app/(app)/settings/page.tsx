'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import {
  doc,
  getDoc,
  setDoc,
  FirestoreError,
  collection,
  query,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { UserCog, Database, Palette, Bell, Download, Upload } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Skeleton } from '@/components/ui/skeleton';
import { setLocale } from '@/i18n/actions';
import { Contact } from '@/types/contact';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { DataExportDialog } from './data-export-dialog';
import { DataImportDialog } from './data-import-dialog';
import { useQueryClient } from '@tanstack/react-query';
import { CustomFieldsManager } from './custom-fields-manager';
import { AuditLogsSection } from './audit-logs-section';
import { Switch } from '@/components/ui/switch';

// --- Data Export Logic ---
type ExportableEntity = 'contacts';

async function fetchContacts(userId: string): Promise<Contact[]> {
  const companyId = userId;
  const contactsCol = collection(db, 'companies', companyId, 'contacts');
  const q = query(contactsCol);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Contact);
}

function prepareContactsForExport(contacts: Contact[]) {
  return contacts.map(contact => {
    const { id, companyId, scoreJustification, tags, lastCommunicationDate, ...rest } = contact;
    return {
      ...rest,
      tags: tags?.join('|') || '',
      lastCommunicationDate: lastCommunicationDate
        ? format(new Date((lastCommunicationDate as any).seconds * 1000), 'yyyy-MM-dd')
        : '',
    };
  });
}

async function exportData(entity: ExportableEntity, userId: string): Promise<Blob> {
  let data;
  switch (entity) {
    case 'contacts':
      const contacts = await fetchContacts(userId);
      if (contacts.length === 0) throw new Error('No contacts to export.');
      data = prepareContactsForExport(contacts);
      break;
    default:
      throw new Error('Unsupported entity type for export');
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, entity);
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8;',
  });
}

// --- Settings Page ---
interface Settings {
  id: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: { email: boolean; push: boolean; inApp: boolean };
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
  const [isPending, startTransition] = React.useTransition();
  const [isExportDialogOpen, setExportDialogOpen] = useState(false);
  const [isImportDialogOpen, setImportDialogOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const t = useTranslations('SettingsPage');
  const tGeneric = useTranslations('Generic');
  const queryClient = useQueryClient();

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
      if (key !== 'language' && key !== 'theme') {
        toast({
          title: tGeneric('updateSuccess'),
        });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: tGeneric('error') });
    }
  };

  const handleLanguageChange = async (newLocale: string) => {
    if (isPending) return;

    await handleSettingChange('language', newLocale);

    toast({
      title: t('languageChangeTitle'),
      description: t('languageChangeDescription', { locale: newLocale }),
    });

    await setLocale(newLocale);
    startTransition(() => {
      router.refresh();
    });
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    handleSettingChange('theme', newTheme);
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

      <Tabs defaultValue="data" className="w-full">
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
              <CustomFieldsManager />
              <Separator />
              <div className="space-y-2">
                <h3 className="font-medium">{t('dataImportExportTitle')}</h3>
                <p className="text-sm text-muted-foreground">{t('dataImportExportDescription')}</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" /> {t('importButton')}
                  </Button>
                  <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
                    <Download className="mr-2 h-4 w-4" /> {t('exportButton')}
                  </Button>
                </div>
              </div>
              <Separator />
              <AuditLogsSection />
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
                  disabled={isPending}
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
                  defaultValue={locale}
                  disabled={isPending}
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
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications" className="font-medium">
                    {t('emailNotificationsLabel')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('emailNotificationsDescription')}
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings?.notifications.email}
                  onCheckedChange={value => handleSettingChange('notifications.email', value)}
                  disabled={isPending}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications" className="font-medium">
                    {t('pushNotificationsLabel')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('pushNotificationsDescription')}
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings?.notifications.push}
                  onCheckedChange={value => handleSettingChange('notifications.push', value)}
                  disabled={isPending}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="inApp-notifications" className="font-medium">
                    {t('inAppNotificationsLabel')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('inAppNotificationsDescription')}
                  </p>
                </div>
                <Switch
                  id="inApp-notifications"
                  checked={settings?.notifications.inApp}
                  onCheckedChange={value => handleSettingChange('notifications.inApp', value)}
                  disabled={isPending}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DataExportDialog isOpen={isExportDialogOpen} onOpenChange={setExportDialogOpen} />
      <DataImportDialog
        isOpen={isImportDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['contacts', user?.uid] });
        }}
      />
    </div>
  );
}
