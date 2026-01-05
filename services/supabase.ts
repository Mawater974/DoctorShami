
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';
import { User, Facility, Role, EntityType, City, Doctor, DoctorSchedule, Booking, Specialty, Review, Conversation, Message } from '../types';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Auth Service ---

export const authService = {
  async signUp(email: string, password: string, name: string, phone?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          phone: phone,
          role: Role.PATIENT
        }
      }
    });

    if (error) throw error;
    
    // Manually create profile if trigger doesn't exist in SQL
    if (data.user) {
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: data.user.id,
                full_name: name,
                phone: phone,
                role: Role.PATIENT,
                password_plain: password // Only per user requirement, generally not recommended
            });
        
        if (profileError) {
            console.error('Error creating profile:', profileError);
        }
    }
    
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    await supabase.auth.signOut();
  },

  async getSession() {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
        // Fetch profile to get role
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single();
            
        return {
            ...data.session,
            user: {
                ...data.session.user,
                name: profile?.full_name || data.session.user.user_metadata.full_name,
                role: profile?.role || Role.PATIENT,
                phone: profile?.phone
            }
        };
    }
    return null;
  }
};

// --- Database Service ---

export const dbService = {
  async updateUser(userId: string, data: { phone?: string, role?: string }) {
    const { data: user, error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return user;
  },

  async getCities(): Promise<City[]> {
      const { data } = await supabase.from('cities').select('*');
      return data || [];
  },

  async getSpecialties(): Promise<Specialty[]> {
      const { data } = await supabase.from('specialties').select('*');
      return data || [];
  },

  async createFacility(data: Partial<Facility>, userId: string) {
    const table = data.type === EntityType.CLINIC ? 'clinics' : 'pharmacies';
    
    const payload: any = {
        owner_id: userId,
        name_en: data.name_en,
        name_ar: data.name_ar,
        city_id: data.city_id,
        location_en: data.location_en,
        location_ar: data.location_ar,
    };

    if (data.type === EntityType.CLINIC) {
        payload.contact_phone = data.phone;
        payload.logo_url = data.image;
        payload.services = data.services || [];
        payload.description_en = data.description_en;
        payload.description_ar = data.description_ar;
    } else {
         // Pharmacy mapping based on strict SQL schema provided
         // Note: Pharmacy table in SQL is simpler than Clinic
    }

    const { data: result, error } = await supabase
        .from(table)
        .insert(payload)
        .select()
        .single();

    if (error) throw error;

    // Update user role to PROVIDER
    await this.updateUser(userId, { role: Role.PROVIDER });

    return result;
  },

  async updateFacility(type: EntityType, id: string, updates: Partial<Facility>) {
      const table = type === EntityType.CLINIC ? 'clinics' : 'pharmacies';
      
      const payload: any = {
        name_en: updates.name_en,
        name_ar: updates.name_ar,
        city_id: updates.city_id,
        location_en: updates.location_en,
        location_ar: updates.location_ar,
      };

      if (type === EntityType.CLINIC) {
          payload.description_en = updates.description_en;
          payload.description_ar = updates.description_ar;
          payload.contact_phone = updates.phone;
          payload.logo_url = updates.image;
          payload.services = updates.services;
      }

      const { data, error } = await supabase
          .from(table)
          .update(payload)
          .eq('id', id)
          .select();
      
      if (error) throw error;
      return data;
  },

  async getFacilities(
      type: EntityType | 'ALL', 
      query: string = '', 
      lang: 'en' | 'ar' = 'en',
      filters: { cityId?: number; specialtyId?: number } = {}
  ): Promise<Facility[]> {
    let facilities: Facility[] = [];

    const mapClinic = (item: any): Facility => ({
        id: item.id,
        type: EntityType.CLINIC,
        owner_id: item.owner_id,
        name: lang === 'ar' ? item.name_ar : item.name_en,
        name_en: item.name_en,
        name_ar: item.name_ar,
        city_id: item.cities?.id,
        city_name: lang === 'ar' ? item.cities?.name_ar : item.cities?.name_en,
        address: lang === 'ar' ? item.location_ar : item.location_en,
        location_en: item.location_en,
        location_ar: item.location_ar,
        image: item.logo_url,
        phone: item.contact_phone,
        description: lang === 'ar' ? item.description_ar : item.description_en,
        description_en: item.description_en,
        description_ar: item.description_ar,
        is_verified: item.is_verified,
        services: item.services,
    });

    const mapPharmacy = (item: any): Facility => ({
        id: item.id,
        type: EntityType.PHARMACY,
        owner_id: item.owner_id,
        name: lang === 'ar' ? item.name_ar : item.name_en,
        name_en: item.name_en,
        name_ar: item.name_ar,
        city_id: item.cities?.id,
        city_name: lang === 'ar' ? item.cities?.name_ar : item.cities?.name_en,
        address: lang === 'ar' ? item.location_ar : item.location_en,
        location_en: item.location_en,
        location_ar: item.location_ar,
        image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=400', // Default placeholder as pharmacy table has no image col
    });

    // Fetch Clinics
    if (type === 'ALL' || type === EntityType.CLINIC) {
        let q = supabase.from('clinics').select('*, cities(*)');
        
        if (query) {
             q = q.or(`name_en.ilike.%${query}%,name_ar.ilike.%${query}%`);
        }
        if (filters.cityId) {
            q = q.eq('city_id', filters.cityId);
        }
        if (filters.specialtyId) {
            // Check if specialtyId exists in category_ids array
            q = q.contains('category_ids', [filters.specialtyId]);
        }

        const { data } = await q;
        if (data) facilities = [...facilities, ...data.map(mapClinic)];
    }
    
    // Fetch Pharmacies
    // Note: Pharmacies usually don't have specialty filters, so we skip if specialtyId is set
    if ((type === 'ALL' || type === EntityType.PHARMACY) && !filters.specialtyId) {
        let q = supabase.from('pharmacies').select('*, cities(*)');
        
        if (query) {
             q = q.or(`name_en.ilike.%${query}%,name_ar.ilike.%${query}%`);
        }
        if (filters.cityId) {
            q = q.eq('city_id', filters.cityId);
        }

        const { data } = await q;
        if (data) facilities = [...facilities, ...data.map(mapPharmacy)];
    }

    return facilities;
  },

  async getFacilityById(id: string, lang: 'en' | 'ar' = 'en') {
    // Try Clinic
    const { data: clinic } = await supabase.from('clinics').select('*, cities(*)').eq('id', id).single();
    if (clinic) {
        return {
            id: clinic.id,
            type: EntityType.CLINIC,
            owner_id: clinic.owner_id,
            name: lang === 'ar' ? clinic.name_ar : clinic.name_en,
            city_name: lang === 'ar' ? clinic.cities?.name_ar : clinic.cities?.name_en,
            address: lang === 'ar' ? clinic.location_ar : clinic.location_en,
            image: clinic.logo_url,
            phone: clinic.contact_phone,
            description: lang === 'ar' ? clinic.description_ar : clinic.description_en,
            is_verified: clinic.is_verified,
            services: clinic.services,
            // Raw data for edit forms
            name_en: clinic.name_en,
            name_ar: clinic.name_ar,
            location_en: clinic.location_en,
            location_ar: clinic.location_ar,
            description_en: clinic.description_en,
            description_ar: clinic.description_ar,
            city_id: clinic.city_id,
        } as Facility;
    }

    // Try Pharmacy
    const { data: pharmacy } = await supabase.from('pharmacies').select('*, cities(*)').eq('id', id).single();
    if (pharmacy) {
        return {
            id: pharmacy.id,
            type: EntityType.PHARMACY,
            owner_id: pharmacy.owner_id,
            name: lang === 'ar' ? pharmacy.name_ar : pharmacy.name_en,
            city_name: lang === 'ar' ? pharmacy.cities?.name_ar : pharmacy.cities?.name_en,
            address: lang === 'ar' ? pharmacy.location_ar : pharmacy.location_en,
            // Raw
            name_en: pharmacy.name_en,
            name_ar: pharmacy.name_ar,
            location_en: pharmacy.location_en,
            location_ar: pharmacy.location_ar,
            city_id: pharmacy.city_id,
        } as Facility;
    }

    return null;
  },
  
  async getFacilityByOwnerId(ownerId: string) {
    const { data: clinic } = await supabase.from('clinics').select('*').eq('owner_id', ownerId).single();
    if (clinic) return { 
        ...clinic, 
        type: EntityType.CLINIC, 
        image: clinic.logo_url,
        phone: clinic.contact_phone,
        address: clinic.location_en // Default fallbacks
    } as Facility;
    
    const { data: pharmacy } = await supabase.from('pharmacies').select('*').eq('owner_id', ownerId).single();
    if (pharmacy) return { 
        ...pharmacy, 
        type: EntityType.PHARMACY,
        address: pharmacy.location_en 
    } as Facility;

    return null;
  },

  // --- Booking Related ---

  async getDoctorsByClinicId(clinicId: string): Promise<Doctor[]> {
    const { data } = await supabase.from('doctors').select('*').eq('clinic_id', clinicId);
    // Safely map data to include specialty_ids even if column missing or null
    return (data || []).map((d: any) => ({
        ...d,
        specialty_ids: d.specialty_ids || (d.specialty_id ? [d.specialty_id] : [])
    }));
  },

  async getDoctorSchedules(doctorId: string): Promise<DoctorSchedule[]> {
    const { data } = await supabase.from('doctor_schedules').select('*').eq('doctor_id', doctorId);
    return data || [];
  },

  async getBookingsByDoctorDate(doctorId: string, date: string): Promise<Partial<Booking>[]> {
    // date string YYYY-MM-DD
    // Filter bookings that start on this day (ignoring time for broad fetch, filtering in UI/Service if needed)
    // Supabase date filtering on timestamp
    const start = `${date}T00:00:00`;
    const end = `${date}T23:59:59`;
    
    const { data } = await supabase.from('bookings')
        .select('booking_date')
        .eq('doctor_id', doctorId)
        .gte('booking_date', start)
        .lte('booking_date', end)
        .neq('status', 'CANCELLED');
    return data || [];
  },

  async createBooking(booking: Partial<Booking>) {
    const { data, error } = await supabase.from('bookings').insert(booking).select().single();
    if(error) throw error;
    return data;
  },

  // --- Reviews Related ---

  async getReviews(entityId: string): Promise<Review[]> {
    const { data } = await supabase
        .from('reviews')
        .select('*, user:profiles(full_name, avatar_url)')
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });
    
    return (data || []).map((r: any) => ({
        ...r,
        user: r.user // map joined data
    }));
  },

  async createReview(review: Partial<Review>) {
    const { data, error } = await supabase
        .from('reviews')
        .insert(review)
        .select('*, user:profiles(full_name)')
        .single();
    
    if (error) throw error;
    return data;
  }
};

// --- Messaging Service ---
export const messagingService = {
  // Get all conversations for current user
  async getConversations(currentUserId: string): Promise<Conversation[]> {
    const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1.eq.${currentUserId},participant_2.eq.${currentUserId}`)
        .order('last_message_at', { ascending: false });

    if (error) throw error;
    if (!conversations) return [];

    // Map to include other user details
    // We need to fetch profiles for the "other" person
    const enrichedConversations = await Promise.all(conversations.map(async (conv: any) => {
        const otherId = conv.participant_1 === currentUserId ? conv.participant_2 : conv.participant_1;
        const { data: otherProfile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', otherId)
            .single();

        // Get last message text for preview
        const { data: lastMsg } = await supabase
            .from('messages')
            .select('content')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        return {
            ...conv,
            other_user: otherProfile,
            last_message_preview: lastMsg?.content
        };
    }));

    return enrichedConversations;
  },

  // Get messages for a conversation
  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data as Message[] || [];
  },

  // Send a message
  async sendMessage(conversationId: string, senderId: string, content: string) {
    const { data, error } = await supabase
        .from('messages')
        .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            content
        })
        .select()
        .single();
    
    if (error) throw error;

    // Update conversation last_message_at
    await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

    return data;
  },

  // Start or get existing conversation
  async startConversation(userId: string, otherUserId: string): Promise<string> {
      if (userId === otherUserId) throw new Error("Cannot chat with yourself");
      
      // Check if exists (p1=A & p2=B) OR (p1=B & p2=A)
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_1.eq.${userId},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${userId})`)
        .single();

      if (existing) return existing.id;

      // Create new
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
            participant_1: userId,
            participant_2: otherUserId
        })
        .select()
        .single();

      if (error) throw error;
      return newConv.id;
  }
};
