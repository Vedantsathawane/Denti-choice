import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCrown, FaHourglassHalf, FaFileInvoiceDollar, FaChartLine, 
  FaCheckCircle, FaExclamationCircle, FaUserShield, FaDownload, 
  FaSave, FaPlusCircle, FaClone, FaBan, FaSync, FaSpinner 
} from 'react-icons/fa';
import api, { toastError } from '../../services/api';
import Swal from 'sweetalert2';

export default function SuperAdminBilling() {
  const [loading, setLoading] = useState(true);
  const [billingData, setBillingData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [editingPlan, setEditingPlan] = useState(null);
  const [savingPlan, setSavingPlan] = useState(false);

  // Subscriptions adjustments form
  const [adjustSub, setAdjustSub] = useState({
    clinicId: '',
    action: 'extend_trial',
    daysToExtend: 14,
    planId: 2
  });
  const [adjusting, setAdjusting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const reportRes = await api.get('/super-admin/billing/revenue-report');
      if (reportRes.data.success) {
        setBillingData(reportRes.data.data);
      }

      const plansRes = await api.get('/super-admin/plans');
      if (plansRes.data.success) {
        setPlans(plansRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load Super Admin SaaS statistics:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!editingPlan.name || editingPlan.price === undefined || savingPlan) return;

    setSavingPlan(true);
    try {
      await api.post('/super-admin/plans', editingPlan);
      Swal.fire('Success', 'Plan details updated successfully', 'success');
      setEditingPlan(null);
      loadData();
    } catch (err) {
      toastError('Failed to save plan details', err);
    } finally {
      setSavingPlan(false);
    }
  };

  const handleAdjustSubscription = async (e) => {
    e.preventDefault();
    if (!adjustSub.clinicId || adjusting) return;

    setAdjusting(true);
    try {
      await api.post('/super-admin/subscriptions/update', adjustSub);
      Swal.fire({
        title: 'Subscription Adjusted',
        text: 'Tenant subscription status updated successfully.',
        icon: 'success',
        confirmButtonColor: '#10B981'
      });
      setAdjustSub({ clinicId: '', action: 'extend_trial', daysToExtend: 14, planId: 2 });
      loadData();
    } catch (err) {
      toastError('Modification failed', err);
    } finally {
      setAdjusting(false);
    }
  };

  const exportCSV = () => {
    if (!billingData || billingData.invoices.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Invoice Number,Clinic Name,Amount,GST Tax,Status,Date\n';

    billingData.invoices.forEach(inv => {
      const row = `"${inv.invoice_number}","${inv.clinic_name}",$${inv.amount},$${inv.gst_amount},"${inv.status}","${dayjs(inv.created_at).format('YYYY-MM-DD')}"`;
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Denti-Choice-Billing-Report-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <FaSpinner className="text-[#0066FF] text-4xl animate-spin mb-4" />
        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Loading Platform Billing...</span>
      </div>
    );
  }

  // Calculate stats values
  const activeCount = billingData?.statusCounts.find(c => c.status === 'active')?.count || 0;
  const trialCount = billingData?.statusCounts.find(c => c.status === 'trialing')?.count || 0;
  const expiredCount = billingData?.statusCounts.find(c => c.status === 'expired')?.count || 0;
  const suspendedCount = billingData?.statusCounts.find(c => c.status === 'suspended')?.count || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <FaUserShield className="text-[#0066FF]" /> Platform Revenue <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">Console</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Monitor platform Monthly Recurring Revenue (MRR), configure feature gating plans, adjust tenant subscriptions, and download exports.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-xl cursor-pointer transition-colors shadow-sm"
          >
            <FaDownload /> Export CSV Report
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer transition-colors"
          >
            <FaSync /> Sync Data
          </button>
        </div>
      </div>

      {/* KPI stats widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Monthly Recurring Revenue (MRR)</span>
            <h4 className="text-2xl font-black text-slate-800 dark:text-white">${billingData?.mrr.toLocaleString()}</h4>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-xs">
            <FaChartLine size={18} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Annual Recurring Revenue (ARR)</span>
            <h4 className="text-2xl font-black text-slate-800 dark:text-white">${billingData?.arr.toLocaleString()}</h4>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-xs">
            <FaCrown size={18} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Active & Trial Clinics</span>
            <h4 className="text-xl font-black text-slate-800 dark:text-white">
              {activeCount} Active / {trialCount} Trial
            </h4>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
            <FaCheckCircle size={18} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Suspended / Expired</span>
            <h4 className="text-xl font-black text-rose-500">
              {suspendedCount} / {expiredCount} Clinics
            </h4>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
            <FaBan size={18} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Hand: Manage plans & adjust subscriptions */}
        <div className="lg:col-span-2 space-y-8">
          {/* Subscription adjustments operations */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-850 dark:text-white">Tenant Subscription Operator</h3>
            <p className="text-xs text-gray-400">Suspend, reactivate, extend trial days, or manually reassign active plans for dental clinics.</p>

            <form onSubmit={handleAdjustSubscription} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Clinic ID</label>
                <input
                  type="number"
                  required
                  value={adjustSub.clinicId}
                  onChange={(e) => setAdjustSub({...adjustSub, clinicId: e.target.value})}
                  placeholder="e.g. 1"
                  className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Operator Action</label>
                <select
                  value={adjustSub.action}
                  onChange={(e) => setAdjustSub({...adjustSub, action: e.target.value})}
                  className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs dark:text-white focus:outline-none"
                >
                  <option value="extend_trial">Extend Trial Days</option>
                  <option value="suspend">Suspend Subscription</option>
                  <option value="reactivate">Reactivate Subscription</option>
                  <option value="change_plan">Upgrade/Downgrade Plan</option>
                </select>
              </div>

              {adjustSub.action === 'extend_trial' && (
                <div className="flex flex-col space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Days to Add</label>
                  <input
                    type="number"
                    value={adjustSub.daysToExtend}
                    onChange={(e) => setAdjustSub({...adjustSub, daysToExtend: e.target.value})}
                    placeholder="e.g. 14"
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs dark:text-white focus:outline-none"
                  />
                </div>
              )}

              {adjustSub.action === 'change_plan' && (
                <div className="flex flex-col space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select New Target Plan</label>
                  <select
                    value={adjustSub.planId}
                    onChange={(e) => setAdjustSub({...adjustSub, planId: e.target.value})}
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs dark:text-white focus:outline-none"
                  >
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
                  </select>
                </div>
              )}

              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={adjusting || !adjustSub.clinicId}
                  className="px-4 py-2 bg-[#0066FF] hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
                >
                  <FaSave /> {adjusting ? 'Processing Adjustment...' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>

          {/* Platform subscription plans configurator */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-850 dark:text-white">Configure Subscription Plans</h3>
              <button
                onClick={() => setEditingPlan({ name: '', price: 0, billing_cycle: 'monthly', features_json: {} })}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-xl cursor-pointer transition-colors"
              >
                <FaPlusCircle /> Add Custom Plan
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map(p => (
                <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-black text-slate-850 dark:text-white">{p.name}</h4>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{p.billing_cycle}</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800 dark:text-white py-1">${parseFloat(p.price).toFixed(2)}</div>
                    <p className="text-[10px] font-medium text-slate-400">Plan limits are configured inside the SaaS features mapping JSON.</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingPlan(p)}
                      className="flex-1 py-2 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <FaSave /> Edit Configuration
                    </button>
                    <button
                      onClick={() => setEditingPlan({ ...p, id: null, name: `${p.name} (Copy)` })}
                      className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                      title="Clone Plan"
                    >
                      <FaClone />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {editingPlan && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4"
              >
                <h4 className="text-sm font-bold text-slate-850 dark:text-white">
                  {editingPlan.id ? 'Edit Plan Configuration' : 'Create Custom Configured Plan'}
                </h4>
                <form onSubmit={handleSavePlan} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Plan Name</label>
                      <input
                        type="text"
                        required
                        value={editingPlan.name}
                        onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                        className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs dark:text-white"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Pricing Amount ($)</label>
                      <input
                        type="number"
                        required
                        value={editingPlan.price}
                        onChange={(e) => setEditingPlan({...editingPlan, price: parseFloat(e.target.value)})}
                        className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs dark:text-white"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Billing Cycle</label>
                      <select
                        value={editingPlan.billing_cycle}
                        onChange={(e) => setEditingPlan({...editingPlan, billing_cycle: e.target.value})}
                        className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs dark:text-white"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="half_yearly">Half-Yearly</option>
                        <option value="yearly">Yearly / Annual</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingPlan(null)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingPlan}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                    >
                      <FaSave /> Save Changes
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Hand: Platform-wide Invoice audit log list */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col space-y-4 h-[650px]">
          <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FaFileInvoiceDollar className="text-[#0066FF]" /> Platform Invoice History
          </h3>
          <p className="text-xs text-gray-400">Audits logs list of all billing occurrences across the platform.</p>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40 space-y-3">
            {billingData?.invoices.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400">No invoices generated on the platform yet.</div>
            ) : (
              billingData?.invoices.map(inv => (
                <div key={inv.id} className="pt-3 flex justify-between items-start gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-[#0066FF]">{inv.invoice_number}</span>
                      <span className="text-[9px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full font-bold">PAID</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white block mt-1">
                      ${(parseFloat(inv.amount) + parseFloat(inv.gst_amount)).toLocaleString()}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-650 dark:text-slate-400 block">{inv.clinic_name}</span>
                  </div>
                  <a
                    href={`${api.defaults.baseURL}/billing/invoices/${inv.id}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-extrabold text-blue-500 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <FaFileInvoiceDollar /> Receipt
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
