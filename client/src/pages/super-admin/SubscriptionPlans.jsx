import { useState, useEffect } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FaCheckCircle, FaPlus, FaTimesCircle } from 'react-icons/fa';
import { useTheme } from '../../hooks/useTheme';

export default function SubscriptionPlans() {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [featuresInput, setFeaturesInput] = useState('');

  const fetchPlans = async () => {
    try {
      const res = await api.get('/super-admin/plans');
      setPlans(res.data.data || []);
    } catch (err) {
      console.error('Failed to load subscription plans', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const features = featuresInput.split('\n').map(f => f.trim()).filter(f => f.length > 0);
      await api.post('/super-admin/plans', {
        name, price: parseFloat(price), billing_cycle: billingCycle, features
      });
      Swal.fire('Success', 'Plan created successfully', 'success');
      setShowModal(false);
      
      setName('');
      setPrice('');
      setFeaturesInput('');

      setLoading(true);
      fetchPlans();
    } catch (err) {
      Swal.fire('Error', 'Failed to create subscription plan', 'error');
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription Plans</h1>
          <p className="text-gray-500 dark:text-gray-400">Configure platform plans, pricing tiers, and SaaS packaging.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className={`px-5 py-2.5 ${darkMode ? 'bg-indigo-650 hover:bg-indigo-700 shadow-indigo-500/20' : 'bg-pink-600 hover:bg-pink-700 shadow-pink-500/20'} text-white font-bold rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-colors`}
        >
          <FaPlus /> Create New Plan
        </button>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          let features = [];
          try {
            features = typeof p.features_json === 'string' ? JSON.parse(p.features_json) : (p.features_json || []);
          } catch(e) {
            features = [];
          }

          return (
            <div key={p.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="space-y-4">
                <span className={`text-xs uppercase font-extrabold px-3 py-1 rounded-full ${darkMode ? 'text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40' : 'text-pink-650 bg-pink-50'}`}>{p.billing_cycle}</span>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mt-2">{p.name}</h2>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white">${p.price}</span>
                  <span className="text-gray-400 text-sm">/{p.billing_cycle}</span>
                </div>
                
                <hr className="border-gray-100 dark:border-gray-800" />
                
                <ul className="space-y-2.5 pt-2">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <FaCheckCircle className="text-emerald-500 mt-1 shrink-0 text-xs" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Pricing Plan</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <FaTimesCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase">Plan Name</label>
                <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Starter Plan" className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm dark:text-white" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Price ($)</label>
                  <input required type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 49.00" className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm dark:text-white" />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Billing Cycle</label>
                  <select value={billingCycle} onChange={e => setBillingCycle(e.target.value)} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm dark:text-white">
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase">Features list (one per line)</label>
                <textarea rows={4} value={featuresInput} onChange={e => setFeaturesInput(e.target.value)} placeholder="e.g.&#10;5 Doctor Slots&#10;AI booking assistant&#10;Analytics dashboard" className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm dark:text-white" />
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" className={`px-6 py-3 ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-pink-600 hover:bg-pink-700'} text-white font-bold rounded-xl shadow-md cursor-pointer transition-colors w-full`}>
                  Create Subscription Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
