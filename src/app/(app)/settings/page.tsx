'use client';

import React from 'react'; // Removed useState
import {Card, CardHeader, CardTitle, CardContent, CardDescription} from '@/components/ui/card';
// Input is not used, removed import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Button} from '@/components/ui/button';
import {Separator} from '@/components/ui/separator';
import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/components/ui/tabs';
import {UserCog, Database, Palette, Bell, Download} from 'lucide-react'; // Import icons
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {useToast} from '@/hooks/use-toast';
import {useTheme} from 'next-themes';
import {useTranslations, useLocale} from 'next-intl'; // Import translation hooks
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

export default function SettingsPage() {
  const t = useTranslations('SettingsPage');
  const {toast} = useToast();
  const {theme, setTheme} = useTheme();
  const locale = useLocale(); // Get current locale ('en' by default from layout)

  // --- Placeholder Handlers ---
  // These handlers now use translated strings for toasts
  const handleExport = () => {
    toast({title: t('exportInitiated'), description: t('exportDescription')});
  };

  const handleImport = () => {
    // For the alert dialog, we need to translate its content too
    // This requires passing `t` or using a separate component
    // For simplicity, keeping the toast for now.
    toast({title: t('importInitiated'), description: t('importDescription')});
  };

  const handleAuditLogs = () => {
    toast({title: t('auditLogs'), description: t('auditLogsDescription')});
  };

  const handleAddCustomField = () => {
    toast({title: t('customFields'), description: t('customFieldsDescription')});
  };

 const handleLanguageChange = (newLocale: string) => {
    // Set the locale cookie for server-side rendering
    // Expires in ~1 year
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; expires=${expires}; SameSite=Lax`;

    // Store the selected locale in localStorage (optional, for client-side checks if needed)
    localStorage.setItem('locale', newLocale);

    // Reload the page to apply the new locale globally
    // Note: This is a simple approach. A more seamless UX would involve
    // dynamic message loading without a full page reload, potentially using
    // global state management or server actions to update the locale cookie.
    window.location.reload();

    // We might not see this toast due to the immediate reload
    toast({
      title: t('languageChangeTitle', {defaultValue: 'Language Change Initiated'}), // Add default value if key missing
      description: t('languageChangeDescription', {locale: newLocale, defaultValue: `Switching language to ${newLocale}...`}),
    });
  };
  // --- End Placeholder Handlers ---

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

        {/* Profile Tab */}
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

        {/* Data Management Tab */}
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>{t('dataManagement')}</CardTitle>
              <CardDescription>{t('dataDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Custom Fields Configuration */}
              <div className="space-y-2">
                <h3 className="font-medium">{t('customFieldsTitle')}</h3>
                {/* Description for custom fields not in JSON, keeping English for now */}
                <p className="text-sm text-muted-foreground">
                  Define additional fields for your contact records. Use the drag-and-drop interface to reorder.
                </p>
                <div className="p-4 border rounded-lg min-h-[150px] bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground">{t('customFieldsComingSoon')}</p>
                </div>
                <Button variant="outline" disabled onClick={handleAddCustomField}>
                  {t('addCustomFieldButton')}
                </Button>
              </div>

              <Separator />

              {/* Data Import/Export */}
              <div className="space-y-2">
                <h3 className="font-medium">{t('dataImportExportTitle')}</h3>
                <p className="text-sm text-muted-foreground">{t('dataImportExportDescription')}</p>
                <div className="flex gap-2">
                  {/* Alert Dialog for Import */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline">{t('importContactsButton')}</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        {/* Using key from NewContactPage temporarily as it's not in SettingsPage */}
                        <AlertDialogTitle>{t('importContactsAlertTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('importContactsAlertDescription')}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        {/* Using the okButton key from SettingsPage namespace */}
                        <AlertDialogCancel>{t('okButton')}</AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  {/* Export Button */}
                  <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" /> {t('exportContactsButton')}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Audit Logs */}
              <div className="space-y-2">
                <h3 className="font-medium">{t('auditLogsTitle')}</h3>
                 {/* Description for audit logs not in JSON, keeping English for now */}
                <p className="text-sm text-muted-foreground">Track critical actions performed within your account. (Coming Soon)</p>
                <Button variant="outline" disabled onClick={handleAuditLogs}>
                  {t('viewAuditLogsButton')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>{t('appearanceTitle')}</CardTitle>
              <CardDescription>{t('appearanceDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Theme Selection */}
              <div>
                <Label>{t('themeLabel')}</Label>
                <Select onValueChange={setTheme} defaultValue={theme || 'system'}>
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
              {/* Language Selection */}
              <div>
                <Label>{t('languageLabel')}</Label>
                <Select defaultValue={locale} onValueChange={handleLanguageChange}>
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

        {/* Notifications Tab */}
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
