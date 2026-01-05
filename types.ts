
export enum Role {
  ADMIN = 'ADMIN',
  PROVIDER = 'PROVIDER',
  PATIENT = 'PATIENT',
  // Legacy support for UI
  CLINIC_OWNER = 'PROVIDER',
  PHARMACY_OWNER = 'PROVIDER'
}

export enum EntityType {
  CLINIC = 'CLINIC',
  PHARMACY = 'PHARMACY'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  phone?: string;
}

export interface City {
  id: number;
  name_en: string;
  name_ar: string;
}

export interface Specialty {
  id: number;
  name_en: string;
  name_ar: string;
}

export interface Facility {
  id: string;
  type: EntityType;
  owner_id: string;
  
  // Display names (computed or fetched)
  name?: string; 
  name_en: string;
  name_ar: string;
  
  // Location
  city_id: number;
  city_name?: string; // For display
  location_en?: string;
  location_ar?: string;
  
  // Common
  image?: string; // mapped from logo_url in DB
  logo_url?: string; // DB field
  is_verified?: boolean;
  phone?: string; // mapped from contact_phone
  created_at?: string;
  
  // Clinic specific
  services?: string[];
  category_ids?: number[]; // For edit form
  opening_hours?: any;
  description_en?: string;
  description_ar?: string;
  contact_phone?: string;
  
  // UI Helpers
  description?: string;
  address?: string; // Display address
}

// Aliases for the Dashboard code compatibility
export type Clinic = Facility; 
export type Pharmacy = Facility;

export interface Doctor {
  id: string;
  clinic_id: string;
  name_en: string;
  name_ar: string;
  specialty_ids: number[]; // Changed from single ID to array
  specialty_id?: number; // Deprecated, kept for safe fallback
  bio?: string;
  photo_url?: string;
}

export interface DoctorSchedule {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
}

export interface Booking {
  id: string;
  clinic_id: string;
  doctor_id?: string;
  patient_id: string;
  booking_date: string; // ISO string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  // Joins
  clinic?: { name_en: string; name_ar: string };
  doctor?: { name_en: string; name_ar: string };
  patient?: { full_name: string; phone: string };
}

export interface Review {
  id: string;
  entity_id: string;
  entity_type: EntityType;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  user?: { full_name: string; avatar_url?: string };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  
  // Computed on frontend
  other_user?: {
      id: string;
      full_name: string;
      avatar_url?: string;
  };
  last_message_preview?: string;
}

export interface Translation {
  [key: string]: {
    en: string;
    ar: string;
  };
}
