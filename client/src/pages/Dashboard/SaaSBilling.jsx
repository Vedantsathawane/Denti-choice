import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCrown, FaHourglassHalf, FaFileInvoiceDollar, FaChartLine, FaArrowCircleUp, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import api, { toastError } from '../../services/api';
import Swal from 'sweetalert2';

export default function SaaSBilling() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [upgrading, setUpgrading] = useState(false);
  const [couponCode, setCouponCode] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const usageRes = await api.get('/billing/usage');
      if (usageRes.data.success) {
        setStats(usageRes.data.data);
      }

      const invoicesRes = await api.get('/billing/invoices');
      if (invoicesRes.data.success) {
        setInvoices(invoicesRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load SaaS billing details:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpgrade = async (planId) => {
    setUpgrading(true);
    try {
      const res = await api.post('/billing/checkout', {
        planId,
        couponCode: couponCode || null,
        gateway: 'stripe'
      });
      if (res.data.success) {
        // Redirection to the mock checkout portal
        window.location.href = res.data.data.checkoutUrl;
      }
    } catch (err) {
      toastError('Upgrade checkout initiation failed', err);
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <FaSpinner className="text-[#0066FF] text-4xl animate-spin mb-4" />
        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Loading Billing Panel...</span>
      </div>
    );
  }

  // Helper values
  const limits = stats?.limits || {};
  const usage = stats?.usage || {};
  const currentPlanName = stats?.planId === 3 ? 'Enterprise AI' : stats?.planId === 2 ? 'Clinic Pro' : 'Free Trial';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
          <FaCrown className="text-amber-500 animate-pulse" /> Subscription & <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">Billing</span>
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
          Manage your dental clinic SaaS subscription tier, monitor usage quota thresholds, and download printable tax invoices.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Subscription details & usage metrics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subscription State Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <FaCrown className="text-amber-500" /> Active Plan Details
              </h3>
              <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                stats?.status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' :
                stats?.status === 'trialing' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/30'
              }`}>
                {stats?.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800/40 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <div className="pb-3 sm:pb-0">
                <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Current Tier</span>
                <span className="text-base font-black text-slate-800 dark:text-white mt-1 block">{currentPlanName}</span>
              </div>
              <div className="pt-3 sm:pt-0 sm:pl-4">
                <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Billing Renewal</span>
                <span className="text-sm font-bold text-slate-800 dark:text-white mt-1 block">
                  {stats?.periodEnd ? dayjs(stats.periodEnd).format('MMMM DD, YYYY') : 'End of Trial'}
                </span>
              </div>
              <div className="pt-3 sm:pt-0 sm:pl-4">
                <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Trial Period</span>
                {stats?.status === 'trialing' ? (
                  <span className="text-sm font-bold text-blue-500 flex items-center gap-1 mt-1">
                    <FaHourglassHalf className="animate-spin" /> {stats.trialRemainingDays} Days Remaining
                  </span>
                ) : (
                  <span className="text-sm font-bold text-emerald-500 flex items-center gap-1 mt-1">
                    <FaCheckCircle /> Fully Subscribed
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Usage Metrics Progress bars */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Active Plan Quota Utilization</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Appointments */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Monthly Appointments:</span>
                  <span>{usage.appointments} / {limits.max_appointments_monthly}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full rounded-full transition-all" 
                    style={{ width: `${Math.min(100, (usage.appointments / limits.max_appointments_monthly) * 100)}%` }} 
                  />
                </div>
              </div>

              {/* AI Requests */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>AI Assistants allowance:</span>
                  <span>{usage.ai_requests} / {limits.ai_allowance}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all" 
                    style={{ width: `${Math.min(100, (usage.ai_requests / limits.ai_allowance) * 100)}%` }} 
                  />
                </div>
              </div>

              {/* WhatsApp Messages */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>WhatsApp Notifications:</span>
                  <span>{usage.whatsapp_messages} / {limits.whatsapp_allowance}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all" 
                    style={{ width: `${Math.min(100, (usage.whatsapp_messages / limits.whatsapp_allowance) * 100)}%` }} 
                  />
                </div>
              </div>

              {/* Email Alerts */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Email credits allowance:</span>
                  <span>{usage.emails} / {limits.email_allowance}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-sky-500 h-full rounded-full transition-all" 
                    style={{ width: `${Math.min(100, (usage.emails / limits.email_allowance) * 100)}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Upgrade Cards list */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-850 dark:text-white">Upgrade Clinic Plan</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { id: 1, name: 'Free Trial', price: '$0', desc: 'Ideal for trial evaluation', features: ['1 Doctor slot', '50 Appts/Mo', 'Basic AI responses'] },
                { id: 2, name: 'Clinic Pro', price: '$99/Mo', desc: 'For growing clinics', features: ['5 Doctor slots', '500 Appts/Mo', 'AI Doctor SOAP notes', 'WhatsApp notifications'] },
                { id: 3, name: 'Enterprise AI', price: '$249/Yr', desc: 'All-inclusive powerhouse', features: ['Unlimited slots', 'Unlimited Appts', 'Predictive BI Analytics', 'API access'] }
              ].map(plan => (
                <div key={plan.id} className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-xs space-y-4 flex flex-col justify-between ${
                  stats?.planId === plan.id ? 'border-blue-500 ring-2 ring-blue-500/25' : 'border-slate-150 dark:border-slate-800'
                }`}>
                  <div className="space-y-2">
                    <h4 className="text-sm font-black text-slate-850 dark:text-white">{plan.name}</h4>
                    <p className="text-xs text-gray-400 leading-snug">{plan.desc}</p>
                    <div className="text-2xl font-black text-slate-800 dark:text-white py-2">{plan.price}</div>
                    <ul className="text-[10px] font-bold text-slate-600 dark:text-slate-400 space-y-1">
                      {plan.features.map((f, i) => <li key={i}>• {f}</li>)}
                    </ul>
                  </div>

                  <button
                    disabled={upgrading || stats?.planId === plan.id}
                    onClick={() => handleUpgrade(plan.id)}
                    className={`w-full py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs ${
                      stats?.planId === plan.id 
                        ? 'bg-slate-100 text-slate-400 cursor-default'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <FaArrowCircleUp /> {stats?.planId === plan.id ? 'Current Plan' : 'Select Upgrade'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Invoice history list */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col space-y-4 h-[600px]">
          <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FaFileInvoiceDollar className="text-[#0066FF]" /> Billing Invoice History
          </h3>
          <p className="text-xs text-gray-400">Download details, printable receipts, and billing records of past payment renewals.</p>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40 space-y-3">
            {invoices.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400">No invoice records found.</div>
            ) : (
              invoices.map(inv => (
                <div key={inv.id} className="pt-3 flex justify-between items-start gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black text-[#0066FF] block">{inv.invoice_number}</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-white block">
                      ${(parseFloat(inv.amount) + parseFloat(inv.gst_amount)).toFixed(2)}
                    </span>
                    <span className="text-[9px] text-gray-450 block">Paid via {inv.payment_method}</span>
                  </div>
                  <a
                    href={`${api.defaults.baseURL}/billing/invoices/${inv.id}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-extrabold text-blue-500 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <FaFileInvoiceDollar /> Print Receipt
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
