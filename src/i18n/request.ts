import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers'; // Import cookies

// Define supported locales and default locale
const locales = ['en', 'fr'];
const defaultLocale = 'en';

export default getRequestConfig(async () => {
  // Read the locale from the NEXT_LOCALE cookie
  const cookieStore = await cookies(); // Await the promise
  let locale = cookieStore.get('NEXT_LOCALE')?.value;

  // Validate the locale from the cookie
  if (!locale || !locales.includes(locale)) {
    locale = defaultLocale; // Fallback to default locale
  }

  let messages;
  try {
    // Load messages for the determined locale
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    console.error(
      `Could not load messages for locale: ${locale}. Falling back to ${defaultLocale}.`,
      error
    );
    // Fallback to default locale messages if loading fails
    messages = (await import(`../../messages/${defaultLocale}.json`)).default;
    locale = defaultLocale; // Ensure locale matches the loaded messages
  }

  return {
    locale, // Return the determined locale
    messages, // Return the loaded messages
  };
});
