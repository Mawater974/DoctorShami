
import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../store';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { TRANSLATIONS } from '../constants';
import { Role } from '../types';
import { 
    Sun, Moon, Languages, Menu, X, 
    LogOut, LayoutDashboard, ChevronDown, 
    Settings, Calendar, PlusCircle, MessageSquare
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { theme, lang, toggleTheme, setLanguage, user, logout } = useStore();
  
  // Safe translation helper to prevent crashes
  const t = (key: string) => {
    if (!TRANSLATIONS[key]) {
        console.warn(`Missing translation for key: ${key}`);
        return key;
    }
    return TRANSLATIONS[key][lang];
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile menu and dropdown on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserDropdownOpen(false);
  }, [location]);

  // Click outside listener for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return null;
    if (user.role === Role.ADMIN) return '/admin';
    if (user.role === Role.PROVIDER) return '/provider';
    // Default to provider (which handles registration) for patients or undefined roles
    return '/register-facility'; 
  };

  const getDashboardLabel = () => {
    if (!user) return '';
    if (user.role === Role.ADMIN) return t('adminPanel');
    if (user.role === Role.PROVIDER) return t('providerPanel');
    return t('registerFacility');
  };

  const isPatient = user && user.role === Role.PATIENT;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur dark:bg-gray-950/95 dark:border-gray-800 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary-600 dark:text-primary-500">
            <span className="text-3xl">🩺</span>
            <span className="hidden sm:block">{t('appName')}</span>
          </Link>

          {/* Desktop Pages Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link to="/" className={`hover:text-primary-600 dark:hover:text-primary-400 transition-colors ${location.pathname === '/' ? 'text-primary-600' : ''}`}>
              {t('home')}
            </Link>
            <Link to="/clinics" className={`hover:text-primary-600 dark:hover:text-primary-400 transition-colors ${location.pathname === '/clinics' ? 'text-primary-600' : ''}`}>
              {t('clinics')}
            </Link>
            <Link to="/pharmacies" className={`hover:text-primary-600 dark:hover:text-primary-400 transition-colors ${location.pathname === '/pharmacies' ? 'text-primary-600' : ''}`}>
              {t('pharmacies')}
            </Link>
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            
            {/* Action Buttons */}
            {isPatient && (
              <Link 
                to="/register-facility"
                className="flex items-center gap-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-4 py-2 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors text-sm font-medium border border-primary-100 dark:border-primary-800"
              >
                <PlusCircle className="w-4 h-4" />
                {t('registerFacility')}
              </Link>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setLanguage(lang === 'en' ? 'ar' : 'en')}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1 font-bold text-gray-600 dark:text-gray-400"
              aria-label="Toggle language"
            >
              <Languages className="w-5 h-5" />
              <span className="text-xs">{lang === 'en' ? 'AR' : 'EN'}</span>
            </button>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center gap-2 border px-3 py-1.5 rounded-full border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-300 font-bold">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium truncate max-w-[100px]">{user.name.split(' ')[0]}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Dropdown Menu */}
                {isUserDropdownOpen && (
                    <div className="absolute end-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden py-1 z-50">
                        <div className="px-4 py-3 border-b dark:border-gray-800">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        
                        {isPatient ? (
                           <Link 
                              to="/register-facility"
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                              onClick={() => setIsUserDropdownOpen(false)}
                           >
                              <PlusCircle className="w-4 h-4" />
                              {t('registerFacility')}
                           </Link>
                        ) : (
                          <Link 
                              to={getDashboardLink()!} 
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                              onClick={() => setIsUserDropdownOpen(false)}
                          >
                              <LayoutDashboard className="w-4 h-4" />
                              {getDashboardLabel()}
                          </Link>
                        )}
                        
                        <Link 
                            to="/messages" 
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={() => setIsUserDropdownOpen(false)}
                        >
                             <MessageSquare className="w-4 h-4" />
                             {lang === 'en' ? 'Messages' : 'الرسائل'}
                        </Link>
                        
                        <Link 
                            to="/appointments" 
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={() => setIsUserDropdownOpen(false)}
                        >
                             <Calendar className="w-4 h-4" />
                             {t('appointments')}
                        </Link>
                         <Link 
                             to="/settings" 
                             className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                             onClick={() => setIsUserDropdownOpen(false)}
                        >
                             <Settings className="w-4 h-4" />
                             {t('settings')}
                        </Link>
                        
                        <div className="border-t dark:border-gray-800 mt-1">
                             <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10">
                                <LogOut className="w-4 h-4" />
                                {t('logout')}
                            </button>
                        </div>
                    </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="bg-primary-600 text-white px-5 py-2 rounded-full hover:bg-primary-700 transition-colors text-sm font-medium shadow-md shadow-primary-600/20"
              >
                {t('login')}
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-gray-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav Drawer */}
        {isMenuOpen && (
          <div className="md:hidden border-t dark:border-gray-800 p-4 bg-white dark:bg-gray-950 space-y-4 animate-in slide-in-from-top-2">
            <Link to="/" className="block py-2 text-sm font-medium hover:text-primary-600">{t('home')}</Link>
            <Link to="/clinics" className="block py-2 text-sm font-medium hover:text-primary-600">{t('clinics')}</Link>
            <Link to="/pharmacies" className="block py-2 text-sm font-medium hover:text-primary-600">{t('pharmacies')}</Link>
            
             {user && (
               isPatient ? (
                  <Link 
                    to="/register-facility"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex w-full items-center gap-2 py-2 text-sm font-medium text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-2 rounded"
                  >
                    <PlusCircle className="w-4 h-4" />
                    {t('registerFacility')}
                  </Link>
               ) : (
                <Link to={getDashboardLink()!} className="block py-2 text-sm font-medium text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-2 rounded">
                  {getDashboardLabel()}
                </Link>
               )
            )}
            
            <div className="flex items-center justify-between pt-4 border-t dark:border-gray-800">
               <button onClick={toggleTheme} className="flex items-center gap-2 text-sm">
                  {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  Theme
               </button>
               <button onClick={() => setLanguage(lang === 'en' ? 'ar' : 'en')} className="flex items-center gap-2 text-sm">
                  <Languages className="w-4 h-4" />
                  {lang === 'en' ? 'Arabic' : 'English'}
               </button>
            </div>
             {user ? (
              <div className="pt-4 border-t dark:border-gray-800 space-y-2">
                <p className="text-xs text-gray-500 px-2">{user.email}</p>
                
                <Link to="/messages" className="block px-2 py-2 text-sm hover:bg-gray-100 rounded">{lang === 'en' ? 'Messages' : 'الرسائل'}</Link>
                <Link to="/appointments" className="block px-2 py-2 text-sm hover:bg-gray-100 rounded">{t('appointments')}</Link>
                <Link to="/settings" className="block px-2 py-2 text-sm hover:bg-gray-100 rounded">{t('settings')}</Link>
                <button onClick={handleLogout} className="w-full text-start px-2 py-2 text-red-600 text-sm font-medium">
                    {t('logout')}
                </button>
              </div>
            ) : (
              <Link to="/auth" className="block w-full text-center mt-4 bg-primary-600 text-white py-2 rounded-lg text-sm font-medium">
                {t('login')}
              </Link>
            )}
          </div>
        )}
      </header>
    </>
  );
};
