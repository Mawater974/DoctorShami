
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { TRANSLATIONS } from '../constants';
import { Search, MapPin, Stethoscope, Pill } from 'lucide-react';
import { Button } from '../components/UiComponents';

export const Home: React.FC = () => {
  const { lang } = useStore();
  const t = (key: string) => TRANSLATIONS[key][lang];
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/clinics?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-950 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-8 pb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400 leading-tight">
            {t('findCare')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
            {lang === 'en' 
              ? "Connect with top-rated clinics and pharmacies in your area. Trusted healthcare at your fingertips."
              : "تواصل مع أفضل العيادات والصيدليات في منطقتك. رعاية صحية موثوقة في متناول يدك."}
          </p>

          <form onSubmit={handleSearch} className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center px-4 py-2 border-b md:border-b-0 md:border-e border-gray-100 dark:border-gray-700">
              <Search className="w-5 h-5 text-gray-400 me-3" />
              <input 
                type="text" 
                placeholder={t('searchPlaceholder')} 
                className="w-full bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex-1 flex items-center px-4 py-2">
              <MapPin className="w-5 h-5 text-gray-400 me-3" />
              <input 
                type="text" 
                placeholder={lang === 'en' ? "City or Neighborhood" : "المدينة أو الحي"}
                className="w-full bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
              />
            </div>
            <Button type="submit" className="md:w-auto w-full md:rounded-xl">
              {lang === 'en' ? "Search" : "بحث"}
            </Button>
          </form>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div 
              onClick={() => navigate('/clinics')}
              className="group cursor-pointer p-8 rounded-2xl bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all border border-blue-100 dark:border-blue-900/30 flex items-start gap-6"
            >
              <div className="p-4 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
                <Stethoscope className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('clinics')}</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {lang === 'en' ? "Find specialized doctors and clinics nearby." : "ابحث عن أطباء متخصصين وعيادات قريبة."}
                </p>
              </div>
            </div>

            <div 
              onClick={() => navigate('/pharmacies')}
              className="group cursor-pointer p-8 rounded-2xl bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20 transition-all border border-green-100 dark:border-green-900/30 flex items-start gap-6"
            >
              <div className="p-4 bg-green-600 rounded-xl text-white shadow-lg shadow-green-600/20 group-hover:scale-110 transition-transform">
                <Pill className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('pharmacies')}</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {lang === 'en' ? "Locate pharmacies and check medicine availability." : "حدد مواقع الصيدليات وتحقق من توفر الأدوية."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
