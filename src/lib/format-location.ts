import { isUSCountry } from './countries';

/**
 * Format a location string for display.
 * - US:     "City, ST"           (e.g. "Las Vegas, NV")
 * - Non-US: "City, Region, Country" (e.g. "Fort-de-France, Martinique, France")
 *
 * Skips empty parts gracefully.
 */
export function formatLocation(
  city?: string | null,
  state?: string | null,
  country?: string | null,
): string {
  const parts: string[] = [];
  if (city) parts.push(city.trim());
  if (state) parts.push(state.trim());
  if (country && !isUSCountry(country)) parts.push(country.trim());
  return parts.filter(Boolean).join(', ');
}
