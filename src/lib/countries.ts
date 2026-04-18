// ISO 3166-1 country list (display name + ISO-2 code).
// ISO-2 code is used to bias Mapbox geocoding when known.
export interface Country {
  name: string;
  code: string; // ISO 3166-1 alpha-2 (lowercase, suitable for Mapbox `country=` param)
}

export const COUNTRIES: Country[] = [
  { name: 'United States', code: 'us' },
  { name: 'Canada', code: 'ca' },
  { name: 'United Kingdom', code: 'gb' },
  { name: 'Australia', code: 'au' },
  { name: 'France', code: 'fr' },
  { name: 'Germany', code: 'de' },
  { name: 'Spain', code: 'es' },
  { name: 'Italy', code: 'it' },
  { name: 'Netherlands', code: 'nl' },
  { name: 'Belgium', code: 'be' },
  { name: 'Switzerland', code: 'ch' },
  { name: 'Austria', code: 'at' },
  { name: 'Ireland', code: 'ie' },
  { name: 'Portugal', code: 'pt' },
  { name: 'Sweden', code: 'se' },
  { name: 'Norway', code: 'no' },
  { name: 'Denmark', code: 'dk' },
  { name: 'Finland', code: 'fi' },
  { name: 'Iceland', code: 'is' },
  { name: 'Poland', code: 'pl' },
  { name: 'Czech Republic', code: 'cz' },
  { name: 'Greece', code: 'gr' },
  { name: 'Hungary', code: 'hu' },
  { name: 'Romania', code: 'ro' },
  { name: 'Bulgaria', code: 'bg' },
  { name: 'Croatia', code: 'hr' },
  { name: 'Slovenia', code: 'si' },
  { name: 'Slovakia', code: 'sk' },
  { name: 'Estonia', code: 'ee' },
  { name: 'Latvia', code: 'lv' },
  { name: 'Lithuania', code: 'lt' },
  { name: 'Luxembourg', code: 'lu' },
  { name: 'Malta', code: 'mt' },
  { name: 'Cyprus', code: 'cy' },
  { name: 'Mexico', code: 'mx' },
  { name: 'Brazil', code: 'br' },
  { name: 'Argentina', code: 'ar' },
  { name: 'Chile', code: 'cl' },
  { name: 'Colombia', code: 'co' },
  { name: 'Peru', code: 'pe' },
  { name: 'Uruguay', code: 'uy' },
  { name: 'Venezuela', code: 've' },
  { name: 'Ecuador', code: 'ec' },
  { name: 'Bolivia', code: 'bo' },
  { name: 'Paraguay', code: 'py' },
  { name: 'Costa Rica', code: 'cr' },
  { name: 'Panama', code: 'pa' },
  { name: 'Dominica', code: 'dm' },
  { name: 'Dominican Republic', code: 'do' },
  { name: 'Puerto Rico', code: 'pr' },
  { name: 'Jamaica', code: 'jm' },
  { name: 'Trinidad and Tobago', code: 'tt' },
  { name: 'Bahamas', code: 'bs' },
  { name: 'Barbados', code: 'bb' },
  { name: 'Cuba', code: 'cu' },
  { name: 'Haiti', code: 'ht' },
  { name: 'Martinique', code: 'mq' },
  { name: 'Guadeloupe', code: 'gp' },
  { name: 'French Guiana', code: 'gf' },
  { name: 'Réunion', code: 're' },
  { name: 'Japan', code: 'jp' },
  { name: 'South Korea', code: 'kr' },
  { name: 'China', code: 'cn' },
  { name: 'Taiwan', code: 'tw' },
  { name: 'Hong Kong', code: 'hk' },
  { name: 'Singapore', code: 'sg' },
  { name: 'Malaysia', code: 'my' },
  { name: 'Thailand', code: 'th' },
  { name: 'Vietnam', code: 'vn' },
  { name: 'Philippines', code: 'ph' },
  { name: 'Indonesia', code: 'id' },
  { name: 'India', code: 'in' },
  { name: 'Pakistan', code: 'pk' },
  { name: 'Bangladesh', code: 'bd' },
  { name: 'Sri Lanka', code: 'lk' },
  { name: 'Nepal', code: 'np' },
  { name: 'New Zealand', code: 'nz' },
  { name: 'Fiji', code: 'fj' },
  { name: 'United Arab Emirates', code: 'ae' },
  { name: 'Saudi Arabia', code: 'sa' },
  { name: 'Israel', code: 'il' },
  { name: 'Turkey', code: 'tr' },
  { name: 'Qatar', code: 'qa' },
  { name: 'Kuwait', code: 'kw' },
  { name: 'Bahrain', code: 'bh' },
  { name: 'Oman', code: 'om' },
  { name: 'Jordan', code: 'jo' },
  { name: 'Lebanon', code: 'lb' },
  { name: 'Egypt', code: 'eg' },
  { name: 'Morocco', code: 'ma' },
  { name: 'Tunisia', code: 'tn' },
  { name: 'Algeria', code: 'dz' },
  { name: 'South Africa', code: 'za' },
  { name: 'Kenya', code: 'ke' },
  { name: 'Nigeria', code: 'ng' },
  { name: 'Ghana', code: 'gh' },
  { name: 'Ethiopia', code: 'et' },
  { name: 'Tanzania', code: 'tz' },
  { name: 'Uganda', code: 'ug' },
  { name: 'Senegal', code: 'sn' },
  { name: 'Côte d\'Ivoire', code: 'ci' },
  { name: 'Cameroon', code: 'cm' },
  { name: 'Russia', code: 'ru' },
  { name: 'Ukraine', code: 'ua' },
  { name: 'Belarus', code: 'by' },
  { name: 'Serbia', code: 'rs' },
  { name: 'Bosnia and Herzegovina', code: 'ba' },
  { name: 'Albania', code: 'al' },
  { name: 'North Macedonia', code: 'mk' },
  { name: 'Moldova', code: 'md' },
  { name: 'Georgia', code: 'ge' },
  { name: 'Armenia', code: 'am' },
  { name: 'Azerbaijan', code: 'az' },
  { name: 'Kazakhstan', code: 'kz' },
];

/** US states & territories — show "State" picker only when country is United States */
export const US_COUNTRY_NAME = 'United States';

export function isUSCountry(country: string | null | undefined): boolean {
  if (!country) return true; // legacy default
  return country.trim().toLowerCase() === 'united states';
}

/** Look up a country by display name (case-insensitive) */
export function findCountry(name: string | null | undefined): Country | undefined {
  if (!name) return undefined;
  const lower = name.trim().toLowerCase();
  return COUNTRIES.find((c) => c.name.toLowerCase() === lower);
}

/** Smart default from browser locale, e.g. "fr-FR" → "France"; falls back to United States */
export function detectDefaultCountry(): string {
  try {
    const lang = (typeof navigator !== 'undefined' && navigator.language) || 'en-US';
    const region = lang.split('-')[1]?.toLowerCase();
    if (!region) return US_COUNTRY_NAME;
    const match = COUNTRIES.find((c) => c.code === region);
    return match?.name ?? US_COUNTRY_NAME;
  } catch {
    return US_COUNTRY_NAME;
  }
}
