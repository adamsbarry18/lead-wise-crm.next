'use server';

import { cookies } from 'next/headers';

export async function setLocale(locale: string) {
  const cookieStore = await cookies();
  cookieStore.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
    httpOnly: true,
  });
}
