// i18n.ts
import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { headers, cookies } from 'next/headers'; // Importez 'cookies' pour lire les cookies

// Définissez vos locales supportées et une locale par défaut
const locales = ['en', 'fr'];
const defaultLocale = 'en'; // Votre locale par défaut

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const storedLocale = cookieStore.get('NEXT_LOCALE')?.value;

  let localeToUse: string = defaultLocale;

  if (storedLocale && locales.includes(storedLocale)) {
    localeToUse = storedLocale;
  } else {
    // Si pas de cookie valide, tentez de détecter via Accept-Language
    const acceptLanguage = (await headers()).get('accept-language');
    const userPreferredLocale = acceptLanguage
      ? acceptLanguage.split(',')[0].split('-')[0].toLowerCase()
      : defaultLocale;

    if (locales.includes(userPreferredLocale)) {
      localeToUse = userPreferredLocale;
    }
  }

  // Optionnel: Si la locale finale n'est pas supportée, déclenchez notFound()
  // if (!locales.includes(localeToUse)) {
  //   notFound();
  // }

  return {
    locale: localeToUse, // Retourne la locale déterminée
    messages: (await import(`../messages/${localeToUse}.json`)).default,
  };
});
