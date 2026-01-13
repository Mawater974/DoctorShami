
import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { TRANSLATIONS } from '../constants';
import { Card, Button, Spinner, Badge } from '../components/UiComponents';
import { supabase } from '../services/supabase';
import { Booking } from '../types';
import { Calendar, Clock, MapPin } from 'lucide-react';

export const Appointments: React.FC = () => {
  const { lang, user } = useStore();
  const t = (key: string) => TRANSLATIONS[key] ? TRANSLATIONS[key][lang] : key;
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
      if (!user) return;
      setLoading(true);
      const { data } = await supabase
          .from('bookings')
          .select('*, clinic:clinic_id(name_en, name_ar), doctor:doctor_id(name_en, name_ar)')
          .eq('patient_id', user.id)
          .order('booking_date', { ascending: false });
      
      if (data) setBookings(data as any);
      setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, [user]);

  const handleCancel = async (bookingId: string) => {
      if (!confirm(t('appt.cancelConfirm'))) return;
      await supabase.from('bookings').update({ status: 'CANCELLED' }).eq('id', bookingId);
      fetchBookings();
  };

  if (loading) return <div className="p-20"><Spinner /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('appointments')}</h1>

      {bookings.length === 0 ? (
           <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-16 text-center">
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                    <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {t('appt.empty')}
                </h3>
                <p className="text-gray-500 max-w-sm">
                    {t('appt.emptyDesc')}
                </p>
            </div>
      ) : (
          <div className="grid gap-4">
              {bookings.map(b => (
                  <Card key={b.id} className="p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                             <h3 className="font-bold text-lg">
                                 {b.clinic ? (lang === 'en' ? b.clinic.name_en : b.clinic.name_ar) : t('table.clinic')}
                             </h3>
                             <Badge variant={b.status === 'CONFIRMED' ? 'success' : b.status === 'CANCELLED' ? 'warning' : 'info'}>
                                {b.status}
                             </Badge>
                          </div>
                          <div className="text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-1">
                              <MapPin size={16} />
                              <span>{b.doctor ? (lang === 'en' ? `Dr. ${b.doctor.name_en}` : `د. ${b.doctor.name_ar}`) : t('appt.general')}</span>
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-4">
                              <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(b.booking_date).toLocaleDateString()}</span>
                              <span className="flex items-center gap-1"><Clock size={14}/> {new Date(b.booking_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                      </div>
                      
                      {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                           <Button variant="danger" size="sm" onClick={() => handleCancel(b.id)}>
                               {t('appt.cancel')}
                           </Button>
                      )}
                  </Card>
              ))}
          </div>
      )}
    </div>
  );
};
