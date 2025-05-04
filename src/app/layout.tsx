import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
// Removed useTranslations import
import './globals.css';
import { cn } from '@/lib/utils';
// Removed AuthProvider, QueryClientProvider, Toaster, NextIntlClientProvider, ThemeProvider imports
import { Geist } from 'next/font/google';
import { Geist_Mono } from 'next/font/google';
import {getLocale, getMessages, getTranslations} from 'next-intl/server'; // Add getTranslations import
import { Providers } from '@/components/providers/providers'; // Import the new Providers component

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});


// Removed const t = useTranslations('AppLayout');

// Use generateMetadata for server-side translations
export async function generateMetadata({params: {locale}}: {params: {locale: string}}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'SignupPage' }); // Use SignupPage namespace for metadata

  return {
    title: t('metadataTitle'),
    description: t('metadataDescription'),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale(); // Gets 'en' from request.ts
  const messages = await getMessages(); // Gets messages for 'en'

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          geistSans.variable,
          geistMono.variable
        )}
      >
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
