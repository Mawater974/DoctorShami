
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store';
import { TRANSLATIONS, STORAGE_BUCKET } from '../constants';
import { Card, Button, Input, Select, Badge, Spinner } from '../components/UiComponents';
import { FacilityForm } from '../components/FacilityForm';
import { supabase, dbService } from '../services/supabase';
import { storageService } from '../services/storage';
import {
    BarChart3, Stethoscope, User, Calendar, Pill,
    Plus, X, Save, Pencil, Trash2, ExternalLink,
    UserPlus, Search, Link as LinkIcon, CheckSquare, Square,
    AlertTriangle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Clinic, Pharmacy, Doctor, Booking, DoctorSchedule, City, Specialty, EntityType, Facility } from '../types';

export const ProviderDashboard: React.FC = () => {
    const { lang, user, specialties, cities } = useStore();
    const t = (key: string) => TRANSLATIONS[key] ? TRANSLATIONS[key][lang] : key;
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'analytics' | 'clinics' | 'pharmacies' | 'doctors' | 'bookings'>('analytics');

    // Data State
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);

    // UI State
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [manageScheduleId, setManageScheduleId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        type: 'clinics' | 'pharmacies' | 'doctors';
        id: string;
        imgUrl?: string;
    }>({ isOpen: false, type: 'doctors', id: '' });

    // Facility Form State (Passed to component)
    const [currentFacility, setCurrentFacility] = useState<Partial<Facility> | undefined>(undefined);

    // Doctor Form State
    const defaultDoctor: Partial<Doctor> = { name_en: '', name_ar: '', bio: '', specialty_ids: [], photo_url: '', phone: '' };
    const [doctorForm, setDoctorForm] = useState<Partial<Doctor>>(defaultDoctor);

    // Multi-Select Clinics
    const [selectedClinicIds, setSelectedClinicIds] = useState<string[]>([]);

    const [doctorUploading, setDoctorUploading] = useState(false);
    const [addDoctorMode, setAddDoctorMode] = useState<'new' | 'existing'>('new');

    // Existing Doctor Selection
    const [existingDoctorId, setExistingDoctorId] = useState<string>('');
    const [doctorSearchQuery, setDoctorSearchQuery] = useState('');

    // Schedule Form State
    const weekDays = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const [scheduleForm, setScheduleForm] = useState<Partial<DoctorSchedule>>({ day_of_week: 0, start_time: '09:00', end_time: '17:00', slot_duration: 30 });

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
        if (user) {
            fetchCoreData();
        }
    }, [user]);

    const fetchCoreData = async () => {
        if (!user) return;
        setLoading(true);

        try {
            // Fetch Clinics
            const { data: c } = await supabase.from('clinics').select('*').eq('owner_id', user.id);
            setClinics(c as Clinic[] || []);

            // Fetch Pharmacies
            const { data: p } = await supabase.from('pharmacies').select('*').eq('owner_id', user.id);
            setPharmacies(p as Pharmacy[] || []);

            // Fetch Doctors using the optimized aggregation method
            const providerDocs = await dbService.getProviderDoctors(user.id);
            setDoctors(providerDocs);

            // Fetch Bookings if clinics exist
            if (c && c.length > 0) {
                const clinicIds = c.map((cl: any) => cl.id);
                const { data: b } = await supabase
                    .from('bookings')
                    .select('*, clinic:clinic_id(name_en), doctor:doctor_id(name_en), patient:patient_id(full_name, phone)')
                    .in('clinic_id', clinicIds)
                    .order('booking_date', { ascending: false });
                setBookings(b as any || []);
            } else {
                setBookings([]);
            }
        } catch (e) {
            console.error("Error fetching dashboard data:", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchSchedules = async (docId: string) => {
        const { data } = await supabase.from('doctor_schedules').select('*').eq('doctor_id', docId).order('day_of_week');
        setSchedules(data as any || []);
    };

    // --- HANDLERS ---
    const handleDelete = (table: 'clinics' | 'pharmacies' | 'doctors', id: string, imgUrl?: string) => {
        setDeleteModal({ isOpen: true, type: table, id, imgUrl });
    };

    const executeDelete = async () => {
        const { type, id, imgUrl } = deleteModal;
        setDeleteModal(prev => ({ ...prev, isOpen: false })); // Close modal

        if (imgUrl) await deleteImage(imgUrl, type === 'doctors'); // Delete image helper
        const { error } = await supabase.from(type).delete().eq('id', id);

        if (error) alert('Error deleting: ' + error.message);
        else fetchCoreData();
    };

    const deleteImage = async (url: string | undefined, isDoctor = false) => {
        if (!url) return;
        // Basic implementation - relies on storageService path extraction if needed
    };

    const handleFacilitySubmit = async (data: Partial<Facility>) => {
        if (!user) return;

        const type = activeTab === 'clinics' ? EntityType.CLINIC : EntityType.PHARMACY;

        if (isEditing && editId) {
            await dbService.updateFacility(type, editId, data);
        } else {
            // Add type to data for creation
            await dbService.createFacility({ ...data, type }, user.id);
        }

        resetForm();
        fetchCoreData();
    };

    const handleLinkExistingDoctor = async () => {
        if (!existingDoctorId) {
            alert(lang === 'en' ? 'Please select a doctor' : 'يرجى اختيار طبيب');
            return;
        }
        if (selectedClinicIds.length === 0) {
            alert(lang === 'en' ? 'Please select at least one clinic' : 'يرجى اختيار عيادة واحدة على الأقل');
            return;
        }

        try {
            for (const clinicId of selectedClinicIds) {
                await dbService.linkDoctorToClinic(existingDoctorId, clinicId);
            }
            resetForm();
            fetchCoreData();
        } catch (e: any) {
            alert(e.message || t('error'));
        }
    };

    const handleDoctorSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedClinicIds.length === 0 && !isEditing) {
            alert(lang === 'en' ? 'Please select at least one clinic' : 'يرجى اختيار عيادة واحدة على الأقل');
            return;
        }

        const payload = { ...doctorForm } as any;
        // Sanitize payload
        delete payload.clinic_id; // Clean legacy fields if present
        delete payload.clinics;

        if (!payload.specialty_ids) payload.specialty_ids = [];
        if (payload.specialty_ids.length > 0) {
            payload.specialty_id = payload.specialty_ids[0]; // Legacy fallback
        }

        try {
            let doctorId = editId;

            if (isEditing && editId) {
                const { error } = await supabase.from('doctors').update(payload).eq('id', editId);
                if (error) throw error;

                // Update links for editing (Add new links only for simplicity, managing removals is complex UI)
                // Ideally we'd sync the array
                if (selectedClinicIds.length > 0) {
                    for (const cid of selectedClinicIds) {
                        await dbService.linkDoctorToClinic(editId, cid);
                    }
                }

            } else {
                // 1. Create Doctor
                // Removed: clinic_id from insert
                const { data: newDoc, error } = await supabase.from('doctors').insert({
                    ...payload
                }).select().single();

                if (error) throw error;
                doctorId = newDoc.id;
            }

            // 2. Ensure Links (Junction Table) for ALL selected clinics
            if (doctorId) {
                for (const cid of selectedClinicIds) {
                    await dbService.linkDoctorToClinic(doctorId, cid);
                }
            }

            resetForm();
            fetchCoreData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDoctorFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setDoctorUploading(true);
        try {
            const url = await storageService.uploadImage(e.target.files[0], 'doctors');
            setDoctorForm({ ...doctorForm, photo_url: url });
        } catch (err) {
            console.error(err);
            alert(t('error'));
        } finally {
            setDoctorUploading(false);
        }
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
        setCurrentFacility(undefined);
        setDoctorForm(defaultDoctor);
        setManageScheduleId(null);
        setSelectedClinicIds([]);
        setAddDoctorMode('new');
        setDoctorSearchQuery('');
        setExistingDoctorId('');
    };

    const handleAddSpecialty = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = Number(e.target.value);
        if (!id) return;
        const current = doctorForm.specialty_ids || [];
        if (!current.includes(id)) {
            setDoctorForm({ ...doctorForm, specialty_ids: [...current, id] });
        }
        e.target.value = '';
    };

    const handleRemoveSpecialty = (id: number) => {
        const current = doctorForm.specialty_ids || [];
        setDoctorForm({ ...doctorForm, specialty_ids: current.filter(sid => sid !== id) });
    };

    const toggleClinicSelection = (clinicId: string) => {
        setSelectedClinicIds(prev =>
            prev.includes(clinicId)
                ? prev.filter(id => id !== clinicId)
                : [...prev, clinicId]
        );
    };

    // --- ANALYTICS DATA ---
    const { lineData, barData } = (() => {
        const last7 = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toLocaleDateString('en-CA');
        }).reverse();

        const lineData = last7.map(dateStr => {
            const count = bookings.filter(b => {
                if (!b.booking_date) return false;
                const bookingLocal = new Date(b.booking_date);
                return bookingLocal.toLocaleDateString('en-CA') === dateStr;
            }).length;

            return { date: dateStr, bookings: count };
        });

        const doctorCounts: Record<string, number> = {};
        bookings.forEach(b => {
            const docName = b.doctor ? (lang === 'en' ? b.doctor.name_en : b.doctor.name_ar) : 'Unknown';
            doctorCounts[docName] = (doctorCounts[docName] || 0) + 1;
        });
        const barData = Object.keys(doctorCounts).map(name => ({ name, count: doctorCounts[name] }));

        return { lineData, barData };
    })();

    if (loading) return <div className="p-20"><Spinner /></div>;

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">{t('providerPanel')}</h1>
                    <p className="text-gray-500">{t('provider.subtitle')}</p>
                </div>

                <div className="flex overflow-x-auto space-x-2 border-b dark:border-gray-800 pb-2 scrollbar-hide w-full md:w-auto mt-4 md:mt-0">
                    {[
                        { id: 'analytics', icon: BarChart3, label: t('provider.analytics') },
                        { id: 'clinics', icon: Stethoscope, label: t('dashboard.myClinics') },
                        { id: 'doctors', icon: User, label: t('provider.doctors') },
                        { id: 'bookings', icon: Calendar, label: t('provider.bookings') },
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
                        <Plus size={16} /> {t('provider.addNew')}
                    </Button>
                </div>
            )}

            {/* --- ANALYTICS TAB --- */}
            {activeTab === 'analytics' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6">
                        <h3 className="font-bold mb-4">{t('provider.analytics.last7')}</h3>
                        <div className="h-64 w-full text-xs min-w-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={lineData}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                    <XAxis dataKey="date" tickFormatter={d => d.slice(5)} />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px' }} />
                                    <Line type="monotone" dataKey="bookings" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <h3 className="font-bold mb-4">{t('provider.analytics.byDoctor')}</h3>
                        <div className="h-64 w-full text-xs min-w-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                    <XAxis dataKey="name" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px' }} />
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
                            <FacilityForm
                                type={EntityType.CLINIC}
                                initialData={currentFacility}
                                onSubmit={handleFacilitySubmit}
                                onCancel={resetForm}
                                title={isEditing ? t('form.editClinic') : t('form.newClinic')}
                            />
                        </Card>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {clinics.map(c => (
                            <Card
                                key={c.id}
                                className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer"
                                onClick={() => navigate(`/clinic/${c.id}`)}
                            >
                                <div className="p-5" title={t('action.viewPublic')}>
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
                                                    {c.is_verified ? t('verified') : t('pending')}
                                                </Badge>
                                                <span className="hidden sm:inline">•</span>
                                                <span className="truncate">{c.contact_phone || 'No phone'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-800 flex justify-between items-center" onClick={e => e.stopPropagation()}>
                                    <div className="text-xs text-gray-400 hidden sm:block">ID: {c.id.slice(0, 8)}...</div>
                                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                                        <Link to={`/clinic/${c.id}`} target="_blank">
                                            <Button size="sm" variant="ghost" className="text-gray-500 hover:text-primary-600"><ExternalLink size={14} /></Button>
                                        </Link>
                                        <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={() => {
                                            setActiveTab('doctors');
                                            setDoctorForm({ ...defaultDoctor });
                                            setSelectedClinicIds([c.id]);
                                            setShowForm(true);
                                        }}>
                                            <UserPlus size={14} /> {t('action.addDoctor')}
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => {
                                            setCurrentFacility(c);
                                            setIsEditing(true);
                                            setEditId(c.id);
                                            setShowForm(true);
                                            window.scrollTo(0, 0);
                                        }}>
                                            <Pencil size={14} className="mr-1" /> {t('action.edit')}
                                        </Button>
                                        <Button size="sm" variant="danger" onClick={() => handleDelete('clinics', c.id, c.logo_url)}>
                                            <Trash2 size={14} />
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
                            <div className="flex justify-between items-center mb-4 border-b dark:border-gray-800 pb-2">
                                <h3 className="text-lg font-bold">{isEditing ? t('form.editDoctor') : t('form.newDoctor')}</h3>
                                <Button variant="ghost" size="sm" onClick={resetForm}><X /></Button>
                            </div>

                            {!isEditing && (
                                <div className="flex gap-4 mb-6">
                                    <button
                                        type="button"
                                        onClick={() => setAddDoctorMode('new')}
                                        className={`flex-1 py-3 rounded-lg font-bold border-2 transition-all ${addDoctorMode === 'new' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 dark:border-gray-700'}`}
                                    >
                                        {lang === 'en' ? 'Create New Profile' : 'إنشاء ملف جديد'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAddDoctorMode('existing')}
                                        className={`flex-1 py-3 rounded-lg font-bold border-2 transition-all ${addDoctorMode === 'existing' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 dark:border-gray-700'}`}
                                    >
                                        {lang === 'en' ? 'Add Existing Doctor' : 'إضافة طبيب موجود'}
                                    </button>
                                </div>
                            )}

                            {addDoctorMode === 'existing' && !isEditing ? (
                                <div className="space-y-6">
                                    {/* 1. Search/Dropdown for Existing Doctor */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">{lang === 'en' ? 'Select Doctor' : 'اختر الطبيب'}</label>
                                        <Select
                                            value={existingDoctorId}
                                            onChange={(e) => {
                                                setExistingDoctorId(e.target.value);
                                                setSelectedClinicIds([]);
                                            }}
                                            options={[
                                                { value: '', label: lang === 'en' ? 'Select a doctor...' : 'اختر طبيباً...' },
                                                ...doctors.map(d => ({ value: d.id, label: lang === 'en' ? d.name_en : d.name_ar }))
                                            ]}
                                        />
                                        <div className="text-xs text-gray-500 mt-1">
                                            {lang === 'en' ? 'Select from your staff members to assign them to another clinic.' : 'اختر من طاقمك لتعيينهم في عيادة أخرى.'}
                                        </div>
                                    </div>

                                    {/* 2. Select Clinics (Multi) */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">{lang === 'en' ? 'Assign to Clinics' : 'تعيين للعيادات'}</label>
                                        <div className="space-y-2 max-h-40 overflow-y-auto border p-2 rounded-lg dark:border-gray-700 bg-white dark:bg-gray-800">
                                            {clinics.map(c => {
                                                const isSelected = selectedClinicIds.includes(c.id);
                                                // Find doctor to check links
                                                const selectedDoc = doctors.find(d => d.id === existingDoctorId);
                                                const isLinked = selectedDoc?.clinics?.some(cl => cl.id === c.id);

                                                return (
                                                    <div
                                                        key={c.id}
                                                        onClick={() => toggleClinicSelection(c.id)}
                                                        className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {isSelected ? <CheckSquare className="w-5 h-5 text-primary-600" /> : <Square className="w-5 h-5 text-gray-400" />}
                                                            <span>{lang === 'en' ? c.name_en : c.name_ar}</span>
                                                        </div>
                                                        {isLinked && (
                                                            <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                                                                {lang === 'en' ? 'Linked' : 'مرتبط'}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <Button onClick={handleLinkExistingDoctor} className="w-full flex justify-center items-center gap-2">
                                        <LinkIcon size={16} /> {t('action.add')}
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleDoctorSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label={t('form.nameEn')} value={doctorForm.name_en} onChange={e => setDoctorForm({ ...doctorForm, name_en: e.target.value })} required dir="ltr" />
                                    <Input label={t('form.nameAr')} value={doctorForm.name_ar} onChange={e => setDoctorForm({ ...doctorForm, name_ar: e.target.value })} required dir="rtl" />

                                    <Input label={t('form.phone')} value={doctorForm.phone || ''} onChange={e => setDoctorForm({ ...doctorForm, phone: e.target.value })} dir="ltr" placeholder="+963..." />

                                    <div className="col-span-1 md:col-span-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">{lang === 'en' ? 'Assign to Clinics' : 'تعيين للعيادات'}</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto border p-3 rounded-lg dark:border-gray-700 bg-white dark:bg-gray-900">
                                            {clinics.map(c => {
                                                const isSelected = selectedClinicIds.includes(c.id);
                                                return (
                                                    <div
                                                        key={c.id}
                                                        onClick={() => toggleClinicSelection(c.id)}
                                                        className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${isSelected ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'}`}
                                                    >
                                                        {isSelected ? <CheckSquare className="w-5 h-5 text-primary-600" /> : <Square className="w-5 h-5 text-gray-400" />}
                                                        <span className="text-sm font-medium">{lang === 'en' ? c.name_en : c.name_ar}</span>
                                                    </div>
                                                );
                                            })}
                                            {clinics.length === 0 && <div className="text-sm text-gray-500 italic p-2">{lang === 'en' ? 'No clinics available' : 'لا توجد عيادات متاحة'}</div>}
                                        </div>
                                    </div>

                                    <div className="col-span-1 md:col-span-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">{t('form.specialties')}</label>
                                        <Select
                                            label=""
                                            value=""
                                            onChange={handleAddSpecialty}
                                            options={[{ value: '', label: t('form.addSpecialty') }, ...specialties.map(s => ({ value: s.id, label: lang === 'en' ? s.name_en : s.name_ar }))]}
                                        />
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {doctorForm.specialty_ids?.map(id => {
                                                const s = specialties.find(sp => sp.id === id);
                                                if (!s) return null;
                                                return (
                                                    <Badge key={id} variant="info" className="flex items-center gap-1 pe-1">
                                                        {lang === 'en' ? s.name_en : s.name_ar}
                                                        <button type="button" onClick={() => handleRemoveSpecialty(id)} className="hover:bg-sky-200 dark:hover:bg-sky-800 rounded-full p-0.5">
                                                            <X size={12} />
                                                        </button>
                                                    </Badge>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="col-span-1 md:col-span-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">{t('form.bio')}</label>
                                        <textarea className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none" rows={3} value={doctorForm.bio || ''} onChange={(e) => setDoctorForm({ ...doctorForm, bio: e.target.value })} />
                                    </div>

                                    <div className="col-span-1 md:col-span-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">{t('form.photo')}</label>
                                        <div className="flex gap-2 items-center">
                                            <input type="file" onChange={handleDoctorFile} disabled={doctorUploading} className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700" />
                                            {doctorUploading && <Spinner />}
                                        </div>
                                    </div>
                                    <div className="col-span-1 md:col-span-2 flex gap-2 pt-4">
                                        <Button type="submit" disabled={doctorUploading} className="flex-1 md:flex-none flex items-center gap-2"><Save size={16} /> {isEditing ? t('form.updateDoctor') : t('form.saveDoctor')}</Button>
                                        <Button type="button" variant="secondary" onClick={resetForm} className="flex-1 md:flex-none">{t('form.cancel')}</Button>
                                    </div>
                                </form>
                            )}
                        </Card>
                    )}

                    {!manageScheduleId && !showForm && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {doctors.map(d => (
                                <Card key={d.id} className="p-4 flex gap-4">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0 flex items-center justify-center text-gray-400 border border-gray-200 dark:border-gray-700">
                                        {d.photo_url ? <img src={d.photo_url} className="w-full h-full object-cover" alt="doctor" /> : <User />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold truncate">{lang === 'en' ? d.name_en : d.name_ar}</h3>
                                        {d.phone && <div className="text-xs text-gray-500 mb-1">{d.phone}</div>}
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
                                                d.specialty_id && (
                                                    <span className="text-xs bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-1.5 py-0.5 rounded">
                                                        {lang === 'en' ? specialties.find(s => s.id === d.specialty_id)?.name_en : specialties.find(s => s.id === d.specialty_id)?.name_ar}
                                                    </span>
                                                )
                                            )}
                                        </div>

                                        <div className="text-xs text-gray-500 mb-2">
                                            {d.clinics && d.clinics.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {d.clinics.map(c => (
                                                        <span key={c.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                                                            {lang === 'en' ? c.name_en : c.name_ar}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span>{lang === 'en' ? 'Unlinked' : 'غير مرتبط'}</span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Button size="sm" variant="outline" onClick={() => {
                                                setDoctorForm(d);
                                                // Map existing linked clinics to selected state
                                                const linkedIds = d.clinics?.map(c => c.id) || [];
                                                setSelectedClinicIds(linkedIds);

                                                setIsEditing(true);
                                                setEditId(d.id);
                                                setShowForm(true);
                                            }}>{t('action.edit')}</Button>
                                            <Button size="sm" variant="secondary" onClick={() => { setManageScheduleId(d.id); fetchSchedules(d.id); }}>{t('action.schedule')}</Button>
                                            <Button size="sm" variant="danger" onClick={() => handleDelete('doctors', d.id, d.photo_url)}><Trash2 size={14} /></Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {doctors.length === 0 && <div className="col-span-full text-center py-8 text-gray-500">{t('form.noDoctors')}</div>}
                        </div>
                    )}

                    {manageScheduleId && (
                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold">{t('schedule.manage')} {doctors.find(d => d.id === manageScheduleId)?.name_en}</h3>
                                <Button variant="secondary" onClick={() => setManageScheduleId(null)}>{t('action.back')}</Button>
                            </div>

                            <form onSubmit={handleAddSchedule} className="flex flex-wrap gap-4 items-end mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                <div className="flex-1 min-w-[150px]">
                                    <label className="text-xs font-bold text-gray-500 block mb-1">{t('schedule.day')}</label>
                                    <Select options={weekDays.map((d, i) => ({ value: i, label: t(`day.${d}`) }))} value={scheduleForm.day_of_week} onChange={e => setScheduleForm({ ...scheduleForm, day_of_week: Number(e.target.value) })} />
                                </div>
                                <div className="flex-1 min-w-[120px]">
                                    <label className="text-xs font-bold text-gray-500 block mb-1">{t('schedule.start')}</label>
                                    <Select options={timeOptions} value={scheduleForm.start_time} onChange={e => setScheduleForm({ ...scheduleForm, start_time: e.target.value })} className="py-2" />
                                </div>
                                <div className="flex-1 min-w-[120px]">
                                    <label className="text-xs font-bold text-gray-500 block mb-1">{t('schedule.end')}</label>
                                    <Select options={timeOptions} value={scheduleForm.end_time} onChange={e => setScheduleForm({ ...scheduleForm, end_time: e.target.value })} className="py-2" />
                                </div>
                                <div className="flex-1 min-w-[100px]">
                                    <label className="text-xs font-bold text-gray-500 block mb-1">{t('schedule.slot')}</label>
                                    <Input type="number" value={scheduleForm.slot_duration} onChange={e => setScheduleForm({ ...scheduleForm, slot_duration: Number(e.target.value) })} className="py-2" />
                                </div>
                                <Button type="submit" className="flex items-center gap-1"><Plus size={16} /> {t('action.add')}</Button>
                            </form>

                            <div className="space-y-2">
                                {schedules.map(s => (
                                    <div key={s.id} className="flex items-center justify-between p-3 border dark:border-gray-800 rounded bg-white dark:bg-gray-950">
                                        <div className="flex gap-4 items-center">
                                            <span className="font-bold w-12">{t(`day.${weekDays[s.day_of_week]}`)}</span>
                                            <span className="text-gray-600 dark:text-gray-300">{s.start_time} - {s.end_time}</span>
                                            <Badge variant="info">{s.slot_duration} {t('schedule.minSlots')}</Badge>
                                        </div>
                                        <Button size="sm" variant="danger" onClick={() => handleDeleteSchedule(s.id)}><Trash2 size={14} /></Button>
                                    </div>
                                ))}
                                {schedules.length === 0 && <div className="text-center text-gray-500 py-4">{t('schedule.noSchedules')}</div>}
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
                            <FacilityForm
                                type={EntityType.PHARMACY}
                                initialData={currentFacility}
                                onSubmit={handleFacilitySubmit}
                                onCancel={resetForm}
                                title={isEditing ? t('form.editPharmacy') : t('form.newPharmacy')}
                            />
                        </Card>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pharmacies.map(p => (
                            <Card
                                key={p.id}
                                className="p-5 flex flex-col cursor-pointer hover:shadow-lg transition-all"
                                onClick={() => navigate(`/pharmacy/${p.id}`)}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                                        <Pill />
                                    </div>
                                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                        <Button size="sm" variant="ghost" onClick={() => {
                                            setCurrentFacility(p);
                                            setIsEditing(true);
                                            setEditId(p.id);
                                            setShowForm(true);
                                        }}>
                                            <Pencil size={14} />
                                        </Button>
                                        <Button size="sm" variant="danger" onClick={() => handleDelete('pharmacies', p.id)}><Trash2 size={14} /></Button>
                                    </div>
                                </div>
                                <h3 className="font-bold text-lg mb-1">{lang === 'en' ? p.name_en : p.name_ar}</h3>
                                <p className="text-sm text-gray-500 mb-4">{lang === 'en' ? p.location_en : p.location_ar}</p>
                                <Link to={`/pharmacy/${p.id}`} target="_blank" className="mt-auto" onClick={e => e.stopPropagation()}>
                                    <Button variant="outline" size="sm" className="w-full">{t('action.viewPublic')}</Button>
                                </Link>
                            </Card>
                        ))}
                        {pharmacies.length === 0 && <div className="col-span-full text-center py-8 text-gray-500">{t('form.noPharmacies')}</div>}
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
                                    <th className="px-6 py-4">{t('table.patient')}</th>
                                    <th className="px-6 py-4">{t('table.doctor')}</th>
                                    <th className="px-6 py-4">{t('table.clinic')}</th>
                                    <th className="px-6 py-4">{t('table.dateTime')}</th>
                                    <th className="px-6 py-4">{t('table.status')}</th>
                                    <th className="px-6 py-4">{t('table.actions')}</th>
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
                                            <div className="text-xs text-gray-500">{new Date(b.booking_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={b.status === 'CONFIRMED' ? 'success' : b.status === 'CANCELLED' ? 'warning' : 'info'}>{t(`status.${b.status}` as any) || b.status}</Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {b.status === 'PENDING' && (
                                                    <>
                                                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleBookingAction(b.id, 'CONFIRMED')} title={t('action.confirm')}><Plus size={14} /></Button>
                                                        <Button size="sm" variant="danger" onClick={() => handleBookingAction(b.id, 'CANCELLED')} title={t('form.cancel')}><X size={14} /></Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {bookings.length === 0 && <div className="p-8 text-center text-gray-500">{t('table.noBookings')}</div>}
                    </div>
                </Card>
            )}

            {/* --- CONFIRMATION MODAL --- */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl p-6 border border-gray-200 dark:border-gray-800">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                                {t('action.delete')} {deleteModal.type === 'doctors' ? (lang === 'en' ? 'Doctor' : 'الطبيب') : ''}
                            </h3>
                            <p className="text-gray-500">
                                {deleteModal.type === 'doctors'
                                    ? (lang === 'en'
                                        ? 'Are you sure you want to delete this doctor? This action cannot be undone and will remove them from all linked clinics.'
                                        : 'هل أنت متأكد من حذف هذا الطبيب؟ لا يمكن التراجع عن هذا الإجراء وسيتم إزالته من جميع العيادات المرتبطة.')
                                    : t('action.confirmDelete')
                                }
                            </p>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <Button variant="ghost" className="flex-1" onClick={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}>
                                {t('form.cancel')}
                            </Button>
                            <Button variant="danger" className="flex-1" onClick={executeDelete}>
                                {t('action.delete')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
