'use client'; // Needed for useRouter

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider'; // Import useAuth

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Wait for auth loading to complete
    if (!loading) {
      if (user) {
        // If user is logged in, redirect to dashboard
        router.replace('/dashboard');
      } else {
        // If user is not logged in, redirect to login
        router.replace('/login');
      }
    }
  }, [router, user, loading]);

  // Optional: Render a loading state while checking auth/redirecting
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Return null or minimal content while redirecting
  return null;
}
