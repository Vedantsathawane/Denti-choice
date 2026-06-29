export const TIME_SLOTS = [
  { value: '09:00:00', label: '9:00 AM' },
  { value: '09:30:00', label: '9:30 AM' },
  { value: '10:00:00', label: '10:00 AM' },
  { value: '10:30:00', label: '10:30 AM' },
  { value: '11:00:00', label: '11:00 AM' },
  { value: '11:30:00', label: '11:30 AM' },
  { value: '12:00:00', label: '12:00 PM' },
  { value: '14:00:00', label: '2:00 PM' },
  { value: '14:30:00', label: '2:30 PM' },
  { value: '15:00:00', label: '3:00 PM' },
  { value: '15:30:00', label: '3:30 PM' },
  { value: '16:00:00', label: '4:00 PM' },
  { value: '16:30:00', label: '4:30 PM' },
  { value: '17:00:00', label: '5:00 PM' }
];

export const STATUS_COLORS = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-800', dark: 'dark:bg-amber-900/30 dark:text-amber-400' },
  confirmed: { bg: 'bg-emerald-100', text: 'text-emerald-800', dark: 'dark:bg-emerald-900/30 dark:text-emerald-400' },
  completed: { bg: 'bg-sky-100', text: 'text-sky-800', dark: 'dark:bg-sky-900/30 dark:text-sky-400' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', dark: 'dark:bg-red-900/30 dark:text-red-400' }
};

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
];

export const NAV_LINKS = [
  { name: 'Home', path: '/' },
  { name: 'Services', path: '/services' },
  { name: 'Doctors', path: '/doctors' },
  { name: 'Appointment', path: '/appointment' },
  { name: 'Contact', path: '/contact' }
];

export const SPECIALIZATIONS = [
  'Orthodontics', 'Endodontics', 'Cosmetic Dentistry', 'Oral Surgery',
  'Pediatric Dentistry', 'Dental Implants', 'Periodontics', 'Prosthodontics'
];
