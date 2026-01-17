import type { Park } from '@/types';

// Create custom paw marker element
export const createPawMarker = (isSelected: boolean = false) => {
  const el = document.createElement('div');
  el.className = 'paw-marker';
  el.innerHTML = `
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11" fill="${isSelected ? 'hsl(25, 95%, 53%)' : 'hsl(25, 95%, 53%)'}" stroke="white" stroke-width="2"/>
      <path d="M12 14c-1.3 0-2.4 1-2.9 2.2-.2.5.1 1 .7 1h4.4c.6 0 .9-.5.7-1-.5-1.2-1.6-2.2-2.9-2.2z" fill="white"/>
      <ellipse cx="9" cy="11" rx="1.3" ry="1.7" fill="white"/>
      <ellipse cx="15" cy="11" rx="1.3" ry="1.7" fill="white"/>
      <ellipse cx="10.5" cy="8.5" rx="1" ry="1.3" fill="white"/>
      <ellipse cx="13.5" cy="8.5" rx="1" ry="1.3" fill="white"/>
    </svg>
  `;
  el.style.cursor = 'pointer';
  el.style.transition = 'transform 0.2s ease';
  
  if (isSelected) {
    el.style.transform = 'scale(1.2)';
    el.style.zIndex = '10';
  }
  
  return el;
};

// Generate popup HTML with amenities
export const createPopupHTML = (park: Park) => {
  const amenities: string[] = [];
  if (park.is_fenced) amenities.push('<span class="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">🔒 Fenced</span>');
  if (park.has_water_fountain) amenities.push('<span class="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">💧 Water</span>');
  if (park.is_dog_friendly) amenities.push('<span class="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">🐕 Dog Friendly</span>');

  return `
    <div class="p-3 min-w-[220px]">
      <h3 class="font-bold text-base mb-1">🐾 ${park.name}</h3>
      <p class="text-xs text-gray-500 mb-2">${park.address || 'Dog Park'}</p>
      ${park.rating ? `
        <div class="flex items-center gap-1 mb-2">
          <span class="text-yellow-500">★</span>
          <span class="text-sm font-medium">${park.rating.toFixed(1)}</span>
          <span class="text-xs text-gray-400">(${park.user_ratings_total || 0})</span>
        </div>
      ` : ''}
      ${amenities.length > 0 ? `<div class="flex flex-wrap gap-1">${amenities.slice(0, 3).join('')}</div>` : ''}
      <p class="text-xs text-primary mt-2 font-medium">Tap for paw-some details! 🐕</p>
    </div>
  `;
};
