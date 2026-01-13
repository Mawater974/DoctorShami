
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
  
  // Filter Section
  filters: { en: "Filters", ar: "تصفية" },
  reset: { en: "Reset", ar: "إعادة تعيين" },
  verifiedOnly: { en: "Verified Only", ar: "الموثقة فقط" },
  
  // Dashboard Specific
  'dashboard.title': { en: "Dashboard", ar: "لوحة التحكم" },
  'dashboard.myClinics': { en: "My Clinics", ar: "عيادتي" },
  'dashboard.myPharmacies': { en: "My Pharmacies", ar: "صيدلياتي" },
  'form.nameEn': { en: "Name (English)", ar: "الاسم (إنجليزي)" },
  'form.nameAr': { en: "Name (Arabic)", ar: "الاسم (عربي)" },
  'form.uploadLogo': { en: "Upload Logo/Photo", ar: "رفع الشعار/الصورة" },
  'search.city': { en: "City", ar: "المدينة" },

  // Provider Dashboard Translations
  'provider.subtitle': { en: "Manage your medical facilities", ar: "إدارة منشآتك الطبية" },
  'provider.analytics': { en: "Analytics", ar: "التحليلات" },
  'provider.doctors': { en: "Doctors", ar: "الأطباء" },
  'provider.bookings': { en: "Bookings", ar: "الحجوزات" },
  'provider.addNew': { en: "Add New", ar: "إضافة جديد" },
  'provider.analytics.last7': { en: "Bookings (Last 7 Days)", ar: "الحجوزات (آخر 7 أيام)" },
  'provider.analytics.byDoctor': { en: "Bookings by Doctor", ar: "الحجوزات حسب الطبيب" },

  // Forms & Actions
  'form.editClinic': { en: "Edit Clinic", ar: "تعديل العيادة" },
  'form.newClinic': { en: "New Clinic", ar: "عيادة جديدة" },
  'form.openingHours': { en: "Opening Hours", ar: "ساعات العمل" },
  'form.copyMon': { en: "Copy Mon to All", ar: "نسخ الاثنين للكل" },
  'form.to': { en: "to", ar: "إلى" },
  'form.closed': { en: "Closed", ar: "مغلق" },
  'form.update': { en: "Update", ar: "تحديث" },
  'form.create': { en: "Create", ar: "إنشاء" },
  'form.cancel': { en: "Cancel", ar: "إلغاء" },
  'form.save': { en: "Save", ar: "حفظ" },
  'form.descriptionEn': { en: "Description (English)", ar: "الوصف (إنجليزي)" },
  'form.descriptionAr': { en: "Description (Arabic)", ar: "الوصف (عربي)" },
  'form.phone': { en: "Phone", ar: "الهاتف" },
  'form.locationEn': { en: "Location (English)", ar: "الموقع (إنجليزي)" },
  'form.locationAr': { en: "Location (Arabic)", ar: "الموقع (عربي)" },

  'action.viewPublic': { en: "View Public Page", ar: "عرض الصفحة العامة" },
  'action.addDoctor': { en: "Add Doctor", ar: "إضافة طبيب" },
  'action.edit': { en: "Edit", ar: "تعديل" },
  'action.delete': { en: "Delete", ar: "حذف" },
  'action.confirmDelete': { en: "Are you sure you want to delete this item? This action cannot be undone.", ar: "هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء." },
  'action.schedule': { en: "Schedule", ar: "الجدول" },
  'action.back': { en: "Back", ar: "رجوع" },
  'action.add': { en: "Add", ar: "إضافة" },

  // Doctor Form
  'form.editDoctor': { en: "Edit Doctor", ar: "تعديل الطبيب" },
  'form.newDoctor': { en: "New Doctor", ar: "طبيب جديد" },
  'form.selectClinic': { en: "Select Clinic", ar: "اختر العيادة" },
  'form.specialties': { en: "Specialties", ar: "التخصصات" },
  'form.addSpecialty': { en: "Add Specialty...", ar: "أضف تخصص..." },
  'form.bio': { en: "Bio", ar: "نبذة" },
  'form.photo': { en: "Photo", ar: "الصورة" },
  'form.updateDoctor': { en: "Update Doctor", ar: "تحديث الطبيب" },
  'form.saveDoctor': { en: "Save Doctor", ar: "حفظ الطبيب" },
  'form.noDoctors': { en: "No doctors added yet.", ar: "لم يتم إضافة أطباء بعد." },
  
  // Schedule
  'schedule.manage': { en: "Manage Schedule for", ar: "إدارة جدول" },
  'schedule.day': { en: "Day", ar: "اليوم" },
  'schedule.start': { en: "Start", ar: "البداية" },
  'schedule.end': { en: "End", ar: "النهاية" },
  'schedule.slot': { en: "Slot (min)", ar: "المدة (دقيقة)" },
  'schedule.minSlots': { en: "min slots", ar: "دقيقة/موعد" },
  'schedule.noSchedules': { en: "No schedules added yet.", ar: "لا توجد جداول مضافة." },

  // Pharmacy Form
  'form.editPharmacy': { en: "Edit Pharmacy", ar: "تعديل الصيدلية" },
  'form.newPharmacy': { en: "New Pharmacy", ar: "صيدلية جديدة" },
  'form.noPharmacies': { en: "No pharmacies added yet.", ar: "لم يتم إضافة صيدليات بعد." },

  // Bookings Table
  'table.patient': { en: "Patient", ar: "المريض" },
  'table.doctor': { en: "Doctor", ar: "الطبيب" },
  'table.clinic': { en: "Clinic", ar: "العيادة" },
  'table.dateTime': { en: "Date/Time", ar: "التاريخ/الوقت" },
  'table.status': { en: "Status", ar: "الحالة" },
  'table.actions': { en: "Actions", ar: "إجراءات" },
  'table.noBookings': { en: "No bookings found.", ar: "لا توجد حجوزات." },

  // Days
  'day.Mon': { en: "Mon", ar: "الاثنين" },
  'day.Tue': { en: "Tue", ar: "الثلاثاء" },
  'day.Wed': { en: "Wed", ar: "الأربعاء" },
  'day.Thu': { en: "Thu", ar: "الخميس" },
  'day.Fri': { en: "Fri", ar: "الجمعة" },
  'day.Sat': { en: "Sat", ar: "السبت" },
  'day.Sun': { en: "Sun", ar: "الأحد" },

  // Patient Appointments Page
  'appt.empty': { en: "No appointments yet", ar: "لا توجد مواعيد بعد" },
  'appt.emptyDesc': { en: "You haven't booked any appointments. Find a doctor or clinic to get started.", ar: "لم تقم بحجز أي مواعيد. ابحث عن طبيب أو عيادة للبدء." },
  'appt.general': { en: "General Appointment", ar: "موعد عام" },
  'appt.cancelConfirm': { en: "Are you sure you want to cancel this appointment?", ar: "هل أنت متأكد من إلغاء هذا الموعد؟" },
  'appt.cancel': { en: "Cancel", ar: "إلغاء الموعد" },

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
