import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSave, FaWhatsapp, FaKey, FaQuestionCircle } from 'react-icons/fa';
import api, { toastError } from '../../services/api';
import Swal from 'sweetalert2';

export default function WhatsAppSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    whatsapp_phone_number_id: '',
    whatsapp_access_token: '',
    whatsapp_use_sandbox: 'true'
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await api.get('/clinic/settings');
        const dbSettings = res.data.data || {};
        setSettings({
          whatsapp_phone_number_id: dbSettings.whatsapp_phone_number_id || '',
          whatsapp_access_token: dbSettings.whatsapp_access_token || '',
          whatsapp_use_sandbox: dbSettings.whatsapp_use_sandbox !== undefined ? String(dbSettings.whatsapp_use_sandbox) : 'true'
        });
      } catch (err) {
        console.error('Failed to load clinic WhatsApp settings:', err.message);
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

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        whatsapp_phone_number_id: settings.whatsapp_phone_number_id,
        whatsapp_access_token: settings.whatsapp_access_token,
        whatsapp_use_sandbox: settings.whatsapp_use_sandbox
      };

      await api.put('/clinic/settings', payload);
      Swal.fire({
        title: 'Settings Saved',
        text: 'Clinic WhatsApp configurations saved successfully.',
        icon: 'success',
        confirmButtonColor: '#10B981'
      });
    } catch (err) {
      console.error(err);
      toastError('Failed to save WhatsApp settings.', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl"
    >
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FaWhatsapp className="text-emerald-500 text-2xl" /> Meta WhatsApp Business Integration
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configure clinic-specific Meta Cloud API details to send automated booking confirmations and notifications to patients.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-sm space-y-5">
          <div className="flex items-center space-x-3 pb-3 border-b border-gray-100 dark:border-gray-800">
            <FaKey className="text-emerald-500" />
            <h4 className="font-bold text-sm text-gray-800 dark:text-white">API Keys & Identifiers</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase">Phone Number ID</label>
              <input
                type="text"
                name="whatsapp_phone_number_id"
                value={settings.whatsapp_phone_number_id}
                onChange={handleChange}
                placeholder="e.g. 109283748293847"
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              />
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                Obtained from the Meta App Dashboard under WhatsApp Setup.
              </span>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase">Permanent Access Token</label>
              <input
                type="password"
                name="whatsapp_access_token"
                value={settings.whatsapp_access_token}
                onChange={handleChange}
                placeholder="EAAZB..."
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              />
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                Use a permanent system user token for production access.
              </span>
            </div>

            <div className="flex flex-col space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-gray-400 uppercase">WhatsApp API Driver Mode</label>
              <select
                name="whatsapp_use_sandbox"
                value={settings.whatsapp_use_sandbox}
                onChange={handleChange}
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              >
                <option value="true">Mock/Sandbox Mode (Write to Server Logs Only)</option>
                <option value="false">Live Mode (Send message to real phone number)</option>
              </select>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                Sandbox mode avoids API calls and logs template payloads. Toggle to Live once Meta reviews your business number.
              </span>
            </div>
          </div>
        </div>

        <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-5 flex items-start gap-3">
          <FaQuestionCircle className="text-emerald-500 text-lg mt-0.5 shrink-0" />
          <div className="text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
            <h5 className="font-bold">Need Help with Integration?</h5>
            <p>1. Create a Facebook Developer account and register your business app.</p>
            <p>2. Complete phone number registration and template approvals on the Meta Business Portal.</p>
            <p>3. Note that default templates sent when booking appointments are registered under name <code>appointment_confirmation</code>.</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
          >
            <FaSave /> {saving ? 'Saving...' : 'Save WhatsApp Settings'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
