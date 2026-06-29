import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaSave, FaClinicMedical, FaClock, FaMailBulk, FaGlobe } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { toastError } from '../../services/api';
import { settingService } from '../../services/dataService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  // Form states
  const [clinicName, setClinicName] = useState('');
  const [clinicLogo, setClinicLogo] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicEmail, setClinicEmail] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [clinicPhoneSecondary, setClinicPhoneSecondary] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialTwitter, setSocialTwitter] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialLinkedin, setSocialLinkedin] = useState('');

  // Opening hours state
  const [openingHours, setOpeningHours] = useState({});

  // SMTP Settings
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await settingService.getAll();
      const s = res.data.data;
      
      setClinicName(s.clinic_name || '');
      setClinicLogo(s.clinic_logo || '');
      setClinicAddress(s.clinic_address || '');
      setClinicEmail(s.clinic_email || '');
      setClinicPhone(s.clinic_phone || '');
      setClinicPhoneSecondary(s.clinic_phone_secondary || '');
      setGoogleMapsUrl(s.google_maps_url || '');
      setSocialFacebook(s.social_facebook || '');
      setSocialTwitter(s.social_twitter || '');
      setSocialInstagram(s.social_instagram || '');
      setSocialLinkedin(s.social_linkedin || '');
      
      setOpeningHours(s.opening_hours || {});
      
      setSmtpHost(s.smtp_host || '');
      setSmtpPort(s.smtp_port || '');
      setSmtpUser(s.smtp_user || '');
      setSmtpPass(s.smtp_pass || '');
    } catch (error) {
      toastError('Failed to load settings.', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleOpeningHoursChange = (day, value) => {
    setOpeningHours(prev => ({ ...prev, [day]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      clinic_name: clinicName,
      clinic_logo: clinicLogo,
      clinic_address: clinicAddress,
      clinic_email: clinicEmail,
      clinic_phone: clinicPhone,
      clinic_phone_secondary: clinicPhoneSecondary,
      google_maps_url: googleMapsUrl,
      social_facebook: socialFacebook,
      social_twitter: socialTwitter,
      social_instagram: socialInstagram,
      social_linkedin: socialLinkedin,
      opening_hours: openingHours,
      smtp_host: smtpHost,
      smtp_port: smtpPort,
      smtp_user: smtpUser,
      smtp_pass: smtpPass
    };

    try {
      await settingService.update(payload);
      toast.success('Settings updated successfully.');
      fetchSettings();
    } catch {
      toast.error('Failed to save settings.');
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clinic Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Configure clinic metadata, contact info, working hours, and Nodemailer SMTP routing channels.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl text-left transition-all cursor-pointer whitespace-nowrap lg:w-full ${
              activeTab === 'general'
                ? 'gradient-primary text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <FaClinicMedical /> General Info
          </button>
          <button
            onClick={() => setActiveTab('hours')}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl text-left transition-all cursor-pointer whitespace-nowrap lg:w-full ${
              activeTab === 'hours'
                ? 'gradient-primary text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <FaClock /> Opening Hours
          </button>
          <button
            onClick={() => setActiveTab('smtp')}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl text-left transition-all cursor-pointer whitespace-nowrap lg:w-full ${
              activeTab === 'smtp'
                ? 'gradient-primary text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <FaMailBulk /> SMTP Config
          </button>
        </div>

        {/* Tab content area */}
        <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'general' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 pb-2">
                  General Details
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Clinic Name</label>
                    <input
                      type="text"
                      value={clinicName}
                      onChange={e => setClinicName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Logo Path / URL</label>
                    <input
                      type="text"
                      value={clinicLogo}
                      onChange={e => setClinicLogo(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Contact Email Address</label>
                    <input
                      type="email"
                      value={clinicEmail}
                      onChange={e => setClinicEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Google Maps URL Location</label>
                    <input
                      type="text"
                      value={googleMapsUrl}
                      onChange={e => setGoogleMapsUrl(e.target.value)}
                      placeholder="https://maps.google.com/..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Primary Contact Line</label>
                    <input
                      type="tel"
                      value={clinicPhone}
                      onChange={e => setClinicPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Secondary Contact Line</label>
                    <input
                      type="tel"
                      value={clinicPhoneSecondary}
                      onChange={e => setClinicPhoneSecondary(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Clinic Physical Address</label>
                  <input
                    type="text"
                    value={clinicAddress}
                    onChange={e => setClinicAddress(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    required
                  />
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 pb-2 pt-4 flex items-center gap-2">
                  <FaGlobe className="text-primary" /> Social Channels
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Facebook Page URL</label>
                    <input
                      type="text"
                      value={socialFacebook}
                      onChange={e => setSocialFacebook(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Twitter URL</label>
                    <input
                      type="text"
                      value={socialTwitter}
                      onChange={e => setSocialTwitter(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Instagram Handle URL</label>
                    <input
                      type="text"
                      value={socialInstagram}
                      onChange={e => setSocialInstagram(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">LinkedIn Profile URL</label>
                    <input
                      type="text"
                      value={socialLinkedin}
                      onChange={e => setSocialLinkedin(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'hours' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 pb-2">
                  Clinic Opening Hours
                </h3>
                <p className="text-xs text-gray-500">Define working schedules for each weekday. Type e.g., '9:00 AM - 5:00 PM' or 'Closed'.</p>

                <div className="space-y-3 max-w-xl">
                  {DAYS_OF_WEEK.map(day => (
                    <div key={day} className="flex items-center gap-4">
                      <span className="w-24 capitalize font-semibold text-sm text-gray-700 dark:text-gray-300">{day}</span>
                      <input
                        type="text"
                        value={openingHours[day] || ''}
                        onChange={e => handleOpeningHoursChange(day, e.target.value)}
                        placeholder="9:00 AM - 5:00 PM"
                        className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'smtp' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 pb-2">
                  SMTP Config (Email Service)
                </h3>
                <p className="text-xs text-gray-500">SMTP configuration settings are loaded by Nodemailer to dispatch confirmation emails to patient and doctors.</p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">SMTP Host Server</label>
                    <input
                      type="text"
                      value={smtpHost}
                      onChange={e => setSmtpHost(e.target.value)}
                      placeholder="smtp.gmail.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">SMTP Port</label>
                    <input
                      type="text"
                      value={smtpPort}
                      onChange={e => setSmtpPort(e.target.value)}
                      placeholder="587"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">SMTP Authenticated User</label>
                    <input
                      type="email"
                      value={smtpUser}
                      onChange={e => setSmtpUser(e.target.value)}
                      placeholder="clinic@gmail.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">SMTP Password</label>
                    <input
                      type="password"
                      value={smtpPass}
                      onChange={e => setSmtpPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-bold text-sm hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <FaSave /> Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
