
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { TRANSLATIONS } from '../constants';
import { dbService } from '../services/supabase';
import { Card, Badge, Button, Select } from '../components/UiComponents';
import { MapPin, BadgeCheck, Search, Filter, X, Stethoscope, Pill, ListFilter } from 'lucide-react';
import { EntityType, Facility } from '../types';

interface DirectoryLayoutProps {
  type: EntityType;
  title: string;
}

export const DirectoryLayout: React.FC<DirectoryLayoutProps> = ({ type, title }) => {
  const { lang, cities, specialties } = useStore(); // Use cached data
  const t = (key: string) => TRANSLATIONS[key] ? TRANSLATIONS[key][lang] : key;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // URL Params
  const queryParam = searchParams.get('q') || '';

  // Local State
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [selectedCity, setSelectedCity] = useState<number | ''>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<number | ''>('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  
  // Data State
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

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
                    specialtyId: selectedSpecialty ? Number(selectedSpecialty) : undefined,
                    verified: verifiedOnly
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

  }, [type, searchTerm, selectedCity, selectedSpecialty, verifiedOnly, lang]);

  const clearFilters = () => {
      setSearchTerm('');
      setSelectedCity('');
      setSelectedSpecialty('');
      setVerifiedOnly(false);
  };

  const navigateToDetail = (id: string) => {
      const path = type === EntityType.CLINIC ? `/clinic/${id}` : `/pharmacy/${id}`;
      navigate(path);
  };

  const FilterSidebar = () => (
      <div className="bg-white dark:bg-gray-950 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-6 h-fit sticky top-24 shadow-sm">
          <div className="flex justify-between items-center pb-2 border-b dark:border-gray-800">
              <h3 className="font-bold text-lg flex items-center gap-2">
                  <ListFilter className="w-5 h-5 text-primary-600" />
                  {t('filters')}
              </h3>
              {(searchTerm || selectedCity || selectedSpecialty || verifiedOnly) && (
                  <button onClick={clearFilters} className="text-xs font-medium text-red-500 hover:text-red-600 hover:underline transition-colors">
                      {t('reset')}
                  </button>
              )}
          </div>

          {/* Verified Toggle */}
          {type === EntityType.CLINIC && (
            <div className="bg-primary-50 dark:bg-primary-900/10 p-4 rounded-xl border border-primary-100 dark:border-primary-800/30">
                <label className="flex items-center justify-between cursor-pointer group select-none">
                    <span className="flex items-center gap-2 font-semibold text-primary-900 dark:text-primary-100 text-sm">
                        <BadgeCheck className="w-5 h-5 text-primary-600" />
                        {t('verifiedOnly')}
                    </span>
                    <div className="relative">
                        <input 
                            type="checkbox" 
                            className="peer sr-only" 
                            checked={verifiedOnly} 
                            onChange={(e) => setVerifiedOnly(e.target.checked)} 
                        />
                        <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </div>
                </label>
            </div>
          )}

          <div className="space-y-4">
            {/* City Filter */}
            <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {t('search.city')}
                </label>
                <Select 
                    value={selectedCity} 
                    onChange={(e) => setSelectedCity(e.target.value === '' ? '' : Number(e.target.value))}
                    options={[
                        { value: '', label: lang === 'en' ? 'All Cities' : 'كل المدن' },
                        ...cities.map(c => ({ value: c.id, label: lang === 'en' ? c.name_en : c.name_ar }))
                    ]} 
                    className="bg-gray-50 dark:bg-gray-900"
                />
            </div>

            {/* Specialty Filter - Only for Clinics */}
            {type === EntityType.CLINIC && (
                <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-gray-400" />
                        {lang === 'en' ? 'Specialty' : 'التخصص'} 
                    </label>
                    <Select 
                        value={selectedSpecialty} 
                        onChange={(e) => setSelectedSpecialty(e.target.value === '' ? '' : Number(e.target.value))}
                        options={[
                            { value: '', label: lang === 'en' ? 'All Specialties' : 'كل التخصصات' },
                            ...specialties.map(s => ({ value: s.id, label: lang === 'en' ? s.name_en : s.name_ar }))
                        ]} 
                        className="bg-gray-50 dark:bg-gray-900"
                    />
                </div>
            )}
          </div>
      </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{title}</h1>
            <p className="text-gray-500 text-lg">
                {type === EntityType.CLINIC 
                    ? (lang === 'en' ? "Find the best doctors and clinics near you" : "ابحث عن أفضل الأطباء والعيادات بالقرب منك")
                    : (lang === 'en' ? "Find pharmacies and medicine availability" : "ابحث عن الصيدليات وتوفر الأدوية")
                }
            </p>
        </div>
      </div>

      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-6 sticky top-20 z-30">
          <Button variant="outline" className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-900 shadow-sm" onClick={() => setShowMobileFilter(true)}>
              <Filter className="w-4 h-4" /> {lang === 'en' ? 'Filters & Search' : 'تصفية وبحث'}
              {(selectedCity || selectedSpecialty || verifiedOnly) && (
                  <Badge variant="blue" className="ml-1 px-1.5 py-0.5 text-[10px] h-5 min-w-[20px] justify-center">!</Badge>
              )}
          </Button>
      </div>

      {/* Mobile Sidebar Modal */}
      {showMobileFilter && (
          <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm lg:hidden animate-in fade-in" onClick={() => setShowMobileFilter(false)}>
              <div className="absolute inset-y-0 start-0 w-[85%] max-w-sm bg-white dark:bg-gray-950 p-5 shadow-2xl overflow-y-auto animate-in slide-in-from-start duration-300" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-8">
                      <h2 className="font-bold text-2xl">{t('filters')}</h2>
                      <button onClick={() => setShowMobileFilter(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X /></button>
                  </div>
                  <FilterSidebar />
                  <Button className="w-full mt-8 py-3 text-lg shadow-lg shadow-primary-500/20" onClick={() => setShowMobileFilter(false)}>
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
            
            {/* Search Bar - Main Area */}
            <div className="relative group">
                <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                <input 
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    className="w-full ps-12 pe-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 focus:border-primary-500 outline-none transition-all shadow-sm text-lg"
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
                        className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-gray-200 dark:border-gray-800 cursor-pointer overflow-hidden rounded-2xl"
                        onClick={() => navigateToDetail(facility.id)}
                    >
                        <div className="relative h-52 overflow-hidden bg-gray-100 dark:bg-gray-900">
                            {facility.image ? (
                                <img 
                                    src={facility.image} 
                                    alt={facility.name} 
                                    loading="lazy"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 group-hover:scale-105 transition-transform duration-700 bg-gray-50 dark:bg-gray-800">
                                    {facility.type === EntityType.CLINIC ? (
                                        <Stethoscope className="w-16 h-16 opacity-30" />
                                    ) : (
                                        <Pill className="w-16 h-16 opacity-30" />
                                    )}
                                </div>
                            )}
                            <div className="absolute top-4 start-4 flex flex-col gap-2">
                                <Badge variant={facility.type === EntityType.CLINIC ? 'blue' : 'success'} className="shadow-sm backdrop-blur-md bg-opacity-90">
                                    {facility.type === EntityType.CLINIC ? t('clinics') : t('pharmacies')}
                                </Badge>
                                {facility.is_verified && (
                                    <div className="bg-white/90 dark:bg-black/60 backdrop-blur text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm w-fit">
                                        <BadgeCheck className="w-3 h-3 fill-blue-600 text-white dark:text-black" /> 
                                        {t('verified')}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="mb-3">
                                <h3 className="text-xl font-bold truncate group-hover:text-primary-600 transition-colors mb-1">
                                    {facility.name}
                                </h3>
                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                    <MapPin className="w-3.5 h-3.5 me-1.5 text-gray-400" />
                                    <span className="truncate">{facility.city_name}, {facility.address}</span>
                                </div>
                            </div>
                            
                            <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-6 h-10 leading-relaxed">
                                {facility.description || (lang === 'en' ? 'No description available.' : 'لا يوجد وصف متاح.')}
                            </p>

                            <Button 
                                className="w-full group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600 transition-all duration-300" 
                                variant="outline"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigateToDetail(facility.id);
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
                <div className="text-center py-24 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                    <div className="mx-auto w-20 h-20 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center mb-6 text-gray-400 shadow-sm">
                        <Search className="w-10 h-10 opacity-50" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {lang === 'en' ? "No results found" : "لا توجد نتائج"}
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-8">
                        {lang === 'en' ? "We couldn't find any facilities matching your filters. Try adjusting your search criteria." : "لم نتمكن من العثور على أي منشآت تطابق معاييرك. حاول تعديل معايير البحث."}
                    </p>
                    <Button onClick={clearFilters} variant="secondary" className="px-8">
                        {lang === 'en' ? "Clear all filters" : "مسح كل التصفيات"}
                    </Button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
