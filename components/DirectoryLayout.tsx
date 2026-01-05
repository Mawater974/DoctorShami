
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { TRANSLATIONS } from '../constants';
import { dbService } from '../services/supabase';
import { Card, Badge, Button, Select } from '../components/UiComponents';
import { MapPin, BadgeCheck, Search, Filter, X, Stethoscope, Pill } from 'lucide-react';
import { EntityType, Facility, City, Specialty } from '../types';

interface DirectoryLayoutProps {
  type: EntityType;
  title: string;
}

export const DirectoryLayout: React.FC<DirectoryLayoutProps> = ({ type, title }) => {
  const { lang } = useStore();
  const t = (key: string) => TRANSLATIONS[key] ? TRANSLATIONS[key][lang] : key;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // URL Params
  const queryParam = searchParams.get('q') || '';

  // Local State
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [selectedCity, setSelectedCity] = useState<number | ''>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<number | ''>('');
  
  // Data State
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Fetch Filters on Mount
  useEffect(() => {
    Promise.all([
        dbService.getCities(),
        dbService.getSpecialties()
    ]).then(([c, s]) => {
        setCities(c);
        setSpecialties(s);
    });
  }, []);

  // Sync URL with State
  useEffect(() => {
      const params: any = {};
      if (searchTerm) params.q = searchTerm;
      setSearchParams(params);
  }, [searchTerm]);

  // Fetch Facilities when filters change
  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await dbService.getFacilities(
                type, 
                searchTerm, 
                lang,
                {
                    cityId: selectedCity ? Number(selectedCity) : undefined,
                    specialtyId: selectedSpecialty ? Number(selectedSpecialty) : undefined
                }
            );
            setFacilities(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    
    // Debounce search slightly
    const timeout = setTimeout(fetchData, 300);
    return () => clearTimeout(timeout);

  }, [type, searchTerm, selectedCity, selectedSpecialty, lang]);

  const clearFilters = () => {
      setSearchTerm('');
      setSelectedCity('');
      setSelectedSpecialty('');
  };

  const FilterSidebar = () => (
      <div className="bg-white dark:bg-gray-950 p-6 rounded-xl border border-gray-200 dark:border-gray-800 space-y-6 h-fit sticky top-24">
          <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  {lang === 'en' ? 'Filters' : 'تصفية'}
              </h3>
              {(searchTerm || selectedCity || selectedSpecialty) && (
                  <button onClick={clearFilters} className="text-xs text-red-500 hover:underline">
                      {lang === 'en' ? 'Reset' : 'إعادة ضبط'}
                  </button>
              )}
          </div>

          {/* City Filter */}
          <div>
               <Select 
                 label={t('search.city')} 
                 value={selectedCity} 
                 onChange={(e) => setSelectedCity(e.target.value === '' ? '' : Number(e.target.value))}
                 options={[
                     { value: '', label: lang === 'en' ? 'All Cities' : 'كل المدن' },
                     ...cities.map(c => ({ value: c.id, label: lang === 'en' ? c.name_en : c.name_ar }))
                 ]} 
               />
          </div>

          {/* Specialty Filter - Only for Clinics */}
          {type === EntityType.CLINIC && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <Select 
                    label={lang === 'en' ? 'Specialty' : 'التخصص'} 
                    value={selectedSpecialty} 
                    onChange={(e) => setSelectedSpecialty(e.target.value === '' ? '' : Number(e.target.value))}
                    options={[
                        { value: '', label: lang === 'en' ? 'All Specialties' : 'كل التخصصات' },
                        ...specialties.map(s => ({ value: s.id, label: lang === 'en' ? s.name_en : s.name_ar }))
                    ]} 
                />
              </div>
          )}
      </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-gray-500">
            {type === EntityType.CLINIC 
                ? (lang === 'en' ? "Find the best doctors and clinics near you" : "ابحث عن أفضل الأطباء والعيادات بالقرب منك")
                : (lang === 'en' ? "Find pharmacies and medicine availability" : "ابحث عن الصيدليات وتوفر الأدوية")
            }
        </p>
      </div>

      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
          <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={() => setShowMobileFilter(true)}>
              <Filter className="w-4 h-4" /> {lang === 'en' ? 'Filters' : 'تصفية النتائج'}
          </Button>
      </div>

      {/* Mobile Sidebar Modal */}
      {showMobileFilter && (
          <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setShowMobileFilter(false)}>
              <div className="absolute inset-y-0 start-0 w-3/4 max-w-xs bg-white dark:bg-gray-950 p-4 shadow-xl overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="font-bold text-xl">{lang === 'en' ? 'Filters' : 'تصفية'}</h2>
                      <button onClick={() => setShowMobileFilter(false)}><X /></button>
                  </div>
                  <FilterSidebar />
                  <Button className="w-full mt-6" onClick={() => setShowMobileFilter(false)}>
                      {lang === 'en' ? 'Show Results' : 'عرض النتائج'}
                  </Button>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:col-span-1">
            <FilterSidebar />
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3 space-y-6">
            
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute start-4 top-3.5 w-5 h-5 text-gray-400" />
                <input 
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    className="w-full ps-12 pe-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Results Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {facilities.map((facility) => (
                    <Card 
                        key={facility.id} 
                        className="group hover:shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-800 cursor-pointer"
                        onClick={() => navigate(`/directory/${facility.id}`)}
                    >
                        <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-900">
                            {facility.image ? (
                                <img 
                                    src={facility.image} 
                                    alt={facility.name} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 group-hover:scale-105 transition-transform duration-500">
                                    {facility.type === EntityType.CLINIC ? (
                                        <Stethoscope className="w-16 h-16 opacity-50" />
                                    ) : (
                                        <Pill className="w-16 h-16 opacity-50" />
                                    )}
                                </div>
                            )}
                        <div className="absolute top-3 start-3">
                            <Badge variant={facility.type === EntityType.CLINIC ? 'blue' : 'success'}>
                                {facility.type === EntityType.CLINIC ? t('clinics') : t('pharmacies')}
                            </Badge>
                        </div>
                        </div>
                        <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-bold truncate pe-2 group-hover:text-primary-600 transition-colors">
                            {facility.name}
                            </h3>
                            {facility.is_verified && (
                            <div className="text-blue-500 flex-shrink-0" title={t('verified')}>
                                <BadgeCheck className="w-5 h-5" />
                            </div>
                            )}
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4 h-10">
                            {facility.description || (lang === 'en' ? 'No description' : 'لا يوجد وصف')}
                        </p>
                        
                        <div className="space-y-2 mb-6">
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <MapPin className="w-4 h-4 me-2 text-gray-400" />
                                <span className="truncate">{facility.city_name}, {facility.address}</span>
                            </div>
                        </div>

                        <Button 
                            className="w-full group-hover:bg-primary-700" 
                            variant="outline"
                            // No onClick needed as parent handles navigation, but we prevent bubbling if user clicks button specifically
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/directory/${facility.id}`);
                            }}
                        >
                            {t('details')}
                        </Button>
                        </div>
                    </Card>
                    ))}
                </div>
            )}

            {!loading && facilities.length === 0 && (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                    <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
                        <Search className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        {lang === 'en' ? "No results found" : "لا توجد نتائج"}
                    </h3>
                    <p className="text-gray-500">
                        {lang === 'en' ? "Try adjusting your filters or search term." : "حاول تعديل معايير التصفية أو كلمة البحث."}
                    </p>
                    <button onClick={clearFilters} className="mt-4 text-primary-600 font-medium hover:underline">
                        {lang === 'en' ? "Clear all filters" : "مسح كل التصفيات"}
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
