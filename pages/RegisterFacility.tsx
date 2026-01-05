
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { TRANSLATIONS } from '../constants';
import { Button, Input, Card } from '../components/UiComponents';
import { dbService } from '../services/supabase';
import { storageService } from '../services/storage';
import { EntityType, City } from '../types';
import { Upload } from 'lucide-react';

export const RegisterFacility: React.FC = () => {
  const { lang, user, checkSession } = useStore();
  const t = (key: string) => TRANSLATIONS[key][lang];
  const navigate = useNavigate();

  const [type, setType] = useState<EntityType>(EntityType.CLINIC);
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [locationEn, setLocationEn] = useState('');
  const [locationAr, setLocationAr] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<number>(0);
  const [phone, setPhone] = useState('');
  const [image, setImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dbService.getCities().then(data => {
        setCities(data);
        if(data.length > 0) setSelectedCity(data[0].id);
    });
  }, []);

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
            name_en: nameEn,
            name_ar: nameAr,
            city_id: selectedCity,
            location_en: locationEn,
            location_ar: locationAr,
            phone,
            image
        }, user.id);
        
        await checkSession();
        navigate('/provider');
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
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card className="p-8">
        <div className="mb-8 border-b dark:border-gray-800 pb-4">
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('regTitle')}</h1>
           <p className="text-gray-500">{t('regDesc')}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
            
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

            {/* Names */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                    label={t('nameEn')} 
                    value={nameEn} 
                    onChange={(e) => setNameEn(e.target.value)} 
                    required 
                    dir="ltr"
                />
                <Input 
                    label={t('nameAr')} 
                    value={nameAr} 
                    onChange={(e) => setNameAr(e.target.value)} 
                    required 
                    dir="rtl"
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">{t('city')}</label>
                    <select 
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(Number(e.target.value))}
                    >
                        {cities.map(c => (
                            <option key={c.id} value={c.id}>
                                {lang === 'ar' ? c.name_ar : c.name_en}
                            </option>
                        ))}
                    </select>
                </div>
                 <Input 
                    label={t('phone')} 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="+963..."
                />
            </div>

             {/* Locations */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                    label={t('locationEn')} 
                    value={locationEn} 
                    onChange={(e) => setLocationEn(e.target.value)} 
                    required 
                    dir="ltr"
                />
                <Input 
                    label={t('locationAr')} 
                    value={locationAr} 
                    onChange={(e) => setLocationAr(e.target.value)} 
                    required 
                    dir="rtl"
                />
            </div>

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
                <Button type="button" variant="ghost" className="flex-1" onClick={() => navigate(-1)}>
                    {t('cancel')}
                </Button>
                <Button type="submit" className="flex-1" disabled={loading || uploading}>
                    {loading ? 'Creating...' : t('create')}
                </Button>
            </div>
        </form>
      </Card>
    </div>
  );
};