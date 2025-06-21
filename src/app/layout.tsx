// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Geist } from 'next/font/google';
import { Geist_Mono } from 'next/font/google';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { Providers } from '@/components/providers/providers'; // Import the new Providers component

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// generateMetadata reste tel quel, il est déjà correct pour une locale non-routable
// Il utilisera la locale déterminée par i18n.ts
export async function generateMetadata(): Promise<Metadata> {
  // Supprimez { params }: GenerateMetadataProps
  const locale = await getLocale();
  const t = await getTranslations('SignupPage');

  return {
    title: t('metadataTitle'),
    description: t('metadataDescription'),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale(); // Utilise la locale déterminée par i18n.ts (via cookie ou Accept-Language)
  const messages = await getMessages(); // Charge les messages pour cette locale

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
