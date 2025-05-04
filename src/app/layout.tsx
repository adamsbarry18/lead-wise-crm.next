import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/components/providers/auth-provider';
import { QueryClientProvider } from '@/components/providers/query-client-provider';
import { Toaster } from '@/components/ui/toaster';
import { Geist } from 'next/font/google'; // Changed from Inter to Geist
import { Geist_Mono } from 'next/font/google';

const geistSans = Geist({ // Changed from Inter to Geist
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});


export const metadata: Metadata = {
  title: 'LeadWise CRM', // Updated App Name
  description: 'Complete lead management CRM powered by AI.', // Updated Description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          geistSans.variable, // Changed from Inter to Geist
          geistMono.variable
        )}
      >
        <QueryClientProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
