
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store';
import { TRANSLATIONS, STORAGE_BUCKET } from '../constants';
import { Card, Button, Input, Select, Badge, Spinner } from '../components/UiComponents';
import { supabase } from '../services/supabase';
import { 
    BarChart3, Stethoscope, User, Calendar, Pill, 
    Plus, X, Save, Pencil, Trash2, ExternalLink, 
    UserPlus, Copy, Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Clinic, Pharmacy, Doctor, Booking, DoctorSchedule, City, Specialty } from '../types';

export const ProviderDashboard: React.FC = () => {
  const { lang, user } = useStore();
  const t = (key: string) => TRANSLATIONS[key] ? TRANSLATIONS[key][lang] : key;
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'analytics' | 'clinics' | 'pharmacies' | 'doctors' | 'bookings'>('analytics');
  
  // Data State
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  
  // Ref Data
  const [cities, setCities] = useState<City[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  // UI State
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [manageScheduleId, setManageScheduleId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Forms State
  const defaultClinic: Partial<Clinic> = { 
    name_en: '', name_ar: '', description_en: '', description_ar: '', 
    location_en: '', location_ar: '', contact_phone: '', city_id: 1, logo_url: '',
    category_ids: [],
    opening_hours: { Mon: '09:00-17:00', Tue: '09:00-17:00', Wed: '09:00-17:00', Thu: '09:00-17:00', Fri: '09:00-17:00', Sat: 'Closed', Sun: 'Closed' }
  };
  const defaultPharma: Partial<Pharmacy> = { name_en: '', name_ar: '', location_en: '', location_ar: '', city_id: 1 };
  
  // Updated default doctor for multi-specialty
  const defaultDoctor: Partial<Doctor> = { name_en: '', name_ar: '', bio: '', specialty_ids: [], clinic_id: '', photo_url: '' };
  
  const [clinicForm, setClinicForm] = useState<Partial<Clinic>>(defaultClinic);
  const [pharmaForm, setPharmaForm] = useState<Partial<Pharmacy>>(defaultPharma);
  const [doctorForm, setDoctorForm] = useState<Partial<Doctor>>(defaultDoctor);
  const [scheduleForm, setScheduleForm] = useState<Partial<DoctorSchedule>>({ day_of_week: 0, start_time: '09:00', end_time: '17:00', slot_duration: 30 });

  useEffect(() => {
      if (user) {
        fetchCoreData();
        fetchRefData();
      }
  }, [user]);

  const fetchRefData = async () => {
    const { data: c } = await supabase.from('cities').select('*');
    const { data: s } = await supabase.from('specialties').select('*');
    if (c) setCities(c);
    if (s) setSpecialties(s);
  };

  const fetchCoreData = async () => {
    if (!user) return;
    setLoading(true);
    
    // Fetch Clinics
    const { data: c } = await supabase.from('clinics').select('*').eq('owner_id', user.id);
    setClinics(c as Clinic[] || []);

    // Fetch Pharmacies
    const { data: p } = await supabase.from('pharmacies').select('*').eq('owner_id', user.id);
    setPharmacies(p as Pharmacy[] || []);

    if (c && c.length > 0) {
        const clinicIds = c.map((cl: any) => cl.id);
        
        // Fetch Doctors
        const { data: d } = await supabase.from('doctors').select('*').in('clinic_id', clinicIds);
        // Robust mapping to handle potential missing column if migration not run, or nulls
        const mappedDoctors = (d || []).map((doc: any) => ({
            ...doc,
            specialty_ids: doc.specialty_ids || (doc.specialty_id ? [doc.specialty_id] : [])
        }));
        setDoctors(mappedDoctors);

        // Fetch Bookings
        const { data: b } = await supabase
            .from('bookings')
            .select('*, clinic:clinic_id(name_en), doctor:doctor_id(name_en), patient:patient_id(full_name, phone)')
            .in('clinic_id', clinicIds)
            .order('booking_date', {ascending: false});
        setBookings(b as any || []);
    } else {
        setDoctors([]);
        setBookings([]);
    }
    setLoading(false);
  };

  const fetchSchedules = async (docId: string) => {
      const { data } = await supabase.from('doctor_schedules').select('*').eq('doctor_id', docId).order('day_of_week');
      setSchedules(data as any || []);
  };

  const deleteImage = async (url: string | undefined) => {
      if (!url) return;
      try {
        const urlParts = url.split(`${STORAGE_BUCKET}/`);
        const path = urlParts.length > 1 ? urlParts[1] : null;
        if(path) await supabase.storage.from(STORAGE_BUCKET).remove([path]);
      } catch (e) {
          console.warn('Could not delete old image', e);
      }
  };

  // --- HANDLERS ---
  const handleDelete = async (table: 'clinics' | 'pharmacies' | 'doctors', id: string, imgUrl?: string) => {
      if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) return;
      if (imgUrl) await deleteImage(imgUrl);
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) alert('Error deleting: ' + error.message);
      else fetchCoreData();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>, currentUrl?: string) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return null;
    setUploading(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const filePath = `logos/${user.id}/${timestamp}-${randomSuffix}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file, { 
          upsert: false,
          cacheControl: '3600'
      });
      
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
      
      if(currentUrl) deleteImage(currentUrl).catch(console.warn);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading:', error);
      alert('Error uploading image: ' + (error.message));
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleClinicSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      const payload = { ...clinicForm, owner_id: user.id };
      if(!payload.category_ids) payload.category_ids = [];

      let error;
      if (isEditing && editId) {
          const { error: err } = await supabase.from('clinics').update(payload).eq('id', editId);
          error = err;
      } else {
          const { error: err } = await supabase.from('clinics').insert(payload);
          error = err;
      }
      if (!error) { resetForm(); fetchCoreData(); } else alert(error.message);
  };

  const handlePharmaSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      const payload = { ...pharmaForm, owner_id: user.id };
      const { error } = isEditing && editId 
        ? await supabase.from('pharmacies').update(payload).eq('id', editId)
        : await supabase.from('pharmacies').insert(payload);
      if (!error) { resetForm(); fetchCoreData(); } else alert(error.message);
  };

  const handleDoctorSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const payload = { ...doctorForm };
      
      // Ensure specialty_ids is an array
      if (!payload.specialty_ids) payload.specialty_ids = [];
      
      // Fallback for single field to satisfy Not Null constraints if migration isn't perfect
      // or if using legacy column
      if (payload.specialty_ids.length > 0) {
          payload.specialty_id = payload.specialty_ids[0];
      }

      const { error } = isEditing && editId
        ? await supabase.from('doctors').update(payload).eq('id', editId)
        : await supabase.from('doctors').insert(payload);
      if (!error) { resetForm(); fetchCoreData(); } else alert(error.message);
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!manageScheduleId) return;
      const { error } = await supabase.from('doctor_schedules').insert({ ...scheduleForm, doctor_id: manageScheduleId });
      if (!error) fetchSchedules(manageScheduleId); else alert(error.message);
  };

  const handleDeleteSchedule = async (id: string) => {
      const { error } = await supabase.from('doctor_schedules').delete().eq('id', id);
      if (!error && manageScheduleId) fetchSchedules(manageScheduleId);
  };

  const handleBookingAction = async (bookingId: string, status: 'CONFIRMED' | 'CANCELLED') => {
      const { error } = await supabase.from('bookings').update({ status }).eq('id', bookingId);
      if (error) alert('Error updating booking: ' + error.message);
      else fetchCoreData();
  };

  const resetForm = () => {
      setShowForm(false);
      setIsEditing(false);
      setEditId(null);
      setClinicForm(defaultClinic);
      setPharmaForm(defaultPharma);
      setDoctorForm(defaultDoctor);
      setManageScheduleId(null);
  };

  const handleAddSpecialty = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = Number(e.target.value);
      if (!id) return;
      const current = doctorForm.specialty_ids || [];
      if (!current.includes(id)) {
          setDoctorForm({ ...doctorForm, specialty_ids: [...current, id] });
      }
      e.target.value = ''; // reset select
  };

  const handleRemoveSpecialty = (id: number) => {
      const current = doctorForm.specialty_ids || [];
      setDoctorForm({ ...doctorForm, specialty_ids: current.filter(sid => sid !== id) });
  };

  // Helper for Opening Hours
  const updateOpeningHour = (day: string, type: 'start' | 'end' | 'toggle', value: string) => {
    const current = clinicForm.opening_hours?.[day] || 'Closed';
    let [start, end] = current === 'Closed' ? ['09:00', '17:00'] : current.split('-');
    
    if (type === 'toggle') {
        const newValue = current === 'Closed' ? '09:00-17:00' : 'Closed';
        setClinicForm({ ...clinicForm, opening_hours: { ...clinicForm.opening_hours, [day]: newValue }});
        return;
    }

    if (type === 'start') start = value;
    if (type === 'end') end = value;
    
    setClinicForm({ ...clinicForm, opening_hours: { ...clinicForm.opening_hours, [day]: `${start}-${end}` }});
  };

  const copyMondayToAll = () => {
      const mon = clinicForm.opening_hours?.['Mon'] || '09:00-17:00';
      const newHours: any = { ...clinicForm.opening_hours };
      weekDays.forEach(d => {
          if (d !== 'Mon') newHours[d] = mon;
      });
      setClinicForm({ ...clinicForm, opening_hours: newHours });
  };

  // --- ANALYTICS DATA ---
  const { lineData, barData } = (() => {
      const last7 = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
      }).reverse();
      const lineData = last7.map(date => ({
          date,
          bookings: bookings.filter(b => b.booking_date.startsWith(date)).length
      }));
      const doctorCounts: Record<string, number> = {};
      bookings.forEach(b => {
          const docName = b.doctor ? (lang === 'en' ? b.doctor.name_en : b.doctor.name_ar) : 'Unknown';
          doctorCounts[docName] = (doctorCounts[docName] || 0) + 1;
      });
      const barData = Object.keys(doctorCounts).map(name => ({ name, count: doctorCounts[name] }));
      return { lineData, barData };
  })();

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  if (loading) return <div className="p-20"><Spinner /></div>;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
           <div>
               <h1 className="text-3xl font-bold">{t('providerPanel')}</h1>
               <p className="text-gray-500">Manage your medical facilities</p>
           </div>
           
           {/* Mobile-Friendly Tabs */}
           <div className="flex overflow-x-auto space-x-2 border-b dark:border-gray-800 pb-2 scrollbar-hide w-full md:w-auto mt-4 md:mt-0">
             {[
                 { id: 'analytics', icon: BarChart3, label: 'Analytics' },
                 { id: 'clinics', icon: Stethoscope, label: t('dashboard.myClinics') },
                 { id: 'doctors', icon: User, label: 'Doctors' },
                 { id: 'bookings', icon: Calendar, label: 'Bookings' },
                 { id: 'pharmacies', icon: Pill, label: t('dashboard.myPharmacies') },
             ].map(tab => (
                 <button 
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as any); resetForm(); }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm ${activeTab === tab.id ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                 >
                     <tab.icon size={16} /> {tab.label}
                 </button>
             ))}
           </div>
       </div>

      {/* Action Header */}
      {(activeTab === 'clinics' || activeTab === 'doctors' || activeTab === 'pharmacies') && !showForm && !manageScheduleId && (
          <div className="flex justify-end">
            <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
                <Plus size={16} /> Add New
            </Button>
          </div>
      )}

      {/* --- ANALYTICS TAB --- */}
      {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                  <h3 className="font-bold mb-4">Bookings (Last 7 Days)</h3>
                  <div className="h-64 w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={lineData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="date" tickFormatter={d => d.slice(5)}/>
                            <YAxis allowDecimals={false}/>
                            <Tooltip contentStyle={{backgroundColor: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px'}} />
                            <Line type="monotone" dataKey="bookings" stroke="#0ea5e9" strokeWidth={3} dot={{r: 4}} />
                        </LineChart>
                    </ResponsiveContainer>
                  </div>
              </Card>
              <Card className="p-6">
                  <h3 className="font-bold mb-4">Bookings by Doctor</h3>
                   <div className="h-64 w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false}/>
                            <Tooltip contentStyle={{backgroundColor: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px'}} />
                            <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                  </div>
              </Card>
          </div>
      )}

      {/* --- CLINICS TAB --- */}
      {activeTab === 'clinics' && (
        <>
            {showForm && (
                <Card className="p-6 mb-6 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">{isEditing ? 'Edit Clinic' : 'New Clinic'}</h3>
                        <Button variant="ghost" size="sm" onClick={resetForm}><X /></Button>
                    </div>
                    <form onSubmit={handleClinicSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label={t('form.nameEn')} value={clinicForm.name_en} onChange={e => setClinicForm({...clinicForm, name_en: e.target.value})} required dir="ltr"/>
                        <Input label={t('form.nameAr')} value={clinicForm.name_ar} onChange={e => setClinicForm({...clinicForm, name_ar: e.target.value})} required dir="rtl"/>
                        
                        <Select label={t('search.city')} value={clinicForm.city_id} onChange={e => setClinicForm({...clinicForm, city_id: Number(e.target.value)})} options={cities.map(c => ({ value: c.id, label: lang === 'en' ? c.name_en : c.name_ar }))} />
                        
                        <Input label="Phone" value={clinicForm.contact_phone || ''} onChange={e => setClinicForm({...clinicForm, contact_phone: e.target.value})} />
                        
                        <Input label="Location (En)" value={clinicForm.location_en || ''} onChange={e => setClinicForm({...clinicForm, location_en: e.target.value})} dir="ltr"/>
                        <Input label="Location (Ar)" value={clinicForm.location_ar || ''} onChange={e => setClinicForm({...clinicForm, location_ar: e.target.value})} dir="rtl"/>

                         {/* IMPROVED Opening Hours Section */}
                        <div className="col-span-1 md:col-span-2 bg-white dark:bg-gray-900 p-5 rounded-lg border dark:border-gray-700 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold flex items-center gap-2">
                                    <Clock size={18} className="text-primary-600"/> Opening Hours
                                </h4>
                                <Button type="button" size="sm" variant="outline" onClick={copyMondayToAll} className="text-xs flex items-center gap-1">
                                    <Copy size={12}/> Copy Mon to All
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {weekDays.map(day => {
                                    const value = clinicForm.opening_hours?.[day] || 'Closed';
                                    const isOpen = value !== 'Closed';
                                    const [start, end] = isOpen ? value.split('-') : ['09:00', '17:00'];

                                    return (
                                        <div key={day} className={`flex flex-col sm:flex-row sm:items-center gap-3 p-2 rounded-md ${isOpen ? 'bg-gray-50 dark:bg-gray-800' : 'opacity-70'}`}>
                                            <div className="w-24 font-bold flex items-center gap-2">
                                                <input 
                                                    type="checkbox" 
                                                    checked={isOpen}
                                                    onChange={() => updateOpeningHour(day, 'toggle', '')}
                                                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                />
                                                <span className={isOpen ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>{day}</span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 flex-1">
                                                {isOpen ? (
                                                    <>
                                                        <Input 
                                                            type="time" 
                                                            value={start} 
                                                            onChange={(e) => updateOpeningHour(day, 'start', e.target.value)}
                                                            className="py-1 text-sm max-w-[110px]"
                                                        />
                                                        <span className="text-gray-400">to</span>
                                                        <Input 
                                                            type="time" 
                                                            value={end} 
                                                            onChange={(e) => updateOpeningHour(day, 'end', e.target.value)}
                                                            className="py-1 text-sm max-w-[110px]"
                                                        />
                                                    </>
                                                ) : (
                                                    <span className="text-sm text-gray-400 italic py-1.5 px-3 border border-transparent">Closed</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Description - Using Textarea as simpler alternative to ReactQuill */}
                        <div className="col-span-1 md:col-span-2">
                           <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Description (English)</label>
                           <textarea 
                              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                              rows={4}
                              value={clinicForm.description_en || ''} 
                              onChange={(e) => setClinicForm({...clinicForm, description_en: e.target.value})} 
                           />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                           <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Description (Arabic)</label>
                           <textarea 
                              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                              rows={4}
                              value={clinicForm.description_ar || ''} 
                              onChange={(e) => setClinicForm({...clinicForm, description_ar: e.target.value})} 
                              dir="rtl"
                           />
                        </div>
                        
                        <div className="col-span-1 md:col-span-2">
                           <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">{t('form.uploadLogo')}</label>
                           <div className="flex gap-2 items-center">
                             <input type="file" onChange={async (e) => {
                                 const url = await handleFile(e, clinicForm.logo_url);
                                 if(url) setClinicForm({...clinicForm, logo_url: url});
                             }} disabled={uploading} className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700"/>
                             {uploading && <Spinner />}
                           </div>
                        </div>
                        
                        <div className="col-span-1 md:col-span-2 pt-4 flex gap-2 flex-wrap">
                             <Button type="submit" disabled={uploading} className="flex-1 md:flex-none flex items-center gap-2"><Save size={16} /> {isEditing ? 'Update Clinic' : 'Create Clinic'}</Button>
                             <Button type="button" variant="secondary" onClick={resetForm} className="flex-1 md:flex-none">Cancel</Button>
                        </div>
                    </form>
                </Card>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {clinics.map(c => (
                    <Card 
                        key={c.id} 
                        className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer"
                        onClick={() => navigate(`/directory/${c.id}`)}
                    >
                        {/* Content Area */}
                        <div className="p-5" title="Click to view public page">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400">
                                   {c.logo_url ? (
                                       <img src={c.logo_url} className="w-full h-full object-cover" alt="logo" />
                                   ) : (
                                       <Stethoscope className="w-8 h-8 opacity-50" />
                                   )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold group-hover:text-primary-600 transition-colors truncate">
                                        {lang === 'en' ? c.name_en : c.name_ar}
                                    </h3>
                                    <div className="text-sm text-gray-500 flex flex-wrap items-center gap-1 mt-1">
                                        <Badge variant={c.is_verified ? 'success' : 'warning'}>
                                            {c.is_verified ? 'Verified' : 'Pending'}
                                        </Badge>
                                        <span className="hidden sm:inline">•</span>
                                        <span className="truncate">{c.contact_phone || 'No phone'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions Footer - Stop Propagation */}
                        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-800 flex justify-between items-center" onClick={e => e.stopPropagation()}>
                             <div className="text-xs text-gray-400 hidden sm:block">ID: {c.id.slice(0,8)}...</div>
                             <div className="flex gap-2 w-full sm:w-auto justify-end">
                                <Link to={`/directory/${c.id}`} target="_blank">
                                    <Button size="sm" variant="ghost" className="text-gray-500 hover:text-primary-600"><ExternalLink size={14}/></Button>
                                </Link>
                                <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={() => {
                                    setActiveTab('doctors');
                                    setDoctorForm({ ...defaultDoctor, clinic_id: c.id });
                                    setShowForm(true);
                                }}>
                                    <UserPlus size={14} /> Add Doctor
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => { setClinicForm(c); setIsEditing(true); setEditId(c.id); setShowForm(true); window.scrollTo(0,0);}}>
                                    <Pencil size={14} className="mr-1"/> Edit
                                </Button>
                                <Button size="sm" variant="danger" onClick={() => handleDelete('clinics', c.id, c.logo_url)}>
                                    <Trash2 size={14}/>
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </>
      )}

      {/* --- DOCTORS TAB --- */}
      {activeTab === 'doctors' && (
          <>
            {!manageScheduleId && showForm && (
                <Card className="p-6 mb-6 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">{isEditing ? 'Edit Doctor' : 'New Doctor'}</h3>
                        <Button variant="ghost" size="sm" onClick={resetForm}><X /></Button>
                    </div>
                    <form onSubmit={handleDoctorSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label={t('form.nameEn')} value={doctorForm.name_en} onChange={e => setDoctorForm({...doctorForm, name_en: e.target.value})} required dir="ltr"/>
                        <Input label={t('form.nameAr')} value={doctorForm.name_ar} onChange={e => setDoctorForm({...doctorForm, name_ar: e.target.value})} required dir="rtl"/>
                        
                        <Select label="Clinic" value={doctorForm.clinic_id} onChange={e => setDoctorForm({...doctorForm, clinic_id: e.target.value})} options={[{value:'', label:'Select Clinic'}, ...clinics.map(c => ({ value: c.id, label: lang === 'en' ? c.name_en : c.name_ar }))]} />
                        
                        {/* Multi Specialty Select */}
                        <div className="col-span-1 md:col-span-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Specialties</label>
                             <Select 
                                label="" 
                                value="" 
                                onChange={handleAddSpecialty}
                                options={[{ value: '', label: 'Add Specialty...' }, ...specialties.map(s => ({ value: s.id, label: lang === 'en' ? s.name_en : s.name_ar }))]} 
                             />
                             <div className="flex flex-wrap gap-2 mt-3">
                                 {doctorForm.specialty_ids?.map(id => {
                                     const s = specialties.find(sp => sp.id === id);
                                     if (!s) return null;
                                     return (
                                         <Badge key={id} variant="info" className="flex items-center gap-1 pe-1">
                                             {lang === 'en' ? s.name_en : s.name_ar}
                                             <button type="button" onClick={() => handleRemoveSpecialty(id)} className="hover:bg-sky-200 dark:hover:bg-sky-800 rounded-full p-0.5">
                                                 <X size={12}/>
                                             </button>
                                         </Badge>
                                     );
                                 })}
                             </div>
                        </div>
                        
                        <div className="col-span-1 md:col-span-2">
                           <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Bio</label>
                           <textarea className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none" rows={3} value={doctorForm.bio || ''} onChange={(e) => setDoctorForm({...doctorForm, bio: e.target.value})} />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                           <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Photo</label>
                           <div className="flex gap-2 items-center">
                             <input type="file" onChange={async (e) => {
                                 const url = await handleFile(e, doctorForm.photo_url);
                                 if(url) setDoctorForm({...doctorForm, photo_url: url});
                             }} disabled={uploading} className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700"/>
                              {uploading && <Spinner />}
                           </div>
                        </div>
                        <div className="col-span-1 md:col-span-2 flex gap-2 pt-4">
                            <Button type="submit" disabled={uploading} className="flex-1 md:flex-none flex items-center gap-2"><Save size={16} /> {isEditing ? 'Update Doctor' : 'Save Doctor'}</Button>
                            <Button type="button" variant="secondary" onClick={resetForm} className="flex-1 md:flex-none">Cancel</Button>
                        </div>
                    </form>
                </Card>
            )}
            
            {!manageScheduleId && !showForm && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {doctors.map(d => (
                         <Card key={d.id} className="p-4 flex gap-4">
                            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0 flex items-center justify-center text-gray-400 border border-gray-200 dark:border-gray-700">
                                {d.photo_url ? <img src={d.photo_url} className="w-full h-full object-cover" alt="doctor"/> : <User />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold truncate">{lang === 'en' ? d.name_en : d.name_ar}</h3>
                                
                                {/* Display Specialties */}
                                <div className="flex flex-wrap gap-1 mb-1">
                                    {d.specialty_ids && d.specialty_ids.length > 0 ? (
                                        d.specialty_ids.map(sid => {
                                            const s = specialties.find(sp => sp.id === sid);
                                            return s ? (
                                                <span key={sid} className="text-xs bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-1.5 py-0.5 rounded">
                                                    {lang === 'en' ? s.name_en : s.name_ar}
                                                </span>
                                            ) : null;
                                        })
                                    ) : (
                                        // Fallback for old single ID or missing data
                                        d.specialty_id && (
                                            <span className="text-xs bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-1.5 py-0.5 rounded">
                                                {lang === 'en' ? specialties.find(s => s.id === d.specialty_id)?.name_en : specialties.find(s => s.id === d.specialty_id)?.name_ar}
                                            </span>
                                        )
                                    )}
                                </div>
                                
                                <div className="text-xs text-gray-500 mb-2">{clinics.find(c => c.id === d.clinic_id)?.name_en}</div>
                                <div className="flex flex-wrap gap-2">
                                     <Button size="sm" variant="outline" onClick={() => { setDoctorForm(d); setIsEditing(true); setEditId(d.id); setShowForm(true); }}>Edit</Button>
                                     <Button size="sm" variant="secondary" onClick={() => { setManageScheduleId(d.id); fetchSchedules(d.id); }}>Schedule</Button>
                                     <Button size="sm" variant="danger" onClick={() => handleDelete('doctors', d.id, d.photo_url)}><Trash2 size={14}/></Button>
                                </div>
                            </div>
                         </Card>
                    ))}
                    {doctors.length === 0 && <div className="col-span-full text-center py-8 text-gray-500">No doctors added yet.</div>}
                </div>
            )}

            {manageScheduleId && (
                 <Card className="p-6">
                    <div className="flex justify-between items-center mb-6">
                         <h3 className="text-lg font-bold">Manage Schedule for {doctors.find(d => d.id === manageScheduleId)?.name_en}</h3>
                         <Button variant="secondary" onClick={() => setManageScheduleId(null)}>Back</Button>
                    </div>
                    
                    <form onSubmit={handleAddSchedule} className="flex flex-wrap gap-4 items-end mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                         <div className="flex-1 min-w-[150px]">
                             <label className="text-xs font-bold text-gray-500 block mb-1">Day</label>
                             <Select options={weekDays.map((d, i) => ({ value: i, label: d }))} value={scheduleForm.day_of_week} onChange={e => setScheduleForm({...scheduleForm, day_of_week: Number(e.target.value)})} />
                         </div>
                         <div className="flex-1 min-w-[120px]">
                              <label className="text-xs font-bold text-gray-500 block mb-1">Start</label>
                              <Input type="time" value={scheduleForm.start_time} onChange={e => setScheduleForm({...scheduleForm, start_time: e.target.value})} className="py-2" />
                         </div>
                         <div className="flex-1 min-w-[120px]">
                              <label className="text-xs font-bold text-gray-500 block mb-1">End</label>
                              <Input type="time" value={scheduleForm.end_time} onChange={e => setScheduleForm({...scheduleForm, end_time: e.target.value})} className="py-2" />
                         </div>
                         <div className="flex-1 min-w-[100px]">
                              <label className="text-xs font-bold text-gray-500 block mb-1">Slot (min)</label>
                              <Input type="number" value={scheduleForm.slot_duration} onChange={e => setScheduleForm({...scheduleForm, slot_duration: Number(e.target.value)})} className="py-2" />
                         </div>
                         <Button type="submit" className="flex items-center gap-1"><Plus size={16}/> Add</Button>
                    </form>

                    <div className="space-y-2">
                        {schedules.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-3 border dark:border-gray-800 rounded bg-white dark:bg-gray-950">
                                <div className="flex gap-4 items-center">
                                    <span className="font-bold w-12">{weekDays[s.day_of_week]}</span>
                                    <span className="text-gray-600 dark:text-gray-300">{s.start_time} - {s.end_time}</span>
                                    <Badge variant="info">{s.slot_duration} min slots</Badge>
                                </div>
                                <Button size="sm" variant="danger" onClick={() => handleDeleteSchedule(s.id)}><Trash2 size={14}/></Button>
                            </div>
                        ))}
                        {schedules.length === 0 && <div className="text-center text-gray-500 py-4">No schedules added yet.</div>}
                    </div>
                 </Card>
            )}
          </>
      )}

      {/* --- PHARMACIES TAB --- */}
      {activeTab === 'pharmacies' && (
           <>
            {showForm && (
                <Card className="p-6 mb-6 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">{isEditing ? 'Edit Pharmacy' : 'New Pharmacy'}</h3>
                        <Button variant="ghost" size="sm" onClick={resetForm}><X /></Button>
                    </div>
                    <form onSubmit={handlePharmaSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label={t('form.nameEn')} value={pharmaForm.name_en} onChange={e => setPharmaForm({...pharmaForm, name_en: e.target.value})} required dir="ltr"/>
                        <Input label={t('form.nameAr')} value={pharmaForm.name_ar} onChange={e => setPharmaForm({...pharmaForm, name_ar: e.target.value})} required dir="rtl"/>
                        <Select label={t('search.city')} value={pharmaForm.city_id} onChange={e => setPharmaForm({...pharmaForm, city_id: Number(e.target.value)})} options={cities.map(c => ({ value: c.id, label: lang === 'en' ? c.name_en : c.name_ar }))} />
                        
                        <Input label="Location (En)" value={pharmaForm.location_en || ''} onChange={e => setPharmaForm({...pharmaForm, location_en: e.target.value})} dir="ltr"/>
                        <Input label="Location (Ar)" value={pharmaForm.location_ar || ''} onChange={e => setPharmaForm({...pharmaForm, location_ar: e.target.value})} dir="rtl"/>
                        
                        <div className="col-span-1 md:col-span-2 flex gap-2 pt-4">
                             <Button type="submit" className="flex-1 md:flex-none flex items-center gap-2"><Save size={16} /> {isEditing ? 'Update' : 'Create'}</Button>
                             <Button type="button" variant="secondary" onClick={resetForm} className="flex-1 md:flex-none">Cancel</Button>
                        </div>
                    </form>
                </Card>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {pharmacies.map(p => (
                     <Card 
                        key={p.id} 
                        className="p-5 flex flex-col cursor-pointer hover:shadow-lg transition-all"
                        onClick={() => navigate(`/directory/${p.id}`)}
                     >
                         <div className="flex justify-between items-start mb-4">
                             <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                                 <Pill />
                             </div>
                             {/* Actions - Stop Prop */}
                             <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                 <Button size="sm" variant="ghost" onClick={() => { setPharmaForm(p); setIsEditing(true); setEditId(p.id); setShowForm(true); }}><Pencil size={14}/></Button>
                                 <Button size="sm" variant="danger" onClick={() => handleDelete('pharmacies', p.id)}><Trash2 size={14}/></Button>
                             </div>
                         </div>
                         <h3 className="font-bold text-lg mb-1">{lang === 'en' ? p.name_en : p.name_ar}</h3>
                         <p className="text-sm text-gray-500 mb-4">{lang === 'en' ? p.location_en : p.location_ar}</p>
                         <Link to={`/directory/${p.id}`} target="_blank" className="mt-auto" onClick={e => e.stopPropagation()}>
                            <Button variant="outline" size="sm" className="w-full">View Public Page</Button>
                         </Link>
                     </Card>
                 ))}
                 {pharmacies.length === 0 && <div className="col-span-full text-center py-8 text-gray-500">No pharmacies added yet.</div>}
            </div>
           </>
      )}

      {/* --- BOOKINGS TAB --- */}
      {activeTab === 'bookings' && (
           <Card className="p-0 overflow-hidden">
               <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left dark:text-gray-300 min-w-[800px]">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-800">
                            <tr>
                                <th className="px-6 py-4">Patient</th>
                                <th className="px-6 py-4">Doctor</th>
                                <th className="px-6 py-4">Clinic</th>
                                <th className="px-6 py-4">Date/Time</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map(b => (
                                <tr key={b.id} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-6 py-4 font-medium">
                                        <div>{b.patient?.full_name || 'Unknown'}</div>
                                        <div className="text-xs text-gray-500">{b.patient?.phone}</div>
                                    </td>
                                    <td className="px-6 py-4">{b.doctor ? (lang === 'en' ? b.doctor.name_en : b.doctor.name_ar) : '-'}</td>
                                    <td className="px-6 py-4 text-xs text-gray-500">{b.clinic ? (lang === 'en' ? b.clinic.name_en : b.clinic.name_en) : '-'}</td>
                                    <td className="px-6 py-4">
                                        {new Date(b.booking_date).toLocaleDateString()}
                                        <div className="text-xs text-gray-500">{new Date(b.booking_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={b.status === 'CONFIRMED' ? 'success' : b.status === 'CANCELLED' ? 'warning' : 'info'}>{b.status}</Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            {b.status === 'PENDING' && (
                                                <>
                                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleBookingAction(b.id, 'CONFIRMED')} title="Confirm"><Plus size={14}/></Button>
                                                    <Button size="sm" variant="danger" onClick={() => handleBookingAction(b.id, 'CANCELLED')} title="Cancel"><X size={14}/></Button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                   </table>
                   {bookings.length === 0 && <div className="p-8 text-center text-gray-500">No bookings found.</div>}
               </div>
           </Card>
      )}
    </div>
  );
};
