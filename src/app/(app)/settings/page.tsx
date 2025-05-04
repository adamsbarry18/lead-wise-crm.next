'use client';

import React, {useState} from 'react';
import {Card, CardHeader, CardTitle, CardContent, CardDescription} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
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
import {useToast} from '@/hooks/use-toast'; // Import useToast
import {useTheme} from 'next-themes'; // Import useTheme from next-themes
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
  const {toast} = useToast(); // Initialize toast
  const {theme, setTheme} = useTheme(); // Initialize theme
  const [language, setLanguage] = useState('en');

  // Placeholder state and handlers - replace with actual logic
  const handleExport = () => {
    // TODO: Implement actual data export logic (e.g., fetch contacts, generate CSV, trigger download)
    toast({title: 'Export Initiated', description: 'Your contact data will be downloaded shortly. (Not Implemented)'});
    // In real implementation, trigger download here
  };

  const handleImport = () => {
    // TODO: Implement actual data import logic
    toast({title: 'Import Initiated', description: 'Import functionality is coming soon.'});
  };

  const handleAuditLogs = () => {
    // TODO: Implement actual audit log viewing
    toast({title: 'Audit Logs', description: 'Audit logs are coming soon.'});
  };

  const handleAddCustomField = () => {
    // TODO: Implement actual custom field creation
    toast({title: 'Custom Fields', description: 'Custom field creation is coming soon.'});
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">
            <UserCog className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="mr-2 h-4 w-4" />
            Data Mgmt
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="mr-2 h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab (already exists as /profile, link or duplicate basic info?) */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Manage your personal and company information.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Your primary profile settings are managed on the{' '}
                <a href="/profile" className="text-primary underline">
                  Profile page
                </a>
                .
              </p>
              {/* Optionally include some quick links or basic settings here */}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management Tab */}
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Configure contact fields and manage data import/export.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Custom Fields Configuration */}
              <div className="space-y-2">
                <h3 className="font-medium">Custom Contact Fields</h3>
                <p className="text-sm text-muted-foreground">
                  Define additional fields for your contact records. Use the drag-and-drop interface to reorder.
                </p>
                {/* Placeholder for drag-and-drop interface */}
                <div className="p-4 border rounded-lg min-h-[150px] bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground">Custom Field Configuration (Coming Soon)</p>
                  {/* Map through existing fields, add button to create new */}
                </div>
                <Button variant="outline" disabled onClick={handleAddCustomField}>
                  Add Custom Field
                </Button>
              </div>

              <Separator />

              {/* Data Import/Export */}
              <div className="space-y-2">
                <h3 className="font-medium">Data Import/Export</h3>
                <p className="text-sm text-muted-foreground">Import contacts from CSV or export your data.</p>
                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline">Import Contacts (CSV)</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Import Contacts</AlertDialogTitle>
                        <AlertDialogDescription>This feature is coming soon. Please check back later.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>OK</AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" /> Export All Contacts (Excel)
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Audit Logs Placeholder */}
              <div className="space-y-2">
                <h3 className="font-medium">Audit Logs</h3>
                <p className="text-sm text-muted-foreground">Track critical actions performed within your account. (Coming Soon)</p>
                <Button variant="outline" disabled onClick={handleAuditLogs}>
                  View Audit Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel of the application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Theme selection could go here (Light/Dark/System) */}
              <div>
                <Label>Theme</Label>
                <Select onValueChange={setTheme} defaultValue={theme || 'system'}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Language</Label>
                <Select defaultValue={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English (EN)</SelectItem>
                    <SelectItem value="fr" disabled>
                      French (FR) (Coming Soon)
                    </SelectItem>
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
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage how you receive notifications.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Notification settings (e.g., email digests, in-app alerts) will be available here soon.</p>
              {/* Add notification toggles */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
