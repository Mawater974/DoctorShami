import { Facility, EntityType, Role, User } from '../types';

export const MOCK_USERS: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@shami.com', role: Role.ADMIN, avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: '2', name: 'Dr. Ahmad', email: 'provider@shami.com', role: Role.CLINIC_OWNER, avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: '3', name: 'Sarah Patient', email: 'patient@shami.com', role: Role.PATIENT, avatar: 'https://i.pravatar.cc/150?u=3' },
];

export const MOCK_FACILITIES: Facility[] = [
  {
    id: 'c1',
    type: EntityType.CLINIC,
    name: 'Damascus Heart Center',
    name_en: 'Damascus Heart Center',
    name_ar: 'مركز دمشق للقلب',
    description: 'Leading cardiology center with advanced equipment.',
    image: 'https://picsum.photos/800/400?random=1',
    address: 'Malki Street, Damascus',
    city_name: 'Damascus',
    city_id: 1,
    is_verified: true,
    owner_id: '2',
    phone: '+963 11 123 4567',
  },
  {
    id: 'p1',
    type: EntityType.PHARMACY,
    name: 'Al-Hayat Pharmacy',
    name_en: 'Al-Hayat Pharmacy',
    name_ar: 'صيدلية الحياة',
    description: '24/7 service with home delivery.',
    image: 'https://picsum.photos/800/400?random=2',
    address: 'Aleppo Street, Latakia',
    city_name: 'Latakia',
    city_id: 2,
    is_verified: true,
    owner_id: '4',
    phone: '+963 41 987 6543',
  },
  {
    id: 'c2',
    type: EntityType.CLINIC,
    name: 'Smile Dental Clinic',
    name_en: 'Smile Dental Clinic',
    name_ar: 'عيادة الابتسامة للأسنان',
    description: 'Expert dental care for the whole family.',
    image: 'https://picsum.photos/800/400?random=3',
    address: 'Homs Center, Homs',
    city_name: 'Homs',
    city_id: 3,
    is_verified: false,
    owner_id: '5',
    phone: '+963 31 555 1234',
  }
];