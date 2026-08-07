import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaWhatsapp, FaLink, FaHistory, FaCheckCircle, FaExclamationTriangle, FaChartArea } from 'react-icons/fa';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import dayjs from 'dayjs';

export default function SuperAdminWhatsApp() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    connectedClinics: [],
    stats: { totalInbound: 0, totalOutbound: 0, sent: 0, delivered: 0, read: 0, failed: 0, successRatePercent: 100 },
    dailyVolume: []
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.get('/super-admin/whatsapp/stats');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load Super Admin WhatsApp stats:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
          <FaWhatsapp className="text-emerald-500" /> Platform WhatsApp <span className="bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text text-transparent">Operator</span>
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
          Global analytics console monitoring multi-tenant API integrations, active display channels, daily message volume trends, and webhook sync flags.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Active Channels</span>
            <h4 className="text-xl font-black text-slate-800 dark:text-white">{data.connectedClinics.length} Connected</h4>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
            <FaLink size={18} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total Outbound</span>
            <h4 className="text-xl font-black text-slate-800 dark:text-white">{data.stats.totalOutbound} Messages</h4>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-xs">
            <FaHistory size={18} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Inbound Received</span>
            <h4 className="text-xl font-black text-slate-800 dark:text-white">{data.stats.totalInbound} Messages</h4>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
            <FaWhatsapp size={18} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Platform Success Rate</span>
            <h4 className="text-xl font-black text-emerald-500">{data.stats.successRatePercent}%</h4>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-xs">
            <FaCheckCircle size={18} />
          </div>
        </div>
      </div>

      {/* Chart Volume & Clinic List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Daily Volume trends */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col space-y-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FaChartArea className="text-[#0066FF]" /> 30-Day Platform Messages Volume
          </h3>
          <div className="w-full h-[300px]">
            {data.dailyVolume.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">No message activity recorded in the past 30 days.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailyVolume}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(tick) => dayjs(tick).format('MMM DD')} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip labelFormatter={(label) => dayjs(label).format('MMMM DD, YYYY')} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} />
                  <Area type="monotone" dataKey="count" name="Messages Count" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Connected Clinics Details */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4 flex flex-col">
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Active Tenants Details</h3>
          <div className="flex-1 overflow-y-auto space-y-3 max-h-[300px]">
            {data.connectedClinics.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400">No clinics have linked their Meta credentials yet.</div>
            ) : (
              data.connectedClinics.map(c => (
                <div key={c.clinic_id} className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl flex justify-between items-center border border-slate-100 dark:border-slate-800/40">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white">{c.clinic_name}</h4>
                    <p className="text-[10px] text-gray-400 font-semibold">{c.display_name || 'No number display name'}</p>
                    <span className="text-[9px] text-gray-500 font-bold block">Mapped ID: #{c.clinic_id}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      c.api_status === 'live' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30'
                    }`}>
                      {c.api_status}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      c.webhook_status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/30'
                    }`}>
                      Webhooks: {c.webhook_status}
                    </span>
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
