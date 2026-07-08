import { createContext, useState, useEffect, useCallback } from 'react';
import { settingService } from '../services/dataService';

export const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  clinic_name: 'Denti-Choice Dental Clinic',
  clinic_phone: '+1 (555) 123-4567',
  clinic_phone_secondary: '+1 (555) 987-6543',
  clinic_email: 'info@dentichoice.com',
  clinic_address: '123 Dental Avenue, Healthcare District, New York, NY 10001',
  opening_hours: {
    monday: '9:00 AM - 5:00 PM',
    tuesday: '9:00 AM - 5:00 PM',
    wednesday: '9:00 AM - 5:00 PM',
    thursday: '9:00 AM - 5:00 PM',
    friday: '9:00 AM - 5:00 PM',
    saturday: '10:00 AM - 2:00 PM',
    sunday: 'Closed'
  },
  social_facebook: 'https://facebook.com/dentichoice',
  social_twitter: 'https://twitter.com/dentichoice',
  social_instagram: 'https://instagram.com/dentichoice',
  social_linkedin: 'https://linkedin.com/company/dentichoice',
  google_maps_url: 'https://maps.google.com/?q=123+Dental+Avenue+New+York'
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await settingService.getAll();
      const s = res.data.data;
      setSettings(prev => ({
        ...prev,
        ...s,
        opening_hours: s.opening_hours || prev.opening_hours
      }));
    } catch (error) {
      console.error('Failed to fetch settings from API:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <SettingsContext.Provider value={{ settings, loading, fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
