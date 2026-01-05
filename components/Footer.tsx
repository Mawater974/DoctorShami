
import React from 'react';
import { useStore } from '../store';
import { Link } from 'react-router-dom';
import { TRANSLATIONS } from '../constants';
import { Stethoscope, Pill, MapPin, Mail, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
  const { lang } = useStore();
  const t = (key: string) => TRANSLATIONS[key][lang];

  return (
    <footer className="bg-white border-t border-gray-200 dark:bg-gray-950 dark:border-gray-800 pt-16 pb-8">
      <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
              
              {/* Brand Column */}
              <div className="space-y-4">
                  <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary-600 dark:text-primary-500">
                      <span className="text-3xl">🩺</span>
                      {t('appName')}
                  </Link>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                      {t('footerDesc')}
                  </p>
                  <div className="flex gap-4 pt-2">
                      {/* Social Placeholders */}
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-primary-100 text-gray-500 hover:text-primary-600 transition-colors cursor-pointer">
                          <span className="sr-only">Facebook</span>f
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-primary-100 text-gray-500 hover:text-primary-600 transition-colors cursor-pointer">
                          <span className="sr-only">Twitter</span>t
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-primary-100 text-gray-500 hover:text-primary-600 transition-colors cursor-pointer">
                          <span className="sr-only">Instagram</span>i
                      </div>
                  </div>
              </div>

              {/* Quick Links */}
              <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-6">{t('quickLinks')}</h3>
                  <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                      <li><Link to="/" className="hover:text-primary-600 transition-colors">{t('home')}</Link></li>
                      <li><Link to="/clinics" className="hover:text-primary-600 transition-colors">{t('clinics')}</Link></li>
                      <li><Link to="/pharmacies" className="hover:text-primary-600 transition-colors">{t('pharmacies')}</Link></li>
                      <li><Link to="#" className="hover:text-primary-600 transition-colors">{t('contact')}</Link></li>
                  </ul>
              </div>

              {/* Categories */}
              <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-6">{lang === 'en' ? 'Categories' : 'التصنيفات'}</h3>
                  <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                      <li><Link to="/clinics" className="hover:text-primary-600 transition-colors flex items-center gap-2"><Stethoscope className="w-4 h-4"/> {t('clinics')}</Link></li>
                      <li><Link to="/pharmacies" className="hover:text-primary-600 transition-colors flex items-center gap-2"><Pill className="w-4 h-4"/> {t('pharmacies')}</Link></li>
                  </ul>
              </div>

              {/* Contact Info */}
              <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-6">{t('contact')}</h3>
                  <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
                      <li className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-primary-600 mt-0.5" />
                          <span>123 Medical St, Damascus, Syria</span>
                      </li>
                      <li className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-primary-600" />
                          <span dir="ltr">+963 11 123 4567</span>
                      </li>
                      <li className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-primary-600" />
                          <span>info@doctorshami.com</span>
                      </li>
                  </ul>
              </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <p>© {new Date().getFullYear()} DoctorShami. All rights reserved.</p>
              <div className="flex gap-6">
                  <Link to="#" className="hover:text-primary-600 transition-colors">{t('privacy')}</Link>
                  <Link to="#" className="hover:text-primary-600 transition-colors">{t('terms')}</Link>
              </div>
          </div>
      </div>
    </footer>
  );
};
