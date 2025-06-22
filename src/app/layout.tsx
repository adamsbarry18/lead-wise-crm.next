// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Geist } from 'next/font/google';
import { Geist_Mono } from 'next/font/google';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { Providers } from '@/components/providers/providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations('SignupPage');

  return {
    title: t('metadataTitle'),
    description: t('metadataDescription'),
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon.ico',
      apple: '/favicon.ico',
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
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
