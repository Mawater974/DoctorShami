
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { TRANSLATIONS } from '../constants';
import { dbService, messagingService } from '../services/supabase';
import { Button, Badge, Card } from '../components/UiComponents';
import { BookingModal } from '../components/BookingModal';
import { ReviewsSection } from '../components/ReviewsSection';
import { MapPin, Phone, BadgeCheck, Calendar, Share2, AlertCircle, Stethoscope, Pill, Check, MessageSquare, User as UserIcon, ExternalLink } from 'lucide-react';
import { Facility, EntityType, Doctor } from '../types';

export const Details: React.FC = () => {
  const { id } = useParams();
  const { lang, user, specialties } = useStore();
  const t = (key: string) => TRANSLATIONS[key] ? TRANSLATIONS[key][lang] : key;
  const navigate = useNavigate();

  const [facility, setFacility] = useState<Facility | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const data = await dbService.getFacilityById(id, lang);
        setFacility(data);

        if (data && data.type === EntityType.CLINIC) {
          const docs = await dbService.getDoctorsByClinicId(id);
          setDoctors(docs);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, lang]);

  const handleBookClick = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setIsBookingModalOpen(true);
  };

  const handleMessageClick = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!facility?.owner_id) return;

    setStartingChat(true);
    try {
      const convId = await messagingService.startConversation(user.id, facility.owner_id);
      navigate(`/messages?cid=${convId}`);
    } catch (e) {
      console.error(e);
      alert(lang === 'en' ? 'Could not start chat' : 'تعذر بدء المحادثة');
    } finally {
      setStartingChat(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: facility?.name || 'DoctorShami',
          text: `Check out ${facility?.name} on DoctorShami`,
          url: url
        });
      } catch (err) {
        console.log('Share failed', err);
      }
    } else {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const getSpecialtyName = (id: number) => {
    const s = specialties.find(sp => sp.id === id);
    return s ? (lang === 'en' ? s.name_en : s.name_ar) : '';
  };

  if (loading) return <div className="p-20 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div></div>;

  if (!facility) {
    return <div className="p-10 text-center">{lang === 'en' ? 'Facility not found' : 'المنشأة غير موجودة'}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Image */}
      <div className="relative h-[300px] md:h-[400px] rounded-2xl overflow-hidden mb-8 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        {facility.image ? (
          <img
            src={facility.image}
            alt={facility.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-700">
            {facility.type === EntityType.CLINIC ? (
              <Stethoscope className="w-32 h-32" />
            ) : (
              <Pill className="w-32 h-32" />
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-8">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={facility.type === 'CLINIC' ? 'blue' : 'success'}>
                {facility.type === 'CLINIC' ? t('clinics') : t('pharmacies')}
              </Badge>
              {facility.is_verified && (
                <span className="bg-blue-500/20 backdrop-blur border border-blue-400/50 text-blue-100 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3" /> {t('verified')}
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-2">
              {facility.name}
            </h1>
            <div className="flex items-center gap-2 text-gray-200">
              <MapPin className="w-4 h-4" />
              {facility.city_name}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">{lang === 'en' ? 'About' : 'نبذة عن'}</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg whitespace-pre-wrap">
              {facility.description || (lang === 'en' ? 'No description available.' : 'لا يوجد وصف متاح.')}
            </p>
          </section>

          {/* DOCTORS SECTION - Only for Clinics */}
          {facility.type === EntityType.CLINIC && doctors.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">{lang === 'en' ? 'Our Doctors' : 'طاقم الأطباء'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctors.map(d => (
                  <Card key={d.id} className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0 flex items-center justify-center text-gray-400 border border-gray-200 dark:border-gray-700">
                      {d.photo_url ? <img src={d.photo_url} className="w-full h-full object-cover" alt="doctor" /> : <UserIcon className="w-8 h-8" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{lang === 'en' ? d.name_en : d.name_ar}</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(d.specialty_ids && d.specialty_ids.length > 0 ? d.specialty_ids : (d.specialty_id ? [d.specialty_id] : [])).map(sid => (
                          <Badge key={sid} variant="info" className="text-xs">
                            {getSpecialtyName(sid)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {facility.services && facility.services.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">{lang === 'en' ? 'Services' : 'الخدمات'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {facility.services.map((s, i) => (
                  <Card key={i} className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <span className="font-medium">
                      {s}
                    </span>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-2xl font-bold mb-4">{lang === 'en' ? 'Location' : 'الموقع'}</h2>

            {facility.latitude && facility.longitude ? (
              <div className="h-80 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden shadow-inner border border-gray-200 dark:border-gray-700 relative group">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight={0}
                  marginWidth={0}
                  src={`https://maps.google.com/maps?q=${facility.latitude},${facility.longitude}&z=15&output=embed`}
                  className="w-full h-full"
                  title="Facility Location"
                ></iframe>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${facility.latitude},${facility.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-4 right-4 bg-white dark:bg-gray-900 text-primary-600 px-4 py-2 rounded-lg shadow-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 opacity-90 hover:opacity-100"
                >
                  <ExternalLink className="w-4 h-4" />
                  {lang === 'en' ? 'Open in Google Maps' : 'فتح في خرائط جوجل'}
                </a>
              </div>
            ) : (
              <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 border border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>{lang === 'en' ? 'Map location not available' : 'موقع الخريطة غير متوفر'}</p>
                  {facility.address && (
                    <p className="mt-2 text-sm text-gray-500">{facility.address}</p>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* REVIEWS SECTION */}
          <section className="pt-8 border-t dark:border-gray-800">
            <ReviewsSection entityId={facility.id} entityType={facility.type} />
          </section>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="p-6 sticky top-24">
            <h3 className="font-bold text-lg mb-4 pb-4 border-b dark:border-gray-800">
              {t('contact')}
            </h3>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">{lang === 'en' ? 'Phone' : 'الهاتف'}</p>
                  <p className="font-medium dir-ltr text-end">{facility.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">{lang === 'en' ? 'Address' : 'العنوان'}</p>
                  <p className="font-medium">{facility.address}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              {facility.type === EntityType.CLINIC && (
                <Button onClick={handleBookClick} className="w-full flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" /> {t('bookNow')}
                </Button>
              )}
              {/* Message Button */}
              {user?.id !== facility.owner_id && (
                <Button onClick={handleMessageClick} variant="secondary" disabled={startingChat} className="w-full flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" /> {lang === 'en' ? 'Message' : 'مراسلة'}
                </Button>
              )}

              <Button variant="outline" onClick={handleShare} className="w-full flex items-center justify-center gap-2">
                {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                {isCopied ? (lang === 'en' ? 'Copied' : 'تم النسخ') : (lang === 'en' ? 'Share' : 'مشاركة')}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {isBookingModalOpen && (
        <BookingModal
          clinicId={facility.id}
          clinicName={facility.name!}
          onClose={() => setIsBookingModalOpen(false)}
          onSuccess={() => {
            setIsBookingModalOpen(false);
            navigate('/appointments');
          }}
        />
      )}
    </div>
  );
};
