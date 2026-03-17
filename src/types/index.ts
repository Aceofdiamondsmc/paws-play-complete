// Core types for Paws Play Repeat

export interface Park {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  geom: unknown | null; // PostGIS geometry column for spatial queries
  image_url: string | null;
  rating: number | null;
  user_ratings_total: number | null;
  is_fully_fenced: boolean | null;
  has_water_station: boolean | null;
  has_small_dog_area: boolean | null;
  has_large_dog_area: boolean | null;
  has_agility_equipment: boolean | null;
  has_parking: boolean | null;
  has_grass_surface: boolean | null;
  is_dog_friendly: boolean | null;
  gemini_summary: string | null;
  place_id: string | null;
  added_by: string | null;
  created_at: string | null;
  updated_at: string;
  // Distance in meters (populated by nearby queries)
  distance?: number;
}

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  is_public: boolean;
  onboarding_completed: boolean | null;
  location_public: boolean;
  onesignal_player_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Dog {
  id: string;
  owner_id: string;
  name: string;
  breed: string | null;
  size: string | null;
  energy_level: string | null;
  bio: string | null;
  avatar_url: string | null;
  age_years: number | null;
  weight_lbs: number | null;
  health_notes: string | null;
  play_style: string[] | null;
  vaccination_certified: boolean | null;
  vet_verified: boolean | null;
  date_of_birth: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PlayStyle {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  created_at: string | null;
  updated_at: string | null;
}

export interface PlaydateRequest {
  id: string;
  requester_id: string | null;
  sender_dog_id: string | null;
  receiver_dog_id: string | null;
  location_name: string | null;
  requested_date: string | null;
  requested_time: string | null;
  request_message: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Post {
  id: string;
  author_id: string;
  dog_id: string | null;
  content: string;
  image_url: string | null;
  video_url: string | null;
  pup_name: string | null;
  visibility: 'public' | 'private';
  created_at: string | null;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string | null;
}

export interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  status: string;
  playdate_request_id: string | null;
  last_message_at: string | null;
  created_at: string | null;
}

export type ParkFilter = 
  | 'fenced'
  | 'water'
  | 'small-dogs'
  | 'large-dogs'
  | 'agility'
  | 'parking'
  | 'grass';

export interface FilterOption {
  id: ParkFilter;
  label: string;
  icon: string;
}

export type TabName = 'parks' | 'explore' | 'social' | 'dates' | 'pack' | 'me' | 'shop';

// Discovery dog with distance info for Pack tab
export interface DogWithDistance {
  id: string;
  owner_id: string;
  name: string;
  breed: string | null;
  size: string | null;
  energy_level: string | null;
  bio: string | null;
  avatar_url: string | null;
  age_years: number | null;
  play_style: string[] | null;
  created_at: string | null;
  owner_display_name: string | null;
  owner_avatar_url: string | null;
  owner_city: string | null;
  owner_state: string | null;
  distance_meters: number | null;
}
