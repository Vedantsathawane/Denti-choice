import { useState, useEffect } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FaSave, FaCreditCard, FaEnvelope } from 'react-icons/fa';
import { useTheme } from '../../hooks/useTheme';

export default function PlatformSettings() {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Platform Setting Fields
  const [settings, setSettings] = useState({
    stripe_publishable_key: '',
    stripe_secret_key: '',
    razorpay_key_id: '',
    razorpay_key_secret: '',
    billing_use_sandbox: 'true',
    support_email: 'support@dentist-choice.com',
    smtp_from: 'Denti-Choice <notifications@dentist-choice.com>'
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await api.get('/super-admin/settings');
        // Map response array/obj key-values
        const dbSettings = res.data.data || {};
        setSettings(prev => ({
          ...prev,
          ...dbSettings
        }));
      } catch (err) {
        console.error('Failed to load platform settings:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/super-admin/settings', settings);
      Swal.fire('Success', 'Platform configurations updated successfully', 'success');
    } catch (err) {
      Swal.fire('Error', 'Failed to update platform configurations', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Configurations</h1>
        <p className="text-gray-500 dark:text-gray-400">Configure platform-wide billing pipelines, security keys, and global helpdesk support settings.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Billing Gateways card */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FaCreditCard className={darkMode ? 'text-indigo-500' : 'text-pink-500'} /> Stripe & Razorpay Integrations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase">Stripe Publishable Key</label>
              <input name="stripe_publishable_key" value={settings.stripe_publishable_key} onChange={handleChange} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:text-white" />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase">Stripe Secret Key</label>
              <input type="password" name="stripe_secret_key" value={settings.stripe_secret_key} onChange={handleChange} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:text-white" />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase">Razorpay Key ID</label>
              <input name="razorpay_key_id" value={settings.razorpay_key_id} onChange={handleChange} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:text-white" />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase">Razorpay Key Secret</label>
              <input type="password" name="razorpay_key_secret" value={settings.razorpay_key_secret} onChange={handleChange} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:text-white" />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase">Billing Driver Mode</label>
              <select name="billing_use_sandbox" value={settings.billing_use_sandbox} onChange={handleChange} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:text-white">
                <option value="true">Mock/Sandbox (Development)</option>
                <option value="false">Live Integrations (Production)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Global Contacts & Mail card */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FaEnvelope className="text-amber-500" /> Platform General & SMTP Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase">SaaS Helpdesk Support Email</label>
              <input name="support_email" value={settings.support_email} onChange={handleChange} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:text-white" />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase">SMTP Outgoing Sender (From Header)</label>
              <input name="smtp_from" value={settings.smtp_from} onChange={handleChange} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:text-white" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={saving}
            className={`px-6 py-3 ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-pink-600 hover:bg-pink-700'} text-white font-bold rounded-xl flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50 transition-colors`}
          >
            <FaSave /> {saving ? 'Saving...' : 'Save Configuration Parameters'}
          </button>
        </div>
      </form>
    </div>
  );
}
