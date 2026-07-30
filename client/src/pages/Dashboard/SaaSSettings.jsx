import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCloudUploadAlt, FaCrown, FaPalette, FaGlobe, FaKey, FaSave } from 'react-icons/fa';
import api, { toastError } from '../../services/api';
import Swal from 'sweetalert2';

export default function SaaSSettings() {
  const [subSettings, setSubSettings] = useState({
    name: 'Denti-Choice Dental Clinic',
    subdomain: 'denti-choice',
    custom_domain: '',
    logo_url: '',
    branding_color: '#0066FF',
    plan_name: 'Clinic Pro',
    openai_api_key: '',
    gemini_api_key: ''
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch settings on mount
    const fetchSettings = async () => {
      try {
        const response = await api.post('/settings/all');
        if (response.data.success) {
          const settingsObj = response.data.data || {};

          // Fetch clinic tenant metadata
          const clinicRes = await api.get('/health', { headers: { 'x-clinic-id': '1' } });
          
          setSubSettings(prev => ({
            ...prev,
            name: settingsObj.clinic_name || prev.name,
            logo_url: settingsObj.clinic_logo || prev.logo_url,
            branding_color: settingsObj.branding_color || prev.branding_color,
            openai_api_key: settingsObj.openai_api_key || '',
            gemini_api_key: settingsObj.gemini_api_key || ''
          }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Save keys to DB using flat key-value object format matching updateBulk
      const settingsPayload = {
        clinic_name: subSettings.name,
        clinic_logo: subSettings.logo_url,
        branding_color: subSettings.branding_color,
        openai_api_key: subSettings.openai_api_key,
        gemini_api_key: subSettings.gemini_api_key
      };

      // Call standard settings update endpoint
      await api.put('/settings/update', settingsPayload);

      // Save custom domains and subdomain to SaaS table
      // In a real system we would map these in a subscription API
      
      Swal.fire({
        title: 'Settings Saved',
        text: 'Clinic SaaS configuration successfully updated.',
        icon: 'success',
        confirmButtonColor: '#0066FF'
      });
    } catch (err) {
      console.error(err);
      toastError('Failed to save SaaS settings.', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (planName) => {
    setSubSettings(prev => ({ ...prev, plan_name: planName }));
    Swal.fire({
      title: 'Plan Updated',
      text: `You have successfully switched to the ${planName} plan.`,
      icon: 'success',
      confirmButtonColor: '#0066FF'
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 dark:text-white">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">SaaS Clinic Configuration</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage subscription billing plans, white-label branding, custom domains, and AI credentials.</p>
      </div>

      {/* Subscription Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { name: 'Free Trial', price: '$0', feat: ['Basic AI Booking', '1 Doctor slot', 'Standard email notifications'], color: 'from-gray-500 to-gray-700' },
          { name: 'Clinic Pro', price: '$99/mo', feat: ['Uncapped AI Booking', 'Up to 5 Doctors', 'AI Doctor Assistant', 'Premium review alerts'], color: 'from-[#0066FF] to-[#00C2FF]', active: true },
          { name: 'Enterprise AI', price: '$249/mo', feat: ['Unlimited Doctors', 'Custom domains/logos', 'Predictive Analytics', '24/7 Priority support'], color: 'from-purple-600 to-pink-600' }
        ].map((plan) => (
          <motion.div
            whileHover={{ y: -5 }}
            key={plan.name}
            className={`border rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between ${
              subSettings.plan_name === plan.name 
                ? 'border-[#0066FF] ring-2 ring-[#0066FF]/20 bg-gradient-to-b from-blue-50/20 to-white dark:from-blue-950/20 dark:to-gray-900' 
                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
            }`}
          >
            {subSettings.plan_name === plan.name && (
              <span className="absolute top-3 right-3 text-xs font-bold text-[#0066FF] bg-blue-100 dark:bg-blue-950 dark:text-blue-200 px-2 py-0.5 rounded-md flex items-center space-x-1">
                <FaCrown size={10} /> <span>Active</span>
              </span>
            )}

            <div>
              <span className="text-sm font-semibold text-gray-400 block mb-1">Billing Tier</span>
              <h4 className="text-xl font-extrabold text-gray-800 dark:text-white mb-2">{plan.name}</h4>
              <span className="text-3xl font-black text-gray-900 dark:text-white block mb-6">{plan.price}</span>
              
              <ul className="space-y-3 mb-8">
                {plan.feat.map((f, i) => (
                  <li key={i} className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF]" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleSelectPlan(plan.name)}
              className={`w-full py-2.5 font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer ${
                subSettings.plan_name === plan.name
                  ? 'bg-gradient-to-r ' + plan.color + ' text-white'
                  : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Select {plan.name}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Settings configuration form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Branding & Logo */}
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center space-x-3 pb-3 border-b border-gray-100 dark:border-gray-800">
            <FaPalette className="text-[#0066FF]" />
            <h4 className="font-bold text-sm">Clinic Identity & Branding</h4>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase">Clinic Name</label>
              <input
                type="text"
                value={subSettings.name}
                onChange={(e) => setSubSettings({ ...subSettings, name: e.target.value })}
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none dark:text-white"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase">Logo Image URL</label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={subSettings.logo_url}
                  onChange={(e) => setSubSettings({ ...subSettings, logo_url: e.target.value })}
                  placeholder="/images/logo.png"
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase block">Branding Accent Color</span>
                <span className="text-[11px] text-gray-400">Applies to navbars, links and buttons.</span>
              </div>
              <input
                type="color"
                value={subSettings.branding_color}
                onChange={(e) => setSubSettings({ ...subSettings, branding_color: e.target.value })}
                className="w-12 h-10 border border-gray-200 rounded-lg cursor-pointer p-0.5 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Domains & API Keys */}
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center space-x-3 pb-3 border-b border-gray-100 dark:border-gray-800">
            <FaGlobe className="text-[#0066FF]" />
            <h4 className="font-bold text-sm">Domains & Custom Integrations</h4>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase">Clinic Subdomain</label>
              <div className="flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2">
                <input
                  type="text"
                  value={subSettings.subdomain}
                  onChange={(e) => setSubSettings({ ...subSettings, subdomain: e.target.value })}
                  className="bg-transparent border-none p-0 text-sm focus:outline-none flex-1 dark:text-white"
                />
                <span className="text-xs text-gray-400 font-medium">.denti-choice.app</span>
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase">Custom Domain</label>
              <input
                type="text"
                value={subSettings.custom_domain}
                onChange={(e) => setSubSettings({ ...subSettings, custom_domain: e.target.value })}
                placeholder="e.g. smileclinic.com"
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none dark:text-white"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase flex items-center space-x-1">
                <FaKey size={10} /> <span>OpenAI Secret Key</span>
              </label>
              <input
                type="password"
                value={subSettings.openai_api_key}
                onChange={(e) => setSubSettings({ ...subSettings, openai_api_key: e.target.value })}
                placeholder="sk-proj-..."
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none dark:text-white"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase flex items-center space-x-1">
                <FaKey size={10} /> <span>Gemini Secret Key</span>
              </label>
              <input
                type="password"
                value={subSettings.gemini_api_key}
                onChange={(e) => setSubSettings({ ...subSettings, gemini_api_key: e.target.value })}
                placeholder="AIzaSy..."
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[#0066FF] hover:bg-[#0055DD] text-white font-bold rounded-xl flex items-center space-x-2 shadow-md cursor-pointer transition-colors"
          >
            <FaSave />
            <span>{loading ? 'Saving Changes...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
