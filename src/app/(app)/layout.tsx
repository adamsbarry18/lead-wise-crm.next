'use client';

import React from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings, LayoutDashboard, Users, BarChart, LifeBuoy } from 'lucide-react'; // Import necessary icons
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl'; // Import useTranslations

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations('AppLayout'); // Initialize translations

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    // Optional: Redirect verified users trying to access auth pages to dashboard
    // else if (!loading && user && (pathname === '/login' || pathname === '/signup')) {
    //   router.push('/dashboard');
    // }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: t('logoutSuccessTitle'), description: t('logoutSuccessDescription') });
      router.push('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        variant: 'destructive',
        title: t('logoutFailedTitle'),
        description: error.message || t('logoutFailedDescription'),
      });
    }
  };

  if (loading || !user) {
    // Optionally return a loading skeleton or null while redirecting
    return (
      <div className="flex items-center justify-center min-h-screen">
        {/* You can reuse the skeleton from auth-provider or create a specific one */}
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Get first letter for Avatar Fallback
  const getInitials = (email: string | null | undefined) => {
    return email ? email.charAt(0).toUpperCase() : '?';
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-lg">
            {/* Placeholder Logo - Replace with actual logo */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 text-primary"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
            </svg>
            <span className="group-data-[collapsible=icon]:hidden">{t('appName')}</span>
          </Link>
          {/* Trigger is usually outside the sidebar in the main content header */}
        </SidebarHeader>
        <SidebarContent className="flex-1 overflow-y-auto">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t('dashboardTooltip')}>
                <Link href="/dashboard">
                  <LayoutDashboard />
                  <span>{t('dashboardLabel')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t('contactsTooltip')}>
                <Link href="/contacts">
                  <Users />
                  <span>{t('contactsLabel')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t('analyticsTooltip')}>
                <Link href="/analytics">
                  <BarChart />
                  <span>{t('analyticsLabel')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {/* Add more menu items here */}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2 border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t('supportTooltip')}>
                <Link href="/support">
                  <LifeBuoy />
                  <span>{t('supportLabel')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t('settingsTooltip')}>
                <Link href="/settings">
                  <Settings />
                  <span>{t('settingsLabel')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-h-screen">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
          <SidebarTrigger className="md:hidden" /> {/* Mobile trigger */}
          <div className="ml-auto flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user?.photoURL || undefined}
                      alt={user?.displayName || user?.email || 'User'}
                    />
                    <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('accountMenuLabel')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    {t('profileLink')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    {t('settingsLink')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('logoutButton')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        {/* Use SidebarInset for the main content if using 'inset' variant, otherwise use a regular div */}
        {/* <SidebarInset> */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
        {/* </SidebarInset> */}
      </div>
    </SidebarProvider>
  );
}
