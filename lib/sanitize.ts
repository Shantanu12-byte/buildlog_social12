/**
 * lib/sanitize.ts
 * Centralized sanitization for user input to prevent XSS and DB issues.
 */

export function sanitizeUsername(input: string): string {
  // Only allow lowercase letters, numbers, and underscores
  // Enforce 3-20 characters
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20);
}

export function isValidUsername(username: string): boolean {
  const regex = /^[a-z0-9_]{3,20}$/;
  return regex.test(username);
}

export function sanitizeText(input: string): string {
  if (!input) return '';
  // Remove null bytes and control characters
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

export function sanitizeBio(input: string): string {
  if (!input) return '';
  return sanitizeText(input).slice(0, 200);
}

export function sanitizeCaption(input: string): string {
  if (!input) return '';
  return sanitizeText(input).slice(0, 500);
}

export function sanitizeUrl(input: string): string | null {
  if (!input) return null;
  try {
    const url = new URL(input);
    // Only allow http and https
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}
