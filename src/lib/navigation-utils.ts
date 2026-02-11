/**
 * Navigation utilities for smart routing to external map apps
 */

/**
 * Detect if the device is running iOS
 */
export function isIOS(): boolean {
  const ua = navigator.userAgent;
  const platform = navigator.platform;

  // iPhone/iPad/iPod (classic)
  const classicIOS = /iPad|iPhone|iPod/.test(ua);

  // iPadOS 13+ reports itself as Mac; detect via touch points
  const iPadOS = platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1;

  return (classicIOS || iPadOS) && !(window as any).MSStream;
}

/**
 * Check if running as installed PWA (standalone mode)
 */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Check if iOS Safari (not Chrome/Firefox on iOS)
 */
export function isIOSSafari(): boolean {
  const ua = navigator.userAgent;
  const isIOSDevice = /iPad|iPhone|iPod/.test(ua);
  const isWebkit = /WebKit/.test(ua);
  const isChrome = /CriOS/.test(ua);
  const isFirefox = /FxiOS/.test(ua);
  return isIOSDevice && isWebkit && !isChrome && !isFirefox;
}

/**
 * Detect if the device is running Android
 */
export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

/**
 * Get the navigation URL for a given destination
 * On iOS, returns Apple Maps URL
 * On Android/Desktop, returns Google Maps URL
 */
export function getNavigationUrl(lat: number, lng: number): string {
  if (isIOS()) {
    // Apple Maps URL scheme
    return `maps://maps.apple.com/?daddr=${lat},${lng}`;
  }
  // Google Maps for Android and Desktop
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/**
 * Get Google Maps URL specifically (fallback for iOS users who prefer Google Maps)
 */
export function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/**
 * Get Apple Maps URL specifically
 * Using https:// format for universal compatibility across iOS versions and PWAs
 */
export function getAppleMapsUrl(lat: number, lng: number): string {
  return `https://maps.apple.com/?daddr=${lat},${lng}`;
}

/**
 * Check if a coordinate value is valid (not null, NaN, or out of range)
 * Handles both number and string types since database may return "NaN" strings
 */
export function isValidCoordinate(value: unknown): value is number {
  if (typeof value === 'number') {
    return !isNaN(value) && isFinite(value);
  }
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num);
  }
  return false;
}

/**
 * Check if a park has valid navigable coordinates
 * Validates both values are numbers within valid geographic ranges
 */
export function hasValidCoords(lat: unknown, lng: unknown): boolean {
  if (!isValidCoordinate(lat) || !isValidCoordinate(lng)) {
    return false;
  }
  const latNum = typeof lat === 'string' ? parseFloat(lat) : lat;
  const lngNum = typeof lng === 'string' ? parseFloat(lng) : lng;
  return latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180;
}

/**
 * Get validated numeric coordinates from potentially string/mixed values
 * Returns null if coordinates are invalid
 */
export function getValidCoords(lat: unknown, lng: unknown): { lat: number; lng: number } | null {
  if (!hasValidCoords(lat, lng)) return null;
  return {
    lat: typeof lat === 'string' ? parseFloat(lat) : lat as number,
    lng: typeof lng === 'string' ? parseFloat(lng) : lng as number
  };
}

/**
 * Calculate straight-line distance between two points using Haversine formula
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format distance for display in miles (US-friendly)
 * @param meters - Distance in meters
 * @returns Human-readable distance string in miles
 */
export function formatDistanceMiles(meters: number | undefined): string {
  if (!meters) return '';
  
  const miles = meters / 1609.344;
  
  if (miles < 0.1) {
    // Show in feet for very short distances
    const feet = Math.round(meters * 3.28084);
    return `${feet} ft`;
  }
  
  if (miles < 10) {
    return `${miles.toFixed(1)} mi`;
  }
  
  return `${Math.round(miles)} mi`;
}

/**
 * Open navigation with device-appropriate handling
 * On iOS, offers choice between Apple Maps and Google Maps
 * On other devices, opens Google Maps directly
 */
export function openNavigation(lat: number, lng: number, parkName?: string): void {
  if (isIOS()) {
    const useAppleMaps = window.confirm(
      `Navigate to ${parkName || 'park'}?\n\nPress OK for Apple Maps\nPress Cancel for Google Maps`
    );
    
    if (useAppleMaps) {
      window.open(getAppleMapsUrl(lat, lng), '_blank');
    } else {
      window.open(getGoogleMapsUrl(lat, lng), '_blank');
    }
  } else {
    window.open(getGoogleMapsUrl(lat, lng), '_blank');
  }
}

/**
 * Open navigation using an address string (for parks without valid coordinates)
 * Opens Google Maps search with the address
 */
export function openNavigationByAddress(address: string, parkName?: string): void {
  const query = encodeURIComponent(parkName ? `${parkName}, ${address}` : address);
  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
}
