import { useState, useEffect } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FaSave, FaPalette, FaLaptop, FaSearch, FaClock } from 'react-icons/fa';

export default function WebsiteBuilder() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [builderData, setBuilderData] = useState({
    website_theme: 'modern',
    primary_color: '#0066FF',
    secondary_color: '#38bdf8',
    logo_url: '',
    hero_title: '',
    hero_subtitle: '',
    seo_title: '',
    seo_description: '',
    google_maps: '',
    facebook: '',
    instagram: '',
    twitter: '',
    linkedin: '',
    ai_enabled: 'true',
    booking_enabled: 'true'
  });

  useEffect(() => {
    async function loadWebsiteSettings() {
      try {
        const res = await api.get('/clinic/settings');
        const settings = res.data.data || {};
        
        let socialObj = {};
        try {
          socialObj = settings.social_links ? JSON.parse(settings.social_links) : {};
        } catch (e) {
          socialObj = {};
        }

        setBuilderData({
          website_theme: settings.website_theme || 'modern',
          primary_color: settings.primary_color || '#0066FF',
          secondary_color: settings.secondary_color || '#38bdf8',
          logo_url: settings.logo_url || settings.clinic_logo || '',
          hero_title: settings.hero_title || '',
          hero_subtitle: settings.hero_subtitle || '',
          seo_title: settings.seo_title || '',
          seo_description: settings.seo_description || '',
          google_maps: settings.google_maps || '',
          facebook: socialObj.facebook || '',
          instagram: socialObj.instagram || '',
          twitter: socialObj.twitter || '',
          linkedin: socialObj.linkedin || '',
          ai_enabled: settings.ai_enabled || 'true',
          booking_enabled: settings.booking_enabled || 'true'
        });
      } catch (err) {
        console.error('Failed to load website builder settings:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadWebsiteSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBuilderData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const socialLinks = JSON.stringify({
      facebook: builderData.facebook,
      instagram: builderData.instagram,
      twitter: builderData.twitter,
      linkedin: builderData.linkedin
    });

    const payload = {
      website_theme: builderData.website_theme,
      primary_color: builderData.primary_color,
      secondary_color: builderData.secondary_color,
      logo_url: builderData.logo_url,
      clinic_logo: builderData.logo_url, // backward compatibility
      hero_title: builderData.hero_title,
      hero_subtitle: builderData.hero_subtitle,
      seo_title: builderData.seo_title,
      seo_description: builderData.seo_description,
      google_maps: builderData.google_maps,
      social_links: socialLinks,
      ai_enabled: builderData.ai_enabled,
      booking_enabled: builderData.booking_enabled
    };

    try {
      await api.put('/clinic/settings', payload);
      Swal.fire('Success', 'Clinic website customization saved successfully!', 'success');
    } catch (err) {
      Swal.fire('Error', 'Failed to update website customization', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Public Website Builder & Theme Customizer</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Design your clinic's public-facing landing page and schedule widgets.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Style & Templates */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2 border-b pb-2">
            <FaPalette className="text-indigo-500" /> Branding & Theme Settings
          </h4>
          <div className="space-y-3">
            <div className="flex flex-col space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Public Website Theme Template</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'modern',
                    name: 'Modern Minimal',
                    tag: 'Default',
                    desc: 'Clean sans-serif design for tech-forward cosmetic clinics.',
                    bg: 'from-blue-500/20 to-indigo-500/20 dark:from-blue-600/10 dark:to-indigo-600/10 border-blue-500',
                    previewIcon: '⚡'
                  },
                  {
                    id: 'elegant',
                    name: 'Elegant Serif',
                    tag: 'Premium',
                    desc: 'Sophisticated serif fonts for high-end boutique offices.',
                    bg: 'from-purple-500/20 to-pink-500/20 dark:from-purple-600/10 dark:to-pink-600/10 border-purple-500',
                    previewIcon: '✨'
                  },
                  {
                    id: 'clinical',
                    name: 'Clinical Trust',
                    tag: 'Clean',
                    desc: 'Safe and professional grid for multi-doctor family practices.',
                    bg: 'from-emerald-500/20 to-teal-500/20 dark:from-emerald-600/10 dark:to-teal-600/10 border-emerald-500',
                    previewIcon: '🏥'
                  }
                ].map((tpl) => {
                  const isSelected = builderData.website_theme === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => setBuilderData(prev => ({ ...prev, website_theme: tpl.id }))}
                      className={`relative cursor-pointer rounded-2xl border p-4 transition-all duration-300 select-none flex flex-col justify-between space-y-3 ${
                        isSelected 
                          ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/10 ring-2 ring-indigo-500/20 shadow-md' 
                          : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700/80 hover:shadow-xs'
                      }`}
                    >
                      {/* Selection dot */}
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">
                          ✓
                        </div>
                      )}
                      
                      {/* Theme layout thumbnail simulator */}
                      <div className={`h-24 w-full rounded-xl bg-gradient-to-br ${tpl.bg} flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800/80 relative overflow-hidden`}>
                        <span className="text-3xl filter drop-shadow-md">{tpl.previewIcon}</span>
                        <span className="absolute bottom-2 right-2 text-[8px] font-black uppercase bg-slate-800/80 dark:bg-slate-900/90 text-white px-2 py-0.5 rounded-full tracking-wider">
                          {tpl.tag}
                        </span>
                      </div>

                      <div>
                        <h5 className="text-xs font-bold text-slate-800 dark:text-white">{tpl.name}</h5>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-normal">{tpl.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase">Primary Accent Color</label>
                <div className="flex gap-2 items-center">
                  <input type="color" name="primary_color" value={builderData.primary_color} onChange={handleChange} className="w-10 h-8 border border-gray-200 rounded cursor-pointer bg-white" />
                  <input name="primary_color" value={builderData.primary_color} onChange={handleChange} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 text-xs dark:text-white flex-1" />
                </div>
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase">Secondary Accent Color</label>
                <div className="flex gap-2 items-center">
                  <input type="color" name="secondary_color" value={builderData.secondary_color} onChange={handleChange} className="w-10 h-8 border border-gray-200 rounded cursor-pointer bg-white" />
                  <input name="secondary_color" value={builderData.secondary_color} onChange={handleChange} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 text-xs dark:text-white flex-1" />
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase">Logo URL / Image Location</label>
              <input name="logo_url" value={builderData.logo_url} onChange={handleChange} placeholder="/images/logo.png" className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:text-white" />
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2 border-b pb-2">
            <FaLaptop className="text-indigo-500" /> Hero Section Content
          </h4>
          <div className="space-y-3">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase">Hero Title / Heading</label>
              <input name="hero_title" value={builderData.hero_title} onChange={handleChange} placeholder="e.g. Your Smile, Our Priority" className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:text-white" />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase">Hero Subtitle / Description Description</label>
              <textarea rows={3} name="hero_subtitle" value={builderData.hero_subtitle} onChange={handleChange} placeholder="Introduce your clinic capabilities..." className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:text-white" />
            </div>
          </div>
        </div>

        {/* SEO Tags */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2 border-b pb-2">
            <FaSearch className="text-indigo-500" /> Search Engine Optimization (SEO)
          </h4>
          <div className="space-y-3">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase">SEO Page Title</label>
              <input name="seo_title" value={builderData.seo_title} onChange={handleChange} placeholder="e.g. SmileCare - Premium Dental Clinic" className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:text-white" />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase">SEO Meta Description</label>
              <textarea rows={3} name="seo_description" value={builderData.seo_description} onChange={handleChange} placeholder="Provide a summary of your clinic for search results..." className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:text-white" />
            </div>
          </div>
        </div>

        {/* Google Maps & Social Links */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2 border-b pb-2">
            <FaGlobe className="text-indigo-500" /> Integrations & Social Links
          </h4>
          <div className="space-y-3">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase">Google Maps Embed Link (Src Only)</label>
              <input name="google_maps" value={builderData.google_maps} onChange={handleChange} placeholder="https://www.google.com/maps/embed?pb=..." className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:text-white" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase">Facebook URL</label>
                <input name="facebook" value={builderData.facebook} onChange={handleChange} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:text-white" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase">Instagram URL</label>
                <input name="instagram" value={builderData.instagram} onChange={handleChange} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:text-white" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase">Twitter/X URL</label>
                <input name="twitter" value={builderData.twitter} onChange={handleChange} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:text-white" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase">LinkedIn URL</label>
                <input name="linkedin" value={builderData.linkedin} onChange={handleChange} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4 md:col-span-2">
          <h4 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2 border-b pb-2">
            <FaClock className="text-indigo-500" /> Platform Feature Access Toggles
          </h4>
          <div className="grid grid-cols-2 gap-6">
            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl">
              <div>
                <strong className="text-xs text-gray-800 dark:text-white block">AI receptionist scheduling</strong>
                <span className="text-[11px] text-gray-400">Allow patient booking chat via conversational AI agent.</span>
              </div>
              <select name="ai_enabled" value={builderData.ai_enabled} onChange={handleChange} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs dark:text-white focus:outline-none">
                <option value="true">Active (Enabled)</option>
                <option value="false">Inactive (Disabled)</option>
              </select>
            </div>

            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl">
              <div>
                <strong className="text-xs text-gray-800 dark:text-white block">Patient self appointment booking</strong>
                <span className="text-[11px] text-gray-400">Allow booking form and custom slot selection on the website.</span>
              </div>
              <select name="booking_enabled" value={builderData.booking_enabled} onChange={handleChange} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs dark:text-white focus:outline-none">
                <option value="true">Active (Enabled)</option>
                <option value="false">Inactive (Disabled)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button 
            type="submit" 
            disabled={saving}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-colors disabled:opacity-50"
          >
            <FaSave /> {saving ? 'Saving Website Changes...' : 'Save Public Page Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
