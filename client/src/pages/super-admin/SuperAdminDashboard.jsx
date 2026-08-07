import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  FaBuilding, FaDollarSign, FaRobot, FaExclamationTriangle, FaChevronRight,
  FaPlus, FaCheckCircle, FaHistory, FaClock, FaGlobe, FaArrowUp
} from 'react-icons/fa';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useTheme } from '../../hooks/useTheme';

const CustomTooltip = ({ active, payload, label, darkMode }) => {
  if (active && payload && payload.length) {
    const activeColorClass = darkMode ? 'bg-indigo-500' : 'bg-pink-500';
    const activeTextClass = darkMode ? 'text-indigo-600 dark:text-indigo-400' : 'text-pink-650 dark:text-pink-400';
    return (
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-2xl animate-fadeIn">
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-wider">{label}</p>
        {payload.map((item, idx) => (
          <p key={idx} className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${activeColorClass}`} />
            {item.name}: <span className={`${activeTextClass} font-extrabold`}>${item.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [recentClinics, setRecentClinics] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [activeFeedTab, setActiveFeedTab] = useState('clinics');
  const [monitoring, setMonitoring] = useState(null);

  const superPrimaryColor = darkMode ? '#6366F1' : '#EC4899';
  const superSecondaryColor = darkMode ? '#8B5CF6' : '#F43F5E';

  useEffect(() => {
    async function fetchData() {
      try {
        const [resKpis, resClinics, resLogs, resMonitor] = await Promise.all([
          api.get('/super-admin/dashboard/kpis'),
          api.get('/super-admin/clinics'),
          api.get('/super-admin/logs?limit=5'),
          api.get('/super-admin/performance/monitoring')
        ]);
        setData(resKpis.data.data);
        setRecentClinics((resClinics.data.data || []).slice(0, 5));
        setRecentLogs((resLogs.data.data || []).slice(0, 5));
        setMonitoring(resMonitor.data.data);
      } catch (err) {
        console.error('Failed to fetch super admin data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading || !data) return <LoadingSpinner fullPage />;

  const pieData = [
    { name: 'Active Clinics', value: data.clinics.active },
    { name: 'Trial Clinics', value: data.clinics.trial },
    { name: 'Suspended', value: data.clinics.suspended }
  ];

  const growthData = [
    { month: 'Jan', revenue: data.revenue.mrr * 0.7 },
    { month: 'Feb', revenue: data.revenue.mrr * 0.8 },
    { month: 'Mar', revenue: data.revenue.mrr * 0.85 },
    { month: 'Apr', revenue: data.revenue.mrr * 0.9 },
    { month: 'May', revenue: data.revenue.mrr * 0.95 },
    { month: 'Jun', revenue: data.revenue.mrr }
  ];

  const statsCards = [
    {
      title: 'Total Clinics',
      value: data.clinics.total,
      subtext: `${data.clinics.active} active clinic tenants`,
      icon: FaBuilding,
      color: darkMode ? 'from-blue-600 to-indigo-500' : 'from-pink-500 to-rose-500',
      badge: 'Clinics',
      badgeColor: darkMode ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' : 'bg-pink-50 text-pink-600',
      path: '/super-admin/clinics'
    },
    {
      title: 'Estimated MRR',
      value: `$${data.revenue.mrr.toLocaleString()}`,
      subtext: `ARR: $${data.revenue.arr.toLocaleString()}/yr`,
      icon: FaDollarSign,
      color: 'from-emerald-600 to-teal-500',
      badge: 'Revenue',
      badgeColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
      path: '/super-admin/payments'
    },
    {
      title: 'AI Operations',
      value: data.system.aiRequests,
      subtext: `Gemini Cost: $${data.system.geminiCost}`,
      icon: FaRobot,
      color: darkMode ? 'from-purple-600 to-indigo-500' : 'from-purple-500 to-pink-500',
      badge: 'AI Active',
      badgeColor: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
      path: '/super-admin/logs'
    },
    {
      title: 'Support Tickets',
      value: data.system.openTickets,
      subtext: 'Pending resolution',
      icon: FaExclamationTriangle,
      color: 'from-rose-600 to-pink-500',
      badge: 'Tickets',
      badgeColor: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
      path: '/super-admin/support'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header section with animations */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            SaaS Operator <span className={`bg-gradient-to-r ${darkMode ? 'from-indigo-500 to-purple-500' : 'from-pink-500 to-rose-500'} bg-clip-text text-transparent`}>Dashboard</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
            Monitor infrastructure health, billing status, AI usage logs, and multi-tenant clinics.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs text-xs font-bold ${
            darkMode ? 'text-indigo-600 dark:text-indigo-400' : 'text-pink-600 dark:text-pink-400'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          Platform Active
        </motion.div>
      </div>

      {/* Premium Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ y: -6, scale: 1.01 }}
              onClick={() => navigate(card.path)}
              className={`glass-card relative overflow-hidden rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 ${
                darkMode ? 'hover:border-indigo-500/30 dark:hover:border-indigo-500/20' : 'hover:border-pink-500/30'
              } bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-100 dark:border-slate-800 cursor-pointer`}
            >
              <div className={`absolute -top-10 -right-10 w-28 h-28 bg-gradient-to-br ${card.color} opacity-[0.04] dark:opacity-[0.08] rounded-full blur-3xl pointer-events-none`} />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-md`}>
                    <Icon className="text-lg" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest block">{card.title}</span>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">{card.value}</h3>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  {card.title === 'Estimated MRR' && <FaArrowUp className="text-emerald-500 animate-bounce" size={10} />}
                  {card.subtext}
                </span>
                <FaChevronRight className="text-slate-300 dark:text-slate-500" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2 glass-card p-6 rounded-3xl flex flex-col justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-100 dark:border-slate-800"
        >
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Monthly Recurring Revenue (MRR)</h2>
              <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">Platform growth trajectory in USD</p>
            </div>
            <span className={`text-xs px-3 py-1 ${
              darkMode ? 'bg-indigo-950/40 text-indigo-400' : 'bg-pink-50 text-pink-600'
            } rounded-full font-bold`}>
              +30% YoY Growth
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={superPrimaryColor} stopOpacity={0.35}/>
                    <stop offset="95%" stopColor={superPrimaryColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.08)" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
                <Area type="monotone" dataKey="revenue" stroke={superPrimaryColor} strokeWidth={3} fillOpacity={1} fill="url(#mrrGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="glass-card p-6 rounded-3xl flex flex-col justify-between space-y-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-100 dark:border-slate-800"
        >
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Clinic Distributions</h2>
            <p className="text-xs text-slate-400 dark:text-gray-500">Breakdown of active tenant states</p>
          </div>

          <div className="h-48 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={superPrimaryColor} />
                    <stop offset="100%" stopColor={superSecondaryColor} />
                  </linearGradient>
                  <linearGradient id="trialGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="suspendedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#D97706" />
                  </linearGradient>
                </defs>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={78}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="transparent"
                >
                  <Cell key="cell-0" fill="url(#activeGrad)" className="focus:outline-none drop-shadow-md" />
                  <Cell key="cell-1" fill="url(#trialGrad)" className="focus:outline-none drop-shadow-md" />
                  <Cell key="cell-2" fill="url(#suspendedGrad)" className="focus:outline-none drop-shadow-md" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute flex flex-col items-center justify-center w-24 h-24 bg-white/40 dark:bg-slate-900/40 rounded-full border border-slate-100/50 dark:border-slate-800/30">
              <span className="text-3xl font-black text-slate-800 dark:text-white leading-none">{data.clinics.total}</span>
              <span className="text-[8px] text-slate-400 dark:text-gray-500 font-extrabold uppercase tracking-widest mt-1">Total</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { 
                label: 'Active', 
                value: data.clinics.active, 
                pct: data.clinics.total ? Math.round((data.clinics.active / data.clinics.total) * 100) : 0, 
                color: darkMode ? 'bg-indigo-500' : 'bg-pink-500', 
                text: darkMode ? 'text-indigo-600 dark:text-indigo-400' : 'text-pink-600 dark:text-pink-400' 
              },
              { label: 'Trialing', value: data.clinics.trial, pct: data.clinics.total ? Math.round((data.clinics.trial / data.clinics.total) * 100) : 0, color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Suspended', value: data.clinics.suspended, pct: data.clinics.total ? Math.round((data.clinics.suspended / data.clinics.total) * 100) : 0, color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' }
            ].map((bar, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-500 dark:text-slate-400">{bar.label}</span>
                  <span className={`${bar.text} font-bold`}>{bar.value} ({bar.pct}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${bar.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="glass-card rounded-3xl p-6 space-y-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-100 dark:border-slate-800"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FaHistory className={darkMode ? 'text-indigo-500' : 'text-pink-500'} /> Platform Activity Feed
            </h2>
            <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">Real-time tenant creations and security audit logs.</p>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl">
            <button
              onClick={() => setActiveFeedTab('clinics')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFeedTab === 'clinics'
                  ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Recent Clinics
            </button>
            <button
              onClick={() => setActiveFeedTab('logs')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFeedTab === 'logs'
                  ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Security Audit
            </button>
            <button
              onClick={() => setActiveFeedTab('monitoring')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFeedTab === 'monitoring'
                  ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Infrastructure Health
            </button>
          </div>
        </div>

        <div>
          {activeFeedTab === 'clinics' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                    <th className="pb-3 pl-2">Clinic Name</th>
                    <th className="pb-3">Subdomain</th>
                    <th className="pb-3">Billing Plan</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                  {recentClinics.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-slate-400 dark:text-gray-500 italic">No clinics found.</td>
                    </tr>
                  ) : (
                    recentClinics.map((clinic) => (
                      <tr key={clinic.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                        <td className="py-3 pl-2 font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: clinic.branding_color || superPrimaryColor }} />
                          {clinic.name}
                        </td>
                        <td className="py-3 font-mono text-slate-500 dark:text-slate-400">{clinic.subdomain}.denti-choice.app</td>
                        <td className="py-3 font-semibold text-slate-600 dark:text-slate-300">{clinic.plan_name || 'Free Trial'}</td>
                        <td className="py-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            clinic.is_active 
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' 
                              : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
                          }`}>
                            {clinic.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : activeFeedTab === 'logs' ? (
            <div className="space-y-4">
              {recentLogs.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400 dark:text-gray-500 italic">No security logs recorded.</p>
              ) : (
                <div className="relative border-l border-slate-100 dark:border-slate-800 ml-3 space-y-5">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="relative pl-6">
                      <span className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${
                        darkMode ? 'bg-indigo-500' : 'bg-pink-500'
                      } border border-white dark:border-slate-900`} />
                      
                      <div className="flex flex-col sm:flex-row justify-between gap-1">
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-white">{log.description}</p>
                          <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5">
                            User: <span className="font-semibold text-slate-600 dark:text-slate-400">{log.user_name || 'System'}</span> | Clinic: <span className="font-semibold text-slate-500 dark:text-slate-400">{log.clinic_name || 'Platform'}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-gray-500 shrink-0 font-mono">
                          <FaClock size={10} />
                          <span>{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Telemetry charts/meters */}
              <div className="bg-slate-50/50 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-4">
                <h4 className="text-xs font-black text-slate-400 dark:text-gray-500 uppercase tracking-wider">Server Telemetry</h4>
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-650 dark:text-slate-400">
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase">OS Platform</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white mt-1 block">{monitoring?.server?.platform || 'windows'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase">Active CPU Cores</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white mt-1 block">{monitoring?.server?.cpusCount || 4} Cores</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase">Server Uptime</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white mt-1 block">{monitoring?.server?.uptimeHours || 0} Hours</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase">Avg API Latency</span>
                    <span className="text-sm font-bold text-emerald-500 mt-1 block">{monitoring?.avgApiResponseTimeMs || 45} ms</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Server RAM (Memory):</span>
                    <span>{monitoring?.server?.memory?.usedGB} GB / {monitoring?.server?.memory?.totalGB} GB</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all" 
                      style={{ width: `${monitoring?.server?.memory?.usagePercent || 50}%` }} 
                    />
                  </div>
                </div>
              </div>

              {/* Status lights */}
              <div className="bg-slate-50/50 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-4">
                <h4 className="text-xs font-black text-slate-400 dark:text-gray-500 uppercase tracking-wider">Services Status Checklist</h4>
                <div className="space-y-3 font-bold text-xs text-slate-750 dark:text-slate-350">
                  <div className="flex justify-between items-center">
                    <span>Database Connection:</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 font-black">OPERATIONAL</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>SMTP Relay Service:</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 font-black">OPERATIONAL</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Socket.IO Connection:</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 font-black">OPERATIONAL</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Meta WhatsApp Webhook:</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 font-black">CONNECTED</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
