
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { TRANSLATIONS } from '../constants';
import { FacilityForm } from '../components/FacilityForm';
import { EntityType, Facility, Role } from '../types';
import { Card } from '../components/UiComponents';
import { Stethoscope, Pill, ArrowLeft } from 'lucide-react';
import { dbService } from '../services/supabase';

export const RegisterFacility: React.FC = () => {
    const { lang, user, login } = useStore();
    const t = (key: string) => TRANSLATIONS[key] ? TRANSLATIONS[key][lang] : key;
    const navigate = useNavigate();

    const [selectedType, setSelectedType] = useState<EntityType | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (data: Partial<Facility>) => {
        if (!user || !selectedType) return;
        setIsLoading(true);
        try {
            await dbService.createFacility({ ...data, type: selectedType }, user.id);

            // Update user role in store immediately so they can access provider dashboard
            // The dbService.createFacility already updates the role in DB
            const updatedUser = { ...user, role: Role.PROVIDER };
            login(updatedUser);

            navigate('/provider');
        } catch (error: any) {
            console.error(error);
            alert(error.message || t('error'));
        } finally {
            setIsLoading(false);
        }
    };

    if (!selectedType) {
        return (
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="text-center mb-12 animate-in slide-in-from-bottom-4 duration-500">
                    <h1 className="text-3xl font-bold mb-4">{t('registerFacility')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">{t('regDesc')}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <Card
                        className="p-8 cursor-pointer hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-xl transition-all group text-center border-2 border-transparent"
                        onClick={() => setSelectedType(EntityType.CLINIC)}
                    >
                        <div className="w-24 h-24 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                            <Stethoscope className="w-12 h-12" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">{t('clinics')}</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            {lang === 'en' ? 'Register a medical clinic or private practice to reach patients.' : 'سجل عيادة طبية أو عيادة خاصة للوصول إلى المرضى.'}
                        </p>
                    </Card>

                    <Card
                        className="p-8 cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-xl transition-all group text-center border-2 border-transparent"
                        onClick={() => setSelectedType(EntityType.PHARMACY)}
                    >
                        <div className="w-24 h-24 mx-auto bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                            <Pill className="w-12 h-12" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">{t('pharmacies')}</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            {lang === 'en' ? 'Register your pharmacy to list medicines and services.' : 'سجل صيدليتك لعرض الأدوية والخدمات.'}
                        </p>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <button
                onClick={() => setSelectedType(null)}
                className="flex items-center gap-2 text-gray-500 hover:text-primary-600 mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                {t('action.back')}
            </button>
            <Card className="p-6 md:p-8 shadow-xl">
                <FacilityForm
                    type={selectedType}
                    onSubmit={handleSubmit}
                    onCancel={() => setSelectedType(null)}
                    isLoading={isLoading}
                    title={selectedType === EntityType.CLINIC ? t('form.newClinic') : t('form.newPharmacy')}
                />
            </Card>
        </div>
    );
};
