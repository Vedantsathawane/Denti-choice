import { useState, useEffect } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FaCheckCircle, FaTimesCircle, FaEdit, FaTrashAlt, FaPlus, FaKey, FaChevronRight } from 'react-icons/fa';
import { useTheme } from '../../hooks/useTheme';

export default function ClinicManagement() {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [clinics, setClinics] = useState([]);
  const [plans, setPlans] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  // Form states for creation
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [websiteTheme, setWebsiteTheme] = useState('modern');
  const [brandingColor, setBrandingColor] = useState('#0066FF');

  // States for editing
  const [editingClinic, setEditingClinic] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSubdomain, setEditSubdomain] = useState('');
  const [editCustomDomain, setEditCustomDomain] = useState('');
  const [editWebsiteTheme, setEditWebsiteTheme] = useState('modern');
  const [editBrandingColor, setEditBrandingColor] = useState('#0066FF');

  const fetchClinics = async () => {
    try {
      const [resClinics, resPlans] = await Promise.all([
        api.get('/super-admin/clinics'),
        api.get('/super-admin/plans')
      ]);
      setClinics(resClinics.data.data || []);
      setPlans(resPlans.data.data || []);
    } catch (err) {
      console.error('Failed to load clinics data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/super-admin/clinics', {
        name, subdomain, custom_domain: customDomain || null,
        ownerName, ownerEmail, ownerPassword,
        branding_color: brandingColor,
        website_theme: websiteTheme
      });
      Swal.fire('Success', 'Clinic tenant created successfully', 'success');
      setShowModal(false);
      
      // Clear form
      setName('');
      setSubdomain('');
      setCustomDomain('');
      setOwnerName('');
      setOwnerEmail('');
      setOwnerPassword('');
      setWebsiteTheme('modern');
      setBrandingColor('#0066FF');

      setLoading(true);
      fetchClinics();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to create clinic', 'error');
    }
  };

  const handleEditClick = (c) => {
    setEditingClinic(c);
    setEditName(c.name || '');
    setEditSubdomain(c.subdomain || '');
    setEditCustomDomain(c.custom_domain || '');
    setEditWebsiteTheme(c.theme || 'modern');
    setEditBrandingColor(c.branding_color || '#0066FF');
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/super-admin/clinics/${editingClinic.id}`, {
        name: editName,
        subdomain: editSubdomain,
        custom_domain: editCustomDomain || null,
        branding_color: editBrandingColor,
        theme: editWebsiteTheme
      });
      Swal.fire('Success', 'Clinic tenant configurations updated successfully', 'success');
      setShowEditModal(false);
      setEditingClinic(null);
      setLoading(true);
      fetchClinics();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to update clinic configurations', 'error');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const action = currentStatus === 1 ? 'suspend' : 'activate';
    const result = await Swal.fire({
      title: `${action.toUpperCase()} Clinic?`,
      text: `Are you sure you want to ${action} this clinic tenant?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Yes, ${action}`
    });

    if (result.isConfirmed) {
      try {
        await api.put(`/super-admin/clinics/${id}`, { is_active: currentStatus === 1 ? 0 : 1 });
        Swal.fire('Updated', `Clinic successfully ${action}d.`, 'success');
        fetchClinics();
      } catch (err) {
        Swal.fire('Error', 'Failed to update clinic status', 'error');
      }
    }
  };

  const handlePlanChange = async (clinicId) => {
    const { value: planId } = await Swal.fire({
      title: 'Assign Subscription Plan',
      input: 'select',
      inputOptions: plans.reduce((acc, p) => {
        acc[p.id] = `${p.name} - $${p.price}/${p.billing_cycle}`;
        return acc;
      }, {}),
      inputPlaceholder: 'Select a subscription plan',
      showCancelButton: true
    });

    if (planId) {
      try {
        await api.post('/super-admin/subscriptions/update', {
          clinicId: parseInt(clinicId),
          planId: parseInt(planId),
          status: 'active'
        });
        Swal.fire('Assigned', 'Subscription plan updated successfully', 'success');
        fetchClinics();
      } catch (err) {
        Swal.fire('Error', 'Failed to assign plan', 'error');
      }
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Clinic?',
      text: 'This action is irreversible and deletes all clinic data!',
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      confirmButtonText: 'Yes, Delete Permanent'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/super-admin/clinics/${id}`);
        Swal.fire('Deleted', 'Clinic has been deleted.', 'success');
        fetchClinics();
      } catch (err) {
        Swal.fire('Error', 'Failed to delete clinic', 'error');
      }
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tenant Clinics</h1>
          <p className="text-gray-500 dark:text-gray-400">View and manage all registered clinic tenants.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className={`px-5 py-2.5 ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20' : 'bg-pink-600 hover:bg-pink-700 shadow-pink-500/20'} text-white font-bold rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-colors`}
        >
          <FaPlus /> Add Clinic Tenant
        </button>
      </div>

      {/* Table */}
      <div className="bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950/80 rounded-3xl border border-slate-100 dark:border-slate-800/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Clinic Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Subdomain / Domain</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Plan</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-gray-550 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Period End</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {clinics.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-bold text-sm text-slate-800 dark:text-white block">{c.name}</span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 block mt-0.5">ID: {c.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 block">{c.subdomain}.dentist-choice.com</span>
                    {c.custom_domain && (
                      <span className={`text-xs ${darkMode ? 'text-indigo-500' : 'text-pink-500'} font-bold block mt-0.5`}>{c.custom_domain}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${darkMode ? 'text-indigo-650 bg-indigo-95% border-indigo-900/30 dark:text-indigo-400 dark:bg-indigo-950/30' : 'text-pink-600 bg-pink-50 border-pink-100/50 dark:text-pink-400 dark:bg-pink-950/20 dark:border-pink-900/30'}`}>{c.plan_name || 'No Plan'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      c.is_active === 1 
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-900/30' 
                        : 'bg-rose-50/60 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 border-rose-100/50 dark:border-rose-900/30'
                    }`}>
                      {c.is_active === 1 ? <FaCheckCircle className="text-[10px]" /> : <FaTimesCircle className="text-[10px]" />}
                      {c.is_active === 1 ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold text-slate-550 dark:text-slate-400">
                      {c.current_period_end ? new Date(c.current_period_end).toLocaleDateString() : 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => handleToggleStatus(c.id, c.is_active)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        c.is_active === 1 
                          ? 'bg-amber-50 hover:bg-amber-100/80 text-amber-600 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 dark:text-amber-400' 
                          : 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-600 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 dark:text-emerald-400'
                      }`}
                    >
                      {c.is_active === 1 ? 'Suspend' : 'Activate'}
                    </button>
                    <button 
                      onClick={() => handlePlanChange(c.id)}
                      className={`px-3 py-1.5 ${darkMode ? 'bg-indigo-950/20 hover:bg-indigo-950/40 text-indigo-400' : 'bg-pink-50 hover:bg-pink-100 text-pink-600 dark:bg-pink-950/20 dark:hover:bg-pink-950/40 dark:text-pink-400'} rounded-xl text-xs font-bold cursor-pointer transition-all`}
                    >
                      Plan
                    </button>
                    <button 
                      onClick={() => handleEditClick(c)}
                      className={`px-3 py-1.5 ${darkMode ? 'bg-indigo-950/20 hover:bg-indigo-950/40 text-indigo-400' : 'bg-pink-50 hover:bg-pink-100 text-pink-600 dark:bg-pink-950/20 dark:hover:bg-pink-950/40 dark:text-pink-400'} rounded-xl text-xs font-bold cursor-pointer transition-all`}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(c.id)}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-500 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 rounded-xl cursor-pointer transition-all inline-flex items-center"
                    >
                      <FaTrashAlt className="text-xs" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create New Clinic Tenant</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <FaTimesCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Clinic Name</label>
                  <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Perfect Smile" className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm dark:text-white" />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Subdomain</label>
                  <input required value={subdomain} onChange={e => setSubdomain(e.target.value)} placeholder="e.g. perfectsmile" className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm dark:text-white" />
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase">Custom Domain (Optional)</label>
                <input value={customDomain} onChange={e => setCustomDomain(e.target.value)} placeholder="e.g. clinic.perfectsmile.com" className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm dark:text-white" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Website Template</label>
                  <select value={websiteTheme} onChange={e => setWebsiteTheme(e.target.value)} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm dark:text-white">
                    <option value="modern">Modern Minimal</option>
                    <option value="elegant">Elegant Serif</option>
                    <option value="clinical">Clinical Trust</option>
                  </select>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Branding Color</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={brandingColor} onChange={e => setBrandingColor(e.target.value)} className="w-10 h-10 border border-gray-250 rounded cursor-pointer bg-white" />
                    <input value={brandingColor} onChange={e => setBrandingColor(e.target.value)} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm dark:text-white flex-1" />
                  </div>
                </div>
              </div>

              <hr className="border-gray-100 dark:border-gray-800" />
              <h3 className={`text-xs font-bold ${darkMode ? 'text-indigo-500' : 'text-pink-500'} uppercase`}>Seeding Owner User Credentials</h3>

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase">Owner Full Name</label>
                <input required value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="e.g. Dr. John Doe" className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm dark:text-white" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Owner Email</label>
                  <input required type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} placeholder="owner@email.com" className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm dark:text-white" />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Owner Password</label>
                  <input required type="password" value={ownerPassword} onChange={e => setOwnerPassword(e.target.value)} placeholder="••••••••" className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm dark:text-white" />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" className={`px-6 py-3 ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-pink-600 hover:bg-pink-700'} text-white font-bold rounded-xl shadow-md cursor-pointer transition-colors`}>
                  Create Tenant Clinic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingClinic && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Clinic Website Configuration</h2>
              <button onClick={() => { setShowEditModal(false); setEditingClinic(null); }} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <FaTimesCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Clinic Name</label>
                  <input required value={editName} onChange={e => setEditName(e.target.value)} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm dark:text-white" />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Subdomain</label>
                  <input required value={editSubdomain} onChange={e => setEditSubdomain(e.target.value)} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm dark:text-white" />
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase">Custom Domain (Optional)</label>
                <input value={editCustomDomain} onChange={e => setEditCustomDomain(e.target.value)} placeholder="e.g. clinic.perfectsmile.com" className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm dark:text-white" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Website Template</label>
                  <select value={editWebsiteTheme} onChange={e => setEditWebsiteTheme(e.target.value)} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm dark:text-white">
                    <option value="modern">Modern Minimal</option>
                    <option value="elegant">Elegant Serif</option>
                    <option value="clinical">Clinical Trust</option>
                  </select>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Branding Color</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={editBrandingColor} onChange={e => setEditBrandingColor(e.target.value)} className="w-10 h-10 border border-gray-250 rounded cursor-pointer bg-white" />
                    <input value={editBrandingColor} onChange={e => setEditBrandingColor(e.target.value)} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm dark:text-white flex-1" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800 gap-2">
                <button type="button" onClick={() => { setShowEditModal(false); setEditingClinic(null); }} className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl cursor-pointer transition-colors hover:bg-gray-200">
                  Cancel
                </button>
                <button type="submit" className={`px-6 py-2.5 ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-pink-600 hover:bg-pink-700'} text-white font-bold rounded-xl shadow-md cursor-pointer transition-colors`}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
