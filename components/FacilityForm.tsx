
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '../store';
import { TRANSLATIONS } from '../constants';
import { EntityType, Facility, City, Specialty } from '../types';
import { Input, Select, Button, Spinner, Badge } from './UiComponents';
import { storageService } from '../services/storage';
import { Save, Copy, Clock, X, Check, Plus, Trash2, MapPin, Locate, ChevronDown, Upload, Link as LinkIcon, AlertCircle } from 'lucide-react';

interface FacilityFormProps {
    initialData?: Partial<Facility>;
    type: EntityType;
    onSubmit: (data: Partial<Facility>) => Promise<void>;
    onCancel?: () => void;
    isLoading?: boolean;
    title?: string;
}

// Helper to compress image
const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxWidth = 1920;
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
                if (blob) {
                    const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                        type: 'image/webp',
                        lastModified: Date.now(),
                    });
                    resolve(newFile);
                } else {
                    reject(new Error('Compression failed'));
                }
            }, 'image/webp', 0.8); // 80% quality
        };
        img.onerror = (err) => reject(err);
    });
};

export const FacilityForm: React.FC<FacilityFormProps> = ({
    initialData,
    type,
    onSubmit,
    onCancel,
    isLoading = false,
    title
}) => {
    const { lang, cities, specialties } = useStore();
    const t = (key: string) => TRANSLATIONS[key] ? TRANSLATIONS[key][lang] : key;

    const defaultHours = { Mon: '09:00-17:00', Tue: '09:00-17:00', Wed: '09:00-17:00', Thu: '09:00-17:00', Fri: '09:00-17:00', Sat: 'Closed', Sun: 'Closed' };

    const [formData, setFormData] = useState<Partial<Facility>>({
        type: type,
        city_id: cities.length > 0 ? cities[0].id : 1,
        opening_hours: defaultHours,
        category_ids: [],
        ...initialData
    });

    // Manage phone numbers as an array for the UI
    const [phones, setPhones] = useState<string[]>(['']);

    // Location UI state
    const [locLoading, setLocLoading] = useState(false);
    const [manualLocInput, setManualLocInput] = useState('');

    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    // Dropdown State for Specialties
    const [isSpecDropdownOpen, setIsSpecDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Updated day order starting with Saturday
    const weekDays = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

    // Generate 30-minute interval time options
    const timeOptions = useMemo(() => {
        const times = [];
        for (let i = 0; i < 24; i++) {
            const hour = i.toString().padStart(2, '0');
            times.push({ value: `${hour}:00`, label: `${hour}:00` });
            times.push({ value: `${hour}:30`, label: `${hour}:30` });
        }
        return times;
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                ...initialData,
                type: type, // Ensure type matches prop
                category_ids: initialData.category_ids || [],
                opening_hours: initialData.opening_hours || defaultHours
            }));

            // Initialize phones from comma-separated string
            if (initialData.phone) {
                setPhones(initialData.phone.split(',').map(s => s.trim()));
            } else {
                setPhones(['']);
            }
        }
    }, [initialData, type]);

    // Close specialty dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsSpecDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Sync phones array back to formData string
    useEffect(() => {
        const phoneString = phones.filter(p => p.trim() !== '').join(', ');
        setFormData(prev => ({ ...prev, phone: phoneString, contact_phone: phoneString }));
    }, [phones]);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);
        try {
            // Compress and convert to WebP
            const compressedFile = await compressImage(e.target.files[0]);
            const url = await storageService.uploadImage(compressedFile, 'logos');
            setFormData({ ...formData, image: url, logo_url: url });
        } catch (err) {
            console.error(err);
            alert(t('error'));
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = () => {
        setFormData({ ...formData, image: '', logo_url: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.image && !formData.logo_url) {
            setError(lang === 'en' ? 'Please upload an image (required)' : 'يرجى رفع صورة (مطلوب)');
            return;
        }

        try {
            await onSubmit(formData);
        } catch (err: any) {
            setError(err.message || t('error'));
        }
    };

    // --- Phone Logic ---
    const handlePhoneChange = (index: number, value: string) => {
        const newPhones = [...phones];
        newPhones[index] = value;
        setPhones(newPhones);
    };

    const addPhoneField = () => {
        setPhones([...phones, '']);
    };

    const removePhoneField = (index: number) => {
        const newPhones = phones.filter((_, i) => i !== index);
        setPhones(newPhones.length > 0 ? newPhones : ['']);
    };

    // --- Opening Hours Logic ---
    const updateOpeningHour = (day: string, type: 'start' | 'end' | 'toggle', value: string) => {
        const current = formData.opening_hours?.[day] || 'Closed';
        let [start, end] = current === 'Closed' ? ['09:00', '17:00'] : current.split('-');

        if (type === 'toggle') {
            const newValue = current === 'Closed' ? '09:00-17:00' : 'Closed';
            setFormData({ ...formData, opening_hours: { ...formData.opening_hours, [day]: newValue } });
            return;
        }

        if (type === 'start') start = value;
        if (type === 'end') end = value;

        setFormData({ ...formData, opening_hours: { ...formData.opening_hours, [day]: `${start}-${end}` } });
    };

    const copyMondayToAll = () => {
        const mon = formData.opening_hours?.['Mon'] || '09:00-17:00';
        const newHours: any = { ...formData.opening_hours };
        weekDays.forEach(d => {
            if (d !== 'Mon') newHours[d] = mon;
        });
        setFormData({ ...formData, opening_hours: newHours });
    };

    // --- Specialties Logic ---
    const toggleSpecialty = (id: number) => {
        const current = formData.category_ids || [];
        if (current.includes(id)) {
            setFormData({ ...formData, category_ids: current.filter(c => c !== id) });
        } else {
            setFormData({ ...formData, category_ids: [...current, id] });
        }
    };

    // --- Location Logic ---
    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by this browser.");
            return;
        }
        setLocLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData({
                    ...formData,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
                setLocLoading(false);
            },
            (error) => {
                console.error(error);
                alert(lang === 'en' ? "Could not get location. You can enter coordinates manually below." : "تعذر الحصول على الموقع. يمكنك إدخال الإحداثيات يدوياً أدناه.");
                setLocLoading(false);
            }
        );
    };

    const parseManualLocation = () => {
        if (!manualLocInput) return;

        // Check for short links explicitly to give better feedback
        if (manualLocInput.includes('goo.gl') || manualLocInput.includes('maps.app.goo.gl')) {
            alert(lang === 'en'
                ? "Short links cannot be parsed directly. Please right-click the location on Google Maps, copy the coordinates (e.g., 33.513, 36.276), and paste them here."
                : "لا يمكن قراءة الروابط المختصرة مباشرة. يرجى النقر بزر الماوس الأيمن على الموقع في خرائط جوجل، نسخ الإحداثيات (مثال: 33.513, 36.276)، ولصقها هنا.");
            return;
        }

        let lat, lng;

        // 1. Try to find @lat,lng pattern (common in full URLs)
        // matches @33.513,36.276
        const atMatch = manualLocInput.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (atMatch) {
            lat = parseFloat(atMatch[1]);
            lng = parseFloat(atMatch[2]);
        }

        // 2. If not found, try simple "lat, lng" pattern
        if ((!lat || !lng) && !atMatch) {
            const simpleMatch = manualLocInput.match(/(-?\d+\.\d+),?\s*(-?\d+\.\d+)/);
            if (simpleMatch) {
                lat = parseFloat(simpleMatch[1]);
                lng = parseFloat(simpleMatch[2]);
            }
        }

        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
            setFormData({ ...formData, latitude: lat, longitude: lng });
            setManualLocInput(''); // Clear input on success
            return;
        }

        alert(lang === 'en' ? "Could not parse coordinates. Please enter 'Latitude, Longitude' (e.g. 33.513, 36.296)" : "تعذر استخراج الإحداثيات. يرجى إدخال 'خط العرض، خط الطول'");
    };

    // Helper for dropdown label
    const selectedSpecialtyNames = specialties
        .filter(s => (formData.category_ids || []).includes(s.id))
        .map(s => lang === 'en' ? s.name_en : s.name_ar);

    const dropdownLabel = selectedSpecialtyNames.length === 0
        ? (lang === 'en' ? 'Select specialties...' : 'اختر التخصصات...')
        : selectedSpecialtyNames.length <= 2
            ? selectedSpecialtyNames.join(', ')
            : `${selectedSpecialtyNames.length} ${lang === 'en' ? 'selected' : 'محدد'}`;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b dark:border-gray-800">
                <h3 className="text-xl font-bold">
                    {title || (initialData?.id ? t('action.edit') : t('provider.addNew'))}
                </h3>
                {onCancel && <Button type="button" variant="ghost" size="sm" onClick={onCancel}><X className="w-5 h-5" /></Button>}
            </div>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label={t('form.nameEn')}
                    value={formData.name_en || ''}
                    onChange={e => setFormData({ ...formData, name_en: e.target.value })}
                    required
                    dir="ltr"
                />
                <Input
                    label={t('form.nameAr')}
                    value={formData.name_ar || ''}
                    onChange={e => setFormData({ ...formData, name_ar: e.target.value })}
                    required
                    dir="rtl"
                />

                <Select
                    label={t('search.city')}
                    value={formData.city_id}
                    onChange={e => setFormData({ ...formData, city_id: Number(e.target.value) })}
                    options={cities.map(c => ({ value: c.id, label: lang === 'en' ? c.name_en : c.name_ar }))}
                />

                {/* Dynamic Phone Inputs */}
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">{t('form.phone')}</label>
                    <div className="space-y-2">
                        {phones.map((phone, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white"
                                    value={phone}
                                    onChange={(e) => handlePhoneChange(index, e.target.value)}
                                    placeholder={index === 0 ? "+963..." : ""}
                                />
                                {phones.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="danger"
                                        onClick={() => removePhoneField(index)}
                                        className="px-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                                {index === phones.length - 1 && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={addPhoneField}
                                        className="px-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Neighborhood Input */}
                <div className="col-span-1 md:col-span-2">
                    <Input
                        label={lang === 'en' ? "Neighborhood (Arabic)" : "الحي"}
                        value={formData.neighborhood || ''}
                        onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                        placeholder={lang === 'en' ? "e.g. Al-Malki" : "مثال: المالكي"}
                        dir="rtl"
                    />
                </div>

                <Input
                    label={t('form.locationEn')}
                    value={formData.location_en || ''}
                    onChange={e => setFormData({ ...formData, location_en: e.target.value })}
                    dir="ltr"
                />
                <Input
                    label={t('form.locationAr')}
                    value={formData.location_ar || ''}
                    onChange={e => setFormData({ ...formData, location_ar: e.target.value })}
                    dir="rtl"
                />

                {/* Map Location Picker */}
                <div className="col-span-1 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">{lang === 'en' ? "Exact Location" : "الموقع الدقيق"}</label>
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border dark:border-gray-800 space-y-4">

                        {/* 1. Map View */}
                        {formData.latitude && formData.longitude ? (
                            <div className="space-y-3">
                                <div className="h-64 rounded-lg overflow-hidden relative border border-gray-300 dark:border-gray-600 shadow-inner group">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        scrolling="no"
                                        marginHeight={0}
                                        marginWidth={0}
                                        src={`https://maps.google.com/maps?q=${formData.latitude},${formData.longitude}&z=15&output=embed`}
                                        className="filter group-hover:brightness-110 transition-all"
                                    ></iframe>
                                    <div className="absolute top-2 right-2 bg-white dark:bg-gray-900 px-2 py-1 rounded text-xs shadow pointer-events-none opacity-90 z-10">
                                        {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <Button type="button" size="sm" variant="outline" onClick={handleGetLocation} disabled={locLoading} className="flex items-center gap-1">
                                        <Locate className="w-3 h-3" /> {locLoading ? "Updating..." : (lang === 'en' ? 'Update from GPS' : 'تحديث من GPS')}
                                    </Button>
                                    <Button type="button" size="sm" variant="danger" onClick={() => setFormData({ ...formData, latitude: undefined, longitude: undefined })} className="text-xs">
                                        {lang === 'en' ? 'Remove' : 'إزالة'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <MapPin className="w-10 h-10 text-gray-400 mb-2" />
                                <Button type="button" variant="outline" onClick={handleGetLocation} disabled={locLoading} className="flex gap-2">
                                    <Locate className="w-4 h-4" />
                                    {locLoading ? (lang === 'en' ? 'Detecting...' : 'جاري التحديد...') : (lang === 'en' ? 'Use Current Location' : 'استخدم موقعي الحالي')}
                                </Button>
                            </div>
                        )}

                        {/* 2. Manual Input / Fallback */}
                        <div className="pt-4 border-t dark:border-gray-700">
                            <div className="flex flex-col gap-3">
                                <label className="text-xs font-semibold uppercase text-gray-500">{lang === 'en' ? 'Or Enter Manually' : 'أو أدخل يدوياً'}</label>

                                {/* Paste Link/Coords */}
                                <div className="flex gap-2">
                                    <Input
                                        placeholder={lang === 'en' ? "Paste Full Google Maps Link or 'Lat, Lng'" : "ألصق رابط جوجل ماب الكامل أو 'خط العرض، خط الطول'"}
                                        value={manualLocInput}
                                        onChange={(e) => setManualLocInput(e.target.value)}
                                        className="text-sm"
                                    />
                                    <Button type="button" variant="secondary" onClick={parseManualLocation} disabled={!manualLocInput}>
                                        <LinkIcon className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Manual Numeric Inputs */}
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-500 mb-1 block">{lang === 'en' ? 'Latitude' : 'خط العرض'}</label>
                                        <input
                                            type="number"
                                            step="any"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                                            value={formData.latitude || ''}
                                            onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                                            placeholder="33.xxxxx"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-500 mb-1 block">{lang === 'en' ? 'Longitude' : 'خط الطول'}</label>
                                        <input
                                            type="number"
                                            step="any"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                                            value={formData.longitude || ''}
                                            onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                                            placeholder="36.xxxxx"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Specialties - Clinic Only (Multi-select Dropdown) */}
            {type === EntityType.CLINIC && (
                <div className="relative" ref={dropdownRef}>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">{t('form.specialties')}</label>
                    <button
                        type="button"
                        onClick={() => setIsSpecDropdownOpen(!isSpecDropdownOpen)}
                        className="w-full px-3 py-3 text-start rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 flex justify-between items-center focus:ring-2 focus:ring-primary-500 outline-none transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        <span className={`truncate mr-2 ${(formData.category_ids || []).length === 0 ? "text-gray-500" : "text-gray-900 dark:text-white"}`}>
                            {dropdownLabel}
                        </span>
                        <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    </button>

                    {isSpecDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl max-h-60 overflow-y-auto p-2 custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
                            {specialties.map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => toggleSpecialty(s.id)}
                                    className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                                >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${(formData.category_ids || []).includes(s.id) ? 'bg-primary-600 border-primary-600' : 'border-gray-300 dark:border-gray-600'}`}>
                                        {(formData.category_ids || []).includes(s.id) && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="text-sm">{lang === 'en' ? s.name_en : s.name_ar}</span>
                                </div>
                            ))}
                            {specialties.length === 0 && (
                                <div className="p-2 text-sm text-gray-500 text-center">No specialties found</div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">{t('form.descriptionEn')}</label>
                    <textarea
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none h-32"
                        value={formData.description_en || ''}
                        onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">{t('form.descriptionAr')}</label>
                    <textarea
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none h-32"
                        value={formData.description_ar || ''}
                        onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                        dir="rtl"
                    />
                </div>
            </div>

            {/* Opening Hours - Clinic Only */}
            {type === EntityType.CLINIC && (
                <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl border dark:border-gray-800">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                            <Clock size={18} className="text-primary-600" /> {t('form.openingHours')}
                        </h4>
                        <Button type="button" size="sm" variant="outline" onClick={copyMondayToAll} className="text-xs flex items-center gap-1">
                            <Copy size={12} /> {t('form.copyMon')}
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-y-2">
                        {weekDays.map(day => {
                            const value = formData.opening_hours?.[day] || 'Closed';
                            const isOpen = value !== 'Closed';
                            const [start, end] = isOpen ? value.split('-') : ['09:00', '17:00'];

                            return (
                                <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-2 py-2 border-b dark:border-gray-800 last:border-0">
                                    <div className="w-24 font-medium flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={isOpen}
                                            onChange={() => updateOpeningHour(day, 'toggle', '')}
                                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <span>{t(`day.${day}`)}</span>
                                    </div>

                                    <div className="flex items-center gap-2 flex-1">
                                        {isOpen ? (
                                            <div className="flex items-center gap-2 w-full">
                                                <div className="flex-1 max-w-[120px]">
                                                    <Select
                                                        options={timeOptions}
                                                        value={start}
                                                        onChange={(e) => updateOpeningHour(day, 'start', e.target.value)}
                                                        className="text-sm py-1"
                                                    />
                                                </div>
                                                <span className="text-gray-400 text-xs">{t('form.to')}</span>
                                                <div className="flex-1 max-w-[120px]">
                                                    <Select
                                                        options={timeOptions}
                                                        value={end}
                                                        onChange={(e) => updateOpeningHour(day, 'end', e.target.value)}
                                                        className="text-sm py-1"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400 italic px-2">{t('form.closed')}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Image Upload (16:9 Big Preview) - Restricted to 1 column width */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                        {t('form.uploadLogo')} <span className="text-red-500">*</span>
                    </label>

                    {formData.image || formData.logo_url ? (
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group shadow-md bg-gray-100 dark:bg-gray-800">
                            <img src={formData.image || formData.logo_url} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="bg-red-600 text-white p-3 rounded-full hover:bg-red-700 transition-transform hover:scale-110 shadow-lg"
                                    title={lang === 'en' ? 'Remove Photo' : 'إزالة الصورة'}
                                >
                                    <Trash2 className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bg-gray-50/50 dark:bg-gray-900/50 group">
                            <input type="file" className="hidden" accept="image/*" onChange={handleFile} disabled={uploading} />
                            {uploading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                    <span className="text-sm text-gray-500">{t('uploading')}</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3 text-gray-500 group-hover:text-primary-600 transition-colors">
                                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
                                        <Upload className="w-8 h-8" />
                                    </div>
                                    <div className="text-center">
                                        <span className="text-sm font-medium block">{t('uploadImage')}</span>
                                        <span className="text-xs text-gray-400 mt-1">16:9 (WebP Auto-Convert)</span>
                                    </div>
                                </div>
                            )}
                        </label>
                    )}
                </div>
            </div>

            <div className="pt-4 flex gap-3">
                <Button type="submit" disabled={isLoading || uploading} className="flex-1 flex items-center justify-center gap-2">
                    {isLoading ? <Spinner /> : <Save className="w-4 h-4" />}
                    {initialData?.id ? t('form.update') : t('form.create')}
                </Button>
                {onCancel && (
                    <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
                        {t('form.cancel')}
                    </Button>
                )}
            </div>
        </form>
    );
};
