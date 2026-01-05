
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { TRANSLATIONS } from '../constants';
import { Card, Button, Spinner, Badge } from '../components/UiComponents';
import { supabase } from '../services/supabase';
import { Check, ExternalLink } from 'lucide-react';
import { Clinic } from '../types';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const { lang } = useStore();
  const t = (key: string) => TRANSLATIONS[key] ? TRANSLATIONS[key][lang] : key;

  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUnverified = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('clinics')
        .select('*, cities(name_en, name_ar)')
        .eq('is_verified', false);
      
      if(data) {
          // Map to match type if needed, or use as is if types align
          const mapped = data.map((c: any) => ({
              ...c,
              city_name: lang === 'en' ? c.cities?.name_en : c.cities?.name_ar
          }));
          setClinics(mapped);
      }
      setLoading(false);
  }

  useEffect(() => {
      fetchUnverified();
  }, [lang]);

  const handleVerify = async (id: string) => {
      await supabase.from('clinics').update({ is_verified: true }).eq('id', id);
      fetchUnverified();
  }

  if (loading) return <div className="p-20"><Spinner /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('adminPanel')}</h1>
      
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
             Pending Verifications <Badge variant="warning">{clinics.length}</Badge>
        </h2>
        <div className="space-y-4">
            {clinics.map(c => (
                <div key={c.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center border p-4 rounded-lg dark:border-gray-800 gap-4 bg-gray-50 dark:bg-gray-900/50">
                    <div>
                            <div className="font-bold text-lg">{lang === 'en' ? c.name_en : c.name_ar}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                                {c.city_name} • {c.type}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">ID: {c.id}</div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Link to={`/directory/${c.id}`} target="_blank" className="flex-1 sm:flex-none">
                            <Button size="sm" variant="outline" className="w-full flex items-center gap-1">
                                <ExternalLink size={14} /> View
                            </Button>
                        </Link>
                        <Button size="sm" onClick={() => handleVerify(c.id)} className="flex-1 sm:flex-none flex items-center gap-1">
                            <Check size={14} /> Verify
                        </Button>
                    </div>
                </div>
            ))}
            {clinics.length === 0 && (
                <div className="text-gray-500 py-12 text-center bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                    No pending verifications.
                </div>
            )}
        </div>
      </Card>
    </div>
  );
};