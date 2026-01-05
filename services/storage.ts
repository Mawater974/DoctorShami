
import { supabase } from './supabase';
import { STORAGE_BUCKET } from '../constants';

export const storageService = {
  async uploadImage(file: File, folder: string = 'uploads', userId?: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    // Construct path: {userId}/{folder}/{timestamp}_{random}.{ext}
    // Using userId is crucial for RLS policies that restrict access to user's own folder
    const pathPrefix = userId ? `${userId}/${folder}` : folder;
    const fileName = `${pathPrefix}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    
    try {
      const { data, error } = await supabase
        .storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase
        .storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (error: any) {
      console.error("Error uploading to Supabase:", error);
      throw new Error(error.message || "Failed to upload image");
    }
  }
};