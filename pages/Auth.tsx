
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { TRANSLATIONS } from '../constants';
import { Button, Input, Card } from '../components/UiComponents';
import { Role } from '../types';
import { authService } from '../services/supabase';

export const Auth: React.FC = () => {
  const { lang, login } = useStore();
  const t = (key: string) => TRANSLATIONS[key][lang];
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Custom Validation
    if (!isLogin && password.length < 6) {
        setError(t('passReq'));
        setLoading(false);
        return;
    }

    try {
        let response;
        if (isLogin) {
            response = await authService.signIn(email, password);
        } else {
            response = await authService.signUp(email, password, name, phone);
        }
        
        if (response && response.user) {
            // Refetch session to get the full profile/role if needed, or assume defaults
            const session = await authService.getSession();
            if (session && session.user) {
                 const userWithRole = { 
                    id: session.user.id,
                    email: session.user.email!,
                    name: session.user.name,
                    role: session.user.role as Role,
                    phone: session.user.phone
                };
                
                login(userWithRole);
                const userRole = userWithRole.role;
                navigate(userRole === Role.PATIENT ? '/' : (userRole === Role.ADMIN ? '/admin' : '/provider'));
            }
        }
    } catch (err: any) {
        console.error(err);
        setError(err.message || 'Authentication failed');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900 px-4 py-10">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="text-center mb-8">
           <h1 className="text-3xl font-bold text-primary-600 mb-2">DoctorShami</h1>
           <p className="text-gray-500">
             {isLogin 
               ? (lang === 'en' ? 'Sign in to your account' : 'سجل الدخول إلى حسابك') 
               : (lang === 'en' ? 'Create a new account' : 'إنشاء حساب جديد')}
           </p>
        </div>

        {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
            </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <>
                <Input 
                label={lang === 'en' ? 'Full Name' : 'الاسم الكامل'} 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                />
                <Input 
                label={t('phone')} 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+963..."
                required
                />
            </>
          )}
          <Input 
            label={lang === 'en' ? 'Email Address' : 'البريد الإلكتروني'} 
            type="email" 
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div>
            <Input 
                label={lang === 'en' ? 'Password' : 'كلمة المرور'} 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
            />
            {!isLogin && <p className="text-xs text-gray-500 mt-1">{t('passReq')}</p>}
          </div>

          <Button type="submit" className="w-full py-3 mt-4" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? t('login') : t('signup'))}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500">
            {isLogin 
              ? (lang === 'en' ? "Don't have an account? " : "ليس لديك حساب؟ ")
              : (lang === 'en' ? "Already have an account? " : "لديك حساب بالفعل؟ ")}
          </span>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary-600 font-medium hover:underline"
          >
            {isLogin 
              ? (lang === 'en' ? "Sign Up" : "سجل الآن")
              : (lang === 'en' ? "Sign In" : "تسجيل الدخول")}
          </button>
        </div>
      </Card>
    </div>
  );
};