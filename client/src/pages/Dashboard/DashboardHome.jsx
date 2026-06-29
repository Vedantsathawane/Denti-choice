import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaCalendarAlt, FaCheckCircle, FaSpinner, FaTimesCircle, FaUserMd,
  FaConciergeBell, FaEnvelope, FaArrowUp, FaClock, FaUser
} from 'react-icons/fa';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { dashboardService } from '../../services/dataService';
import { useSocket } from '../../hooks/useSocket';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatTime, formatDateShort } from '../../utils/helpers';
import { useTheme } from '../../hooks/useTheme';

const BLUE_COLORS = ['#0077B6', '#00B4D8', '#90E0EF', '#0096D6', '#005A8C'];
const PINK_COLORS = ['#DB2777', '#EC4899', '#F472B6', '#F43F5E', '#FDA4AF'];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80 } }
};

const DashboardHome = () => {
  const { darkMode } = useTheme();
  const activeColors = darkMode ? BLUE_COLORS : PINK_COLORS;
  const monthlyStrokeColor = darkMode ? '#0077B6' : '#EC4899';
  const monthlyFillColor = darkMode ? '#0077B6' : '#EC4899';

  const [stats, setStats] = useState(null);
  const [recentData, setRecentData] = useState({ recent: [], today: [] });
  const [chartData, setChartData] = useState({ monthly: [], popular: [] });
  const [loading, setLoading] = useState(true);
  const [year] = useState(new Date().getFullYear());
  const { socket } = useSocket();

  const fetchDashboardData = async () => {
    try {
      const [statsRes, recentRes, chartRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecent(),
        dashboardService.getChartData(year)
      ]);

      setStats(statsRes.data.data);
      setRecentData(recentRes.data.data);
      setChartData(chartRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [year]);

  // Join dashboard room and listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    socket.emit('join:dashboard');

    const handleDashboardUpdate = () => {
      console.log('🔄 Dashboard updating in real-time...');
      fetchDashboardData();
    };

    socket.on('dashboard:update', handleDashboardUpdate);
    socket.on('appointment:booked', handleDashboardUpdate);
    socket.on('appointment:statusChanged', handleDashboardUpdate);

    return () => {
      socket.off('dashboard:update', handleDashboardUpdate);
      socket.off('appointment:booked', handleDashboardUpdate);
      socket.off('appointment:statusChanged', handleDashboardUpdate);
    };
  }, [socket]);

  if (loading || !stats) {
    return <LoadingSpinner fullPage />;
  }

  // Parse chart data for Recharts
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedMonthlyData = monthNames.map((name, index) => {
    const monthIndex = index + 1;
    const found = chartData.monthly.find(item => item.month === monthIndex);
    return {
      name,
      Appointments: found ? found.count : 0
    };
  });

  const formattedPopularData = chartData.popular.map(item => ({
    name: item.name,
    Count: item.booking_count
  }));

  const statCards = [
    {
      title: "Today's Appointments",
      value: stats.todayAppointments,
      icon: FaClock,
      color: 'bg-primary-light/10 text-primary-light',
      border: 'border-primary-light/20'
    },
    {
      title: 'Total Appointments',
      value: stats.appointments.total,
      icon: FaCalendarAlt,
      color: 'bg-primary/10 text-primary',
      border: 'border-primary/20'
    },
    {
      title: 'Pending Confirmation',
      value: stats.appointments.pending,
      icon: FaSpinner,
      color: 'bg-warning/10 text-warning',
      border: 'border-warning/20'
    },
    {
      title: 'Confirmed Appointments',
      value: stats.appointments.confirmed,
      icon: FaCheckCircle,
      color: 'bg-success/10 text-success',
      border: 'border-success/20'
    },
    {
      title: 'Completed',
      value: stats.appointments.completed,
      icon: FaCheckCircle,
      color: 'bg-info/10 text-info',
      border: 'border-info/20'
    },
    {
      title: 'Cancelled',
      value: stats.appointments.cancelled,
      icon: FaTimesCircle,
      color: 'bg-danger/10 text-danger',
      border: 'border-danger/20'
    },
    {
      title: 'Active Doctors',
      value: stats.doctors,
      icon: FaUserMd,
      color: 'bg-accent-dark/40 text-primary-dark',
      border: 'border-accent-dark/60'
    },
    {
      title: 'Active Services',
      value: stats.services,
      icon: FaConciergeBell,
      color: 'bg-secondary/10 text-secondary',
      border: 'border-secondary/20'
    },
    {
      title: 'Unread Messages',
      value: stats.unreadMessages,
      icon: FaEnvelope,
      color: 'bg-purple-500/10 text-purple-600',
      border: 'border-purple-500/20'
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={idx}
              variants={itemVariants}
              className={`p-5 bg-white dark:bg-gray-900 border rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow ${card.border}`}
            >
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
                <Icon className="text-xl" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Appointment Trends */}
        <motion.div
          variants={itemVariants}
          className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Appointments ({year})</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedMonthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAppts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={monthlyFillColor} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={monthlyFillColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100 dark:stroke-gray-800" />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="Appointments" stroke={monthlyStrokeColor} strokeWidth={2} fillOpacity={1} fill="url(#colorAppts)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Popular Services Chart */}
        <motion.div
          variants={itemVariants}
          className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Popular Dental Services</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedPopularData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100 dark:stroke-gray-800" />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="Count" radius={[6, 6, 0, 0]}>
                  {formattedPopularData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={activeColors[index % activeColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Bottom Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm flex flex-col"
        >
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FaClock className="text-primary" /> Today's Schedule
            </h3>
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
              {recentData.today.length} scheduled
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto max-h-[350px] pr-1">
            {recentData.today.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <FaCalendarAlt className="text-4xl mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No appointments scheduled for today.</p>
              </div>
            ) : (
              recentData.today.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800/40 rounded-xl hover:bg-gray-100/70 dark:hover:bg-gray-800/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {appt.patient_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{appt.patient_name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {appt.service_name} • Dr. {appt.doctor_name.split(' ').pop()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-semibold text-primary block">
                      {formatTime(appt.appointment_time)}
                    </span>
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      appt.status === 'confirmed' ? 'bg-success/15 text-success' :
                      appt.status === 'completed' ? 'bg-info/15 text-info' : 'bg-warning/15 text-warning'
                    }`}>
                      {appt.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Recent Bookings */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm flex flex-col"
        >
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FaUser className="text-secondary" /> Recent Bookings
            </h3>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto max-h-[350px] pr-1">
            {recentData.recent.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <p className="text-sm">No recent bookings found.</p>
              </div>
            ) : (
              recentData.recent.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800/40 rounded-xl hover:bg-gray-100/70 dark:hover:bg-gray-800/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center font-bold text-sm shrink-0">
                      {appt.patient_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{appt.patient_name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {appt.service_name} • {formatDateShort(appt.appointment_date)} at {formatTime(appt.appointment_time)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">
                      {formatCurrency(appt.service_price)}
                    </span>
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      appt.status === 'confirmed' ? 'bg-success/15 text-success' :
                      appt.status === 'completed' ? 'bg-info/15 text-info' :
                      appt.status === 'cancelled' ? 'bg-danger/15 text-danger' : 'bg-warning/15 text-warning'
                    }`}>
                      {appt.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardHome;
