
import React, { useState } from 'react';
import { useStore } from '../store';
import { TRANSLATIONS } from '../constants';
import { Button, Input } from './UiComponents';
import { dbService } from '../services/supabase';
import { storageService } from '../services/storage';
import { EntityType } from '../types';
import { Upload, X } from 'lucide-react';

interface RegistrationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ onClose, onSuccess }) => {
  const { lang, user } = useStore();
  const t = (key: string) => TRANSLATIONS[key][lang];

  const [type, setType] = useState<EntityType>(EntityType.CLINIC);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [image, setImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    setUploading(true);
    try {
        const url = await storageService.uploadImage(e.target.files[0], 'registration', user.id);
        setImage(url);
    } catch (e) {
        alert(t('error'));
    } finally {
        setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
        await dbService.createFacility({
            type,
            name_en: name,
            name_ar: name,
            location_en: address,
            location_ar: address,
            phone,
            image,
            city_id: 1 // Default to 1 (Damascus) as we don't have city selection in this simplified modal
        } as any, user.id);
        
        onSuccess();
    } catch (e) {
        console.error(e);
        alert(t('error'));
    } finally {
        setLoading(false);
    }
  };

  const imageLabel = type === EntityType.CLINIC 
    ? (lang === 'en' ? 'Clinic Logo' : 'شعار العيادة')
    : (lang === 'en' ? 'Pharmacy Image' : 'صورة الصيدلية');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden relative">
        <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-950">
           <div>
               <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('regTitle')}</h2>
               <p className="text-sm text-gray-500">{t('regDesc')}</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
               <X className="w-5 h-5" />
           </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            
            {/* Type Selection */}
            <div>
                <label className="text-sm font-medium mb-2 block">{t('facilityType')}</label>
                <div className="flex gap-4">
                    <button 
                        type="button"
                        onClick={() => setType(EntityType.CLINIC)}
                        className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-medium ${type === EntityType.CLINIC ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'}`}
                    >
                        {t('clinics')}
                    </button>
                    <button 
                        type="button"
                        onClick={() => setType(EntityType.PHARMACY)}
                        className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-medium ${type === EntityType.PHARMACY ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'}`}
                    >
                        {t('pharmacies')}
                    </button>
                </div>
            </div>

            <Input 
                label={t('facilityName')} 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
            />
            
            <div className="grid grid-cols-2 gap-4">
                <Input 
                    label={t('city')} 
                    value={city} 
                    onChange={(e) => setCity(e.target.value)} 
                    required 
                />
                 <Input 
                    label={t('phone')} 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="+963..."
                />
            </div>

            <Input 
                label={t('address')} 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                required 
            />

            <div>
                <label className="text-sm font-medium mb-2 block">{imageLabel}</label>
                <div className="flex items-center gap-4">
                    {image && <img src={image} alt="Preview" className="w-16 h-16 rounded-lg object-cover border dark:border-gray-700" />}
                    <label className="flex-1 cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl h-16 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                        {uploading ? (
                            <span className="text-sm text-gray-500">{t('uploading')}</span>
                        ) : (
                            <div className="flex items-center gap-2 text-gray-500">
                                <Upload className="w-4 h-4" />
                                <span className="text-sm">{t('uploadImage')}</span>
                            </div>
                        )}
                    </label>
                </div>
            </div>

            <div className="pt-4 flex gap-3">
                <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
                    {t('cancel')}
                </Button>
                <Button type="submit" className="flex-1" disabled={loading || uploading}>
                    {loading ? 'Creating...' : t('create')}
                </Button>
            </div>
        </form>
      </div>
    </div>
  );
