
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
        neighborhood: data.neighborhood, // New Field
        latitude: data.latitude,         // New Field
        longitude: data.longitude        // New Field
    };

    if (data.type === EntityType.CLINIC) {
        payload.contact_phone = data.phone;
        payload.logo_url = data.image;
        payload.services = data.services || [];
        payload.description_en = data.description_en;
        payload.description_ar = data.description_ar;
        payload.opening_hours = data.opening_hours || {};
        payload.category_ids = data.category_ids || [];
    } else {
         // Pharmacy mapping based on strict SQL schema provided
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

      // Add conditional updates if they exist (to support older schema)
      if (updates.neighborhood !== undefined) payload.neighborhood = updates.neighborhood;
      if (updates.latitude !== undefined) payload.latitude = updates.latitude;
      if (updates.longitude !== undefined) payload.longitude = updates.longitude;

      if (type === EntityType.CLINIC) {
          payload.description_en = updates.description_en;
          payload.description_ar = updates.description_ar;
          payload.contact_phone = updates.phone;
          payload.logo_url = updates.image;
          payload.services = updates.services;
          payload.opening_hours = updates.opening_hours;
          payload.category_ids = updates.category_ids;
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
      filters: { cityId?: number; specialtyId?: number; verified?: boolean } = {}
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
        neighborhood: item.neighborhood,
        latitude: item.latitude,
        longitude: item.longitude,
        image: item.logo_url,
        phone: item.contact_phone,
        description: lang === 'ar' ? item.description_ar : item.description_en,
        description_en: item.description_en,
        description_ar: item.description_ar,
        is_verified: item.is_verified,
        services: item.services,
        category_ids: item.category_ids || [],
        opening_hours: item.opening_hours
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
        neighborhood: item.neighborhood,
        latitude: item.latitude,
        longitude: item.longitude,
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
        if (filters.verified) {
            q = q.eq('is_verified', true);
        }

        const { data } = await q;
        if (data) facilities = [...facilities, ...data.map(mapClinic)];
    }
    
    // Fetch Pharmacies
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
            neighborhood: clinic.neighborhood,
            latitude: clinic.latitude,
            longitude: clinic.longitude,
            city_id: clinic.city_id,
            opening_hours: clinic.opening_hours,
            category_ids: clinic.category_ids
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
            neighborhood: pharmacy.neighborhood,
            latitude: pharmacy.latitude,
            longitude: pharmacy.longitude,
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
        address: clinic.location_en, // Default fallbacks
        opening_hours: clinic.opening_hours,
        category_ids: clinic.category_ids
    } as Facility;
    
    const { data: pharmacy } = await supabase.from('pharmacies').select('*').eq('owner_id', ownerId).single();
    if (pharmacy) return { 
        ...pharmacy, 
        type: EntityType.PHARMACY,
        address: pharmacy.location_en 
    } as Facility;

    return null;
  },

  // --- Booking Related (Doctor Management) ---

  async getDoctorsByClinicId(clinicId: string): Promise<Doctor[]> {
    // Only use junction table now
    const { data: junctionDoctors } = await supabase
        .from('clinic_doctors')
        .select('doctor:doctors(*)')
        .eq('clinic_id', clinicId);
    
    const doctors = junctionDoctors?.map((d: any) => d.doctor) || [];

    // Remove duplicates based on ID
    const uniqueDoctors = Array.from(new Map(doctors.map(d => [d.id, d])).values());

    return uniqueDoctors.map((d: any) => ({
        ...d,
        specialty_ids: d.specialty_ids || (d.specialty_id ? [d.specialty_id] : [])
    }));
  },

  async getProviderDoctors(providerId: string): Promise<Doctor[]> {
      // 1. Get Provider's Clinics
      const { data: clinics } = await supabase.from('clinics').select('id, name_en, name_ar').eq('owner_id', providerId);
      if (!clinics || clinics.length === 0) return [];
      const clinicIds = clinics.map(c => c.id);

      // 2. Get Links
      const { data: links } = await supabase
          .from('clinic_doctors')
          .select('clinic_id, doctor_id')
          .in('clinic_id', clinicIds);
      
      const linkedDoctorIds = links?.map(l => l.doctor_id) || [];
      
      if (linkedDoctorIds.length === 0) return [];
      
      // 3. Get Doctors (pure lookup by ID)
      const { data: doctors } = await supabase.from('doctors').select('*').in('id', linkedDoctorIds);
      
      if (!doctors) return [];

      // 4. Map Clinics to Doctors
      return doctors.map((d: any) => {
          // Find all clinics this doctor belongs to (from the provider's list)
          const docLinks = links?.filter(l => l.doctor_id === d.id).map(l => l.clinic_id) || [];
          
          const doctorClinics = clinics.filter(c => docLinks.includes(c.id));
          
          return {
              ...d,
              clinics: doctorClinics,
              specialty_ids: d.specialty_ids || (d.specialty_id ? [d.specialty_id] : [])
          };
      });
  },

  async getAllDoctors(): Promise<Doctor[]> {
    const { data } = await supabase
        .from('doctors')
        .select('*')
        .limit(100); // Limit to avoid performance issues in dropdown
    
    return (data || []).map((d: any) => ({
        ...d,
        specialty_ids: d.specialty_ids || []
    }));
  },

  async searchDoctors(query: string): Promise<Doctor[]> {
    if (!query) return this.getAllDoctors(); // Reuse get all if query empty
    
    const { data } = await supabase
        .from('doctors')
        .select('*')
        .or(`name_en.ilike.%${query}%,name_ar.ilike.%${query}%`)
        .limit(20);
        
    return (data || []).map((d: any) => ({
        ...d,
        specialty_ids: d.specialty_ids || []
    }));
  },

  async linkDoctorToClinic(doctorId: string, clinicId: string) {
    const { error } = await supabase
        .from('clinic_doctors')
        .upsert(
            { clinic_id: clinicId, doctor_id: doctorId },
            { onConflict: 'clinic_id, doctor_id', ignoreDuplicates: true }
        );
        
    if (error) throw error;
  },

  // Helper to unlink for editing scenarios if needed (optional)
  async unlinkDoctorFromClinic(doctorId: string, clinicId: string) {
      const { error } = await supabase
          .from('clinic_doctors')
          .delete()
          .eq('clinic_id', clinicId)
          .eq('doctor_id', doctorId);
      if (error) throw error;
  },

  async getDoctorSchedules(doctorId: string): Promise<DoctorSchedule[]> {
    const { data } = await supabase.from('doctor_schedules').select('*').eq('doctor_id', doctorId);
    return data || [];
  },

  async getBookingsByDoctorDate(doctorId: string, date: string): Promise<Partial<Booking>[]> {
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
  async startConversation(userId: string, otherUserId: string) {
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant_1.eq.${userId},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${userId})`)
      .single();

    if (existing) return existing.id;

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        participant_1: userId,
        participant_2: otherUserId,
        last_message_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },

  async getConversations(userId: string): Promise<Conversation[]> {
    const { data: convs, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
        .order('last_message_at', { ascending: false });

    if (error) throw error;
    if (!convs) return [];

    const otherIds = [...new Set(convs.map((c: any) => c.participant_1 === userId ? c.participant_2 : c.participant_1))];
    
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', otherIds);
    // Use Map<string, any> to avoid 'unknown' type inference on map values
    const pMap = new Map<string, any>(profiles?.map((p: any) => [p.id, p]) || []);
    
    return convs.map((c: any) => {
        const otherId = c.participant_1 === userId ? c.participant_2 : c.participant_1;
        const p = pMap.get(otherId);
        return {
            id: c.id,
            participant_1: c.participant_1,
            participant_2: c.participant_2,
            last_message_at: c.last_message_at,
            other_user: p ? { id: p.id, full_name: p.full_name, avatar_url: p.avatar_url } : undefined
        };
    });
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async sendMessage(conversationId: string, senderId: string, content: string) {
      const { error } = await supabase
          .from('messages')
          .insert({ conversation_id: conversationId, sender_id: senderId, content });
      
      if (error) throw error;

      await supabase
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', conversationId);
  }
};
