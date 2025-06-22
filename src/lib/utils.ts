import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely converts a Firestore timestamp to a JavaScript Date object
 * Handles different timestamp formats and edge cases
 */
export function safeTimestampToDate(timestamp: any): Date | null {
  if (!timestamp) return null;

  try {
    // If it's already a Date object
    if (timestamp instanceof Date) {
      return timestamp;
    }

    // If it's a Firestore Timestamp object
    if (
      timestamp &&
      typeof timestamp === 'object' &&
      'seconds' in timestamp &&
      'nanoseconds' in timestamp
    ) {
      return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
    }

    // If it's a timestamp with just seconds
    if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
      return new Date(timestamp.seconds * 1000);
    }

    // If it's a number (milliseconds since epoch)
    if (typeof timestamp === 'number') {
      return new Date(timestamp);
    }

    // If it's a string that can be parsed as a date
    if (typeof timestamp === 'string') {
      const parsed = new Date(timestamp);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return null;
  } catch (error) {
    console.warn('Error converting timestamp to date:', error, timestamp);
    return null;
  }
}

/**
 * Safely formats a Firestore timestamp using date-fns format function
 * Returns a fallback string if formatting fails
 */
export function safeFormatTimestamp(
  timestamp: any,
  formatString: string,
  fallback = 'N/A'
): string {
  const date = safeTimestampToDate(timestamp);
  if (!date) return fallback;

  try {
    return format(date, formatString);
  } catch (error) {
    console.warn('Error formatting timestamp:', error, timestamp);
    return fallback;
  }
}
