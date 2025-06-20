'use client';

import React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { ThemeProvider } from 'next-themes';
import { QueryClientProvider as ReactQueryClientProvider } from '@/components/providers/query-client-provider'; // Renamed to avoid conflict
import { AuthProvider } from '@/components/providers/auth-provider';
import { Toaster } from '@/components/ui/toaster';

interface ProvidersProps {
  children: React.ReactNode;
  locale: string;
  messages: any; // Adjust type as needed, 'any' for simplicity here
}

export function Providers({ children, locale, messages }: ProvidersProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <ReactQueryClientProvider>
          {' '}
          {/* Use the renamed import */}
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ReactQueryClientProvider>{' '}
        {/* Use the renamed import */}
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
