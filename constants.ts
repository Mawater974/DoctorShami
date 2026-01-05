import { Translation } from './types';

// Supabase Config
export const SUPABASE_URL = "https://tlosaykqicbgxsxxhwat.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsb3NheWtxaWNiZ3hzeHhod2F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NzcyNjQsImV4cCI6MjA4MzE1MzI2NH0.sTRZicTONYJU-ULje7wtMwf_MeCVyX2-luOvgZ9zh3I";
export const STORAGE_BUCKET = "docotrshami";

export const TRANSLATIONS: Translation = {
  appName: { en: "DoctorShami", ar: "دكتور شامي" },
  home: { en: "Home", ar: "الرئيسية" },
  directory: { en: "Directory", ar: "الدليل" },
  about: { en: "About Us", ar: "من نحن" },
  clinics: { en: "Clinics", ar: "العيادات" },
  pharmacies: { en: "Pharmacies", ar: "الصيدليات" },
  login: { en: "Sign In", ar: "تسجيل الدخول" },
  signup: { en: "Sign Up", ar: "إنشاء حساب" },
  logout: { en: "Logout", ar: "تسجيل الخروج" },
  dashboard: { en: "Dashboard", ar: "لوحة التحكم" },
  appointments: { en: "Appointments", ar: "المواعيد" },
  settings: { en: "Settings", ar: "الإعدادات" },
  profile: { en: "My Profile", ar: "ملفي الشخصي" },
  searchPlaceholder: { en: "Search for doctors, clinics, or pharmacies...", ar: "ابحث عن أطباء، عيادات، أو صيدليات..." },
  findCare: { en: "Find the best healthcare in your city", ar: "اعثر على أفضل رعاية صحية في مدينتك" },
  verified: { en: "Verified", ar: "موثق" },
  details: { en: "Details", ar: "التفاصيل" },
  bookNow: { en: "Book Appointment", ar: "احجز موعد" },
  contact: { en: "Contact Us", ar: "تواصل معنا" },
  adminPanel: { en: "Admin Panel", ar: "لوحة الإدارة" },
  providerPanel: { en: "Provider Portal", ar: "بوابة مقدمي الخدمة" },
  welcome: { en: "Welcome back,", ar: "مرحباً بعودتك،" },
  uploadImage: { en: "Upload Image", ar: "رفع صورة" },
  saveChanges: { en: "Save Changes", ar: "حفظ التغييرات" },
  status: { en: "Status", ar: "الحالة" },
  pending: { en: "Pending", ar: "قيد الانتظار" },
  totalUsers: { en: "Total Users", ar: "إجمالي المستخدمين" },
  totalClinics: { en: "Total Clinics", ar: "إجمالي العيادات" },
  recentActivity: { en: "Recent Activity", ar: "النشاط الأخير" },
  uploading: { en: "Uploading...", ar: "جاري الرفع..." },
  success: { en: "Success", ar: "تم بنجاح" },
  error: { en: "Error", ar: "خطأ" },
  
  // Dashboard Specific
  'dashboard.title': { en: "Dashboard", ar: "لوحة التحكم" },
  'dashboard.myClinics': { en: "My Clinics", ar: "عيادتي" },
  'dashboard.myPharmacies': { en: "My Pharmacies", ar: "صيدلياتي" },
  'form.nameEn': { en: "Name (English)", ar: "الاسم (إنجليزي)" },
  'form.nameAr': { en: "Name (Arabic)", ar: "الاسم (عربي)" },
  'form.uploadLogo': { en: "Upload Logo/Photo", ar: "رفع الشعار/الصورة" },
  'search.city': { en: "City", ar: "المدينة" },

  // Footer & Legal
  quickLinks: { en: "Quick Links", ar: "روابط سريعة" },
  legal: { en: "Legal", ar: "قانوني" },
  privacy: { en: "Privacy Policy", ar: "سياسة الخصوصية" },
  terms: { en: "Terms of Service", ar: "شروط الخدمة" },
  newsletter: { en: "Newsletter", ar: "النشرة البريدية" },
  subscribe: { en: "Subscribe", ar: "اشترك" },
  footerDesc: { en: "Connecting patients with trusted healthcare providers across the region.", ar: "نربط المرضى بمقدمي الرعاية الصحية الموثوقين في جميع أنحاء المنطقة." },
  
  // Auth Extra
  phone: { en: "Phone Number", ar: "رقم الهاتف" },
  passReq: { en: "Min 6 characters", ar: "6 أحرف على الأقل" },

  // Registration Modal
  registerFacility: { en: "Register Facility", ar: "تسجيل منشأة" },
  regTitle: { en: "Join DoctorShami Network", ar: "انضم لشبكة دكتور شامي" },
  regDesc: { en: "Register your clinic or pharmacy to reach more patients.", ar: "سجل عيادتك أو صيدليتك للوصول إلى المزيد من المرضى." },
  facilityName: { en: "Facility Name", ar: "اسم المنشأة" },
  facilityType: { en: "Facility Type", ar: "نوع المنشأة" },
  city: { en: "City", ar: "المدينة" },
  address: { en: "Address", ar: "العنوان" },
  create: { en: "Create", ar: "إنشاء" },
  cancel: { en: "Cancel", ar: "إلغاء" },
  selectType: { en: "Select Type", ar: "اختر النوع" },
  nameEn: { en: "Name (English)", ar: "الاسم (إنجليزي)" },
  nameAr: { en: "Name (Arabic)", ar: "الاسم (عربي)" },
  locationEn: { en: "Location (English)", ar: "الموقع (إنجليزي)" },
  locationAr: { en: "Location (Arabic)", ar: "الموقع (عربي)" },
  descEn: { en: "Description (English)", ar: "الوصف (إنجليزي)" },
  descAr: { en: "Description (Arabic)", ar: "الوصف (عربي)" },
};