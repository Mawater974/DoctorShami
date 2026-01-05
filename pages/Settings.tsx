
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { TRANSLATIONS } from '../constants';
import { Card, Input, Button } from '../components/UiComponents';
import { dbService } from '../services/supabase';

export const Settings: React.FC = () => {
  const { lang, user } = useStore();
  const t = (key: string) => TRANSLATIONS[key][lang];
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
      if (user?.phone) setPhone(user.phone);
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
        await dbService.updateUser(user.id, { phone });
        alert(t('success'));
    } catch(e) {
        alert(t('error'));
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('settings')}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 p-6">
            <h3 className="text-lg font-bold mb-6 border-b dark:border-gray-800 pb-4">
                {lang === 'en' ? 'Profile Settings' : 'إعدادات الملف الشخصي'}
            </h3>
            <form onSubmit={handleSave} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                    <Input 
                        label={lang === 'en' ? 'Full Name' : 'الاسم الكامل'} 
                        value={user?.name || ''} 
                        disabled 
                        className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                    />
                    <Input 
                        label={lang === 'en' ? 'Email Address' : 'البريد الإلكتروني'} 
                        value={user?.email || ''} 
                        disabled 
                        className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                    />
                </div>
                <Input 
                    label={t('phone')} 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    placeholder="+963..."
                />
                <div className="pt-2">
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : t('saveChanges')}
                    </Button>
                </div>
            </form>
          </Card>
      </div>
    </div>
  );
};