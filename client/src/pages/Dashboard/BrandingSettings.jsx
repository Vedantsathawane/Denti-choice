import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaSave, FaPalette, FaGlobe, FaFileUpload, FaTrash, 
  FaEye, FaCopy, FaCheckCircle, FaSpinner, FaTools 
} from 'react-icons/fa';
import api, { toastError } from '../../services/api';
import Swal from 'sweetalert2';

export default function BrandingSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings forms
  const [branding, setBranding] = useState({
    primary_color: '#0066FF',
    secondary_color: '#4F46E5',
    accent_color: '#10B981',
    typography_font: 'Outfit',
    clinic_logo: '',
    clinic_favicon: '',
    custom_css: '',
    hero_title: 'Your Smile, Our Priority',
    hero_subtitle: 'Experience state-of-the-art dental care with a gentle touch.',
    about_text: 'We are dedicated to providing excellent dental care in a comfortable environment.',
    vision: 'To be the leading modern dental care facility in the region.',
    mission: 'Deliver premium dental treatments with the highest safety standards.',
    homepage_visible: 'true',
    services_visible: 'true',
    doctors_visible: 'true',
    testimonials_visible: 'true',
    gallery_visible: 'true',
    whatsapp_visible: 'true',
    emergency_banner_active: 'false',
    emergency_banner_text: 'Emergency Dental Care: Available 24/7. Call us directly.'
  });

  // Media Library
  const [mediaList, setMediaList] = useState([]);
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load active settings
      const settingsRes = await api.get('/settings');
      if (settingsRes.data.success) {
        const dbSettings = {};
        settingsRes.data.data.forEach(s => {
          dbSettings[s.key] = s.value;
        });
        setBranding(prev => ({ ...prev, ...dbSettings }));
      }

      // 2. Load media files list
      const mediaRes = await api.get('/media');
      if (mediaRes.data.success) {
        setMediaList(mediaRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load branding configurations:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = Object.keys(branding).map(key => ({
        key,
        value: String(branding[key])
      }));

      await api.post('/settings', { settings: payload });
      
      // Inject primary colors immediately on the window DOM element
      if (branding.primary_color) {
        document.documentElement.style.setProperty('--color-primary', branding.primary_color);
      }

      Swal.fire({
        title: 'Settings Saved',
        text: 'White-label identity preferences have been updated successfully.',
        icon: 'success',
        confirmButtonColor: branding.primary_color || '#0066FF'
      });
      loadData();
    } catch (err) {
      toastError('Failed to save settings', err);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e, category) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    try {
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.success) {
        const path = res.data.data.filePath;
        if (category === 'logo') {
          setBranding(prev => ({ ...prev, clinic_logo: path }));
        } else if (category === 'favicon') {
          setBranding(prev => ({ ...prev, clinic_favicon: path }));
        }
        Swal.fire('Uploaded!', 'File successfully saved to media library.', 'success');
        loadData();
      }
    } catch (err) {
      toastError('Media upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMedia = async (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This media will be deleted permanently from the server disk.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Yes, delete it'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/media/${id}`);
          Swal.fire('Deleted!', 'Asset deleted successfully.', 'success');
          loadData();
        } catch (err) {
          toastError('Asset delete failed', err);
        }
      }
    });
  };

  const copyToClipboard = (url) => {
    const fullUrl = `${api.defaults.baseURL.replace('/api', '')}${url}`;
    navigator.clipboard.writeText(fullUrl);
    Swal.fire({
      title: 'Copied!',
      text: 'File web path copied to clipboard.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <FaSpinner className="text-[#0066FF] text-3xl animate-spin mb-3" />
        <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Loading Branding Panel...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Hand: Theme Presets & visibilities */}
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            
            {/* Color Palette settings */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-850 dark:text-white flex items-center gap-2">
                <FaPalette className="text-indigo-500" /> Clinic Theme Colors
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Primary Brand Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={branding.primary_color}
                      onChange={(e) => setBranding({...branding, primary_color: e.target.value})}
                      className="w-10 h-8 rounded-lg overflow-hidden border cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={branding.primary_color}
                      onChange={(e) => setBranding({...branding, primary_color: e.target.value})}
                      className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 text-xs font-mono w-full text-slate-700 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Secondary Accent Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={branding.secondary_color}
                      onChange={(e) => setBranding({...branding, secondary_color: e.target.value})}
                      className="w-10 h-8 rounded-lg overflow-hidden border cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={branding.secondary_color}
                      onChange={(e) => setBranding({...branding, secondary_color: e.target.value})}
                      className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 text-xs font-mono w-full text-slate-700 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Interactive Highlight</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={branding.accent_color}
                      onChange={(e) => setBranding({...branding, accent_color: e.target.value})}
                      className="w-10 h-8 rounded-lg overflow-hidden border cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={branding.accent_color}
                      onChange={(e) => setBranding({...branding, accent_color: e.target.value})}
                      className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 text-xs font-mono w-full text-slate-700 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Brand Logo and Favicon file inputs */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-850 dark:text-white flex items-center gap-2">
                <FaFileUpload className="text-emerald-500" /> Branding Asset Uploads
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Logo */}
                <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Clinic Logo Asset</span>
                  {branding.clinic_logo ? (
                    <img 
                      src={`${api.defaults.baseURL.replace('/api', '')}${branding.clinic_logo}`} 
                      className="max-h-12 object-contain" 
                      alt="Logo preview" 
                    />
                  ) : (
                    <div className="text-[10px] text-gray-450">No Logo Loaded</div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'logo')}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label 
                    htmlFor="logo-upload"
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-bold text-slate-750 dark:text-slate-200 rounded-xl cursor-pointer"
                  >
                    Select New Logo
                  </label>
                </div>

                {/* Favicon */}
                <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Clinic Favicon Icon</span>
                  {branding.clinic_favicon ? (
                    <img 
                      src={`${api.defaults.baseURL.replace('/api', '')}${branding.clinic_favicon}`} 
                      className="max-h-8 object-contain" 
                      alt="Favicon preview" 
                    />
                  ) : (
                    <div className="text-[10px] text-gray-450">No Favicon Loaded</div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'favicon')}
                    className="hidden"
                    id="favicon-upload"
                  />
                  <label 
                    htmlFor="favicon-upload"
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-bold text-slate-750 dark:text-slate-200 rounded-xl cursor-pointer"
                  >
                    Select New Favicon
                  </label>
                </div>
              </div>
            </div>

            {/* CMS text sections content editing */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-850 dark:text-white flex items-center gap-2">
                <FaGlobe className="text-blue-500" /> Website Content CMS Editor
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Hero Header Title</label>
                  <input
                    type="text"
                    value={branding.hero_title}
                    onChange={(e) => setBranding({...branding, hero_title: e.target.value})}
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-white"
                  />
                </div>

                <div className="flex flex-col space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Hero Subtitle</label>
                  <textarea
                    rows={2}
                    value={branding.hero_subtitle}
                    onChange={(e) => setBranding({...branding, hero_subtitle: e.target.value})}
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-white"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Clinic Vision Statement</label>
                  <textarea
                    rows={3}
                    value={branding.vision}
                    onChange={(e) => setBranding({...branding, vision: e.target.value})}
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-white"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Clinic Mission Statement</label>
                  <textarea
                    rows={3}
                    value={branding.mission}
                    onChange={(e) => setBranding({...branding, mission: e.target.value})}
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-white"
                  />
                </div>

                <div className="flex flex-col space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">About Clinic Summary Text</label>
                  <textarea
                    rows={3}
                    value={branding.about_text}
                    onChange={(e) => setBranding({...branding, about_text: e.target.value})}
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Layout section visibilities toggles */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-850 dark:text-white">Website Navigation & Section Visibility</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'homepage_visible', label: 'Display Homepage Section' },
                  { key: 'services_visible', label: 'Display Services List' },
                  { key: 'doctors_visible', label: 'Display Registered Doctors' },
                  { key: 'testimonials_visible', label: 'Display Patient Testimonials' },
                  { key: 'gallery_visible', label: 'Display Image Gallery' },
                  { key: 'whatsapp_visible', label: 'Display Floating WhatsApp Chat Button' }
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={branding[item.key] === 'true'}
                      onChange={(e) => setBranding({...branding, [item.key]: e.target.checked ? 'true' : 'false'})}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300 cursor-pointer"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom CSS overrides input */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-850 dark:text-white flex items-center gap-2">
                <FaTools className="text-gray-500" /> Advanced Branding CSS Overrides
              </h3>
              <p className="text-xs text-gray-400">Inject custom CSS classes directly into the patient-facing web view layouts header.</p>
              
              <div className="flex flex-col space-y-1">
                <textarea
                  rows={4}
                  value={branding.custom_css}
                  onChange={(e) => setBranding({...branding, custom_css: e.target.value})}
                  placeholder="/* e.g. body { background-color: #fafbfc; } */"
                  className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || uploading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <FaSave /> {saving ? 'Saving Settings...' : 'Save Settings'}
              </button>
            </div>

          </form>
        </div>

        {/* Right Hand: Isolated media library manager */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col space-y-4 h-[750px]">
          <div>
            <h3 className="text-base font-bold text-slate-850 dark:text-white">Clinic Media Library</h3>
            <p className="text-xs text-gray-400 mt-1">Upload and store layout files, banners, and testimonial pictures. Accessible only by your tenant.</p>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/40 pt-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'general')}
              className="hidden"
              id="library-upload"
            />
            <label
              htmlFor="library-upload"
              className="w-full py-2.5 bg-[#0066FF] hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
            >
              <FaFileUpload /> Upload Asset to Library
            </label>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40 space-y-3">
            {mediaList.length === 0 ? (
              <div className="text-center py-20 text-xs text-gray-400">Library is empty. Upload images above.</div>
            ) : (
              mediaList.map(item => (
                <div key={item.id} className="pt-3 flex items-center gap-3">
                  <img 
                    src={`${api.defaults.baseURL.replace('/api', '')}${item.file_path}`} 
                    className="w-10 h-10 rounded-lg object-cover bg-slate-50 border border-slate-100 dark:border-slate-800" 
                    alt="Asset thumbnail" 
                  />
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-800 dark:text-white truncate block">{item.filename}</span>
                    <span className="text-[9px] text-gray-400 block uppercase tracking-widest">{item.category} • {(item.file_size / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => copyToClipboard(item.file_path)}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg cursor-pointer"
                      title="Copy URL Path"
                    >
                      <FaCopy size={11} />
                    </button>
                    <button
                      onClick={() => handleDeleteMedia(item.id)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/25 text-rose-500 rounded-lg cursor-pointer"
                      title="Delete Asset"
                    >
                      <FaTrash size={11} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
