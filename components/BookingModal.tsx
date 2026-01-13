
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { dbService } from '../services/supabase';
import { Doctor, DoctorSchedule } from '../types';
import { Button, Input, Select, Spinner } from './UiComponents';
import { X, Calendar, Clock, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface BookingModalProps {
  clinicId: string;
  clinicName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ clinicId, clinicName, onClose, onSuccess }) => {
  const { lang, user } = useStore();
  const t = (key: string) => TRANSLATIONS[key] ? TRANSLATIONS[key][lang] : key;

  // State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState('');

  // Fetch Doctors on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const data = await dbService.getDoctorsByClinicId(clinicId);
        setDoctors(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [clinicId]);

  // Calculate Slots when Doctor + Date changes
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) {
        setAvailableSlots([]);
        return;
    }
    
    const calculateSlots = async () => {
        setLoading(true);
        setBookingError('');
        try {
            // 1. Get Schedule for this doctor
            const schedules = await dbService.getDoctorSchedules(selectedDoctor);
            const dateObj = new Date(selectedDate);
            
            // New Mapping for [Sat, Sun, Mon, Tue, Wed, Thu, Fri]
            // JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat
            // We need to map:
            // Sat (6) -> 0
            // Sun (0) -> 1
            // Mon (1) -> 2
            // ...
            // Fri (5) -> 6
            const dayIndex = (dateObj.getDay() + 1) % 7;
            
            const todaySchedule = schedules.find(s => s.day_of_week === dayIndex);

            if (!todaySchedule) {
                setAvailableSlots([]);
                setLoading(false);
                return;
            }

            // 2. Get existing bookings
            const existingBookings = await dbService.getBookingsByDoctorDate(selectedDoctor, selectedDate);
            const bookedTimes = existingBookings.map(b => {
                // b.booking_date is ISO timestamp. Extract HH:MM
                // e.g. 2024-01-01T09:30:00+00
                const d = new Date(b.booking_date!);
                return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            });

            // 3. Generate slots
            // start_time / end_time are "HH:MM:SS" strings
            const slots: string[] = [];
            let current = new Date(`2000-01-01T${todaySchedule.start_time}`);
            const end = new Date(`2000-01-01T${todaySchedule.end_time}`);
            const duration = todaySchedule.slot_duration; // minutes

            while (current < end) {
                const timeString = current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                
                // Simplified overlap check: if exact time match
                // Real production needs duration overlap check
                if (!bookedTimes.includes(timeString)) {
                    slots.push(timeString);
                }

                current.setMinutes(current.getMinutes() + duration);
            }
            setAvailableSlots(slots);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    calculateSlots();
  }, [selectedDoctor, selectedDate]);

  const handleConfirm = async () => {
      if (!user || !selectedDoctor || !selectedDate || !selectedSlot) return;
      setLoading(true);
      try {
          // Construct timestamp
          const bookingDate = new Date(`${selectedDate}T${selectedSlot}:00`);
          
          await dbService.createBooking({
              clinic_id: clinicId,
              doctor_id: selectedDoctor,
              patient_id: user.id,
              booking_date: bookingDate.toISOString(),
              status: 'PENDING'
          });
          setStep(3);
          setTimeout(() => {
              onSuccess();
          }, 2000);
      } catch (e: any) {
          setBookingError(e.message || t('error'));
          setLoading(false);
      }
  };

  const getNextDays = () => {
    const days = [];
    const today = new Date();
    for(let i=0; i<14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        days.push(d);
    }
    return days;
  };

  const nextDays = getNextDays();

  if (step === 3) {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl p-8 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{t('success')}</h2>
                <p className="text-gray-500">{lang === 'en' ? 'Your appointment has been booked successfully.' : 'تم حجز موعدك بنجاح.'}</p>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-950">
           <div>
               <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('bookNow')}</h2>
               <p className="text-xs text-gray-500">{clinicName}</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
               <X className="w-5 h-5" />
           </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
            {doctors.length === 0 && !loading ? (
                <div className="text-center py-10 text-gray-500">
                    <p>{lang === 'en' ? "No doctors available for online booking at this clinic." : "لا يوجد أطباء متاحين للحجز عبر الإنترنت في هذه العيادة."}</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* 1. Select Doctor */}
                    <div>
                        <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">1</div>
                             {lang === 'en' ? 'Select Doctor' : 'اختر الطبيب'}
                        </label>
                        <Select 
                            value={selectedDoctor} 
                            onChange={(e) => {
                                setSelectedDoctor(e.target.value);
                                setSelectedSlot(null);
                            }}
                            options={[
                                { value: '', label: lang === 'en' ? 'Choose a doctor...' : 'اختر طبيباً...' },
                                ...doctors.map(d => ({ value: d.id, label: lang === 'en' ? d.name_en : d.name_ar }))
                            ]}
                        />
                    </div>

                    {/* 2. Select Date (Custom Horizontal Picker) */}
                    <div className={!selectedDoctor ? 'opacity-50 pointer-events-none' : ''}>
                        <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">2</div>
                             {lang === 'en' ? 'Select Date' : 'اختر التاريخ'}
                        </label>
                        
                        <div className="relative">
                            <div className="flex gap-2 overflow-x-auto pb-4 pt-1 snap-x scrollbar-hide -mx-1 px-1">
                                {nextDays.map((d, i) => {
                                    const dateStr = d.toISOString().split('T')[0];
                                    const isSelected = selectedDate === dateStr;
                                    const dayName = d.toLocaleDateString(lang, { weekday: 'short' });
                                    const dayNum = d.getDate();
                                    
                                    return (
                                        <button 
                                            key={i}
                                            onClick={() => {
                                                setSelectedDate(dateStr);
                                                setSelectedSlot(null);
                                            }}
                                            className={`
                                                flex flex-col items-center justify-center min-w-[60px] h-[70px] rounded-xl border transition-all snap-start
                                                ${isSelected 
                                                    ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-600/30 transform scale-105' 
                                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary-400'
                                                }
                                            `}
                                        >
                                            <span className={`text-xs font-medium ${isSelected ? 'text-primary-100' : 'text-gray-400'}`}>{dayName}</span>
                                            <span className="text-lg font-bold">{dayNum}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            {/* Gradient Fade for scroll hint */}
                            <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-white dark:from-gray-900 to-transparent pointer-events-none"></div>
                        </div>
                    </div>

                    {/* 3. Select Slot */}
                    <div className={!selectedDate ? 'opacity-50 pointer-events-none' : ''}>
                        <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">3</div>
                             {lang === 'en' ? 'Available Slots' : 'الأوقات المتاحة'}
                        </label>
                        
                        {loading && <div className="py-8 flex justify-center"><Spinner /></div>}
                        
                        {!loading && selectedDate && availableSlots.length === 0 && (
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm text-center border border-yellow-100 dark:border-yellow-900/30">
                                {lang === 'en' ? 'No slots available on this date.' : 'لا توجد مواعيد متاحة في هذا التاريخ.'}
                            </div>
                        )}

                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                            {availableSlots.map(slot => (
                                <button
                                    key={slot}
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`py-2 px-1 text-sm rounded-lg border transition-all ${
                                        selectedSlot === slot 
                                        ? 'bg-primary-600 text-white border-primary-600 shadow-md ring-2 ring-primary-100 dark:ring-primary-900' 
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 text-gray-700 dark:text-gray-200'
                                    }`}
                                >
                                    {slot}
                                </button>
                            ))}
                        </div>
                    </div>

                    {bookingError && (
                         <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30">{bookingError}</div>
                    )}
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t dark:border-gray-800 flex gap-3 bg-gray-50 dark:bg-gray-950">
            <Button variant="ghost" className="flex-1" onClick={onClose}>
                {t('cancel')}
            </Button>
            <Button 
                className="flex-1 shadow-lg shadow-primary-600/20" 
                disabled={!selectedSlot || loading}
                onClick={handleConfirm}
            >
                {loading ? 'Processing...' : (lang === 'en' ? 'Confirm Booking' : 'تأكيد الحجز')}
            </Button>
        </div>

      </div>
    </div>
  );
};