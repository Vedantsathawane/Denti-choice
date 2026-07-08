import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { toast } from 'react-toastify';
import {
  FaTooth, FaChartPie, FaCalendarAlt, FaUserMd, FaConciergeBell,
  FaStar, FaEnvelope, FaCog, FaUser, FaSignOutAlt, FaBars, FaTimes,
  FaBell, FaMoon, FaSun, FaTrash
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useSocket } from '../../hooks/useSocket';
import { notificationService } from '../../services/dataService';
import { getInitials, getApiImageUrl } from '../../utils/helpers';
import Swal from 'sweetalert2';

dayjs.extend(relativeTime);

const sidebarLinks = [
  { name: 'Dashboard', path: '/dashboard', icon: FaChartPie, end: true },
  { name: 'Appointments', path: '/dashboard/appointments', icon: FaCalendarAlt },
  { name: 'Doctors', path: '/dashboard/doctors', icon: FaUserMd },
  { name: 'Services', path: '/dashboard/services', icon: FaConciergeBell },
  { name: 'Testimonials', path: '/dashboard/testimonials', icon: FaStar },
  { name: 'Messages', path: '/dashboard/messages', icon: FaEnvelope },
  { name: 'Settings', path: '/dashboard/settings', icon: FaCog },
  { name: 'Profile', path: '/dashboard/profile', icon: FaUser }
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  // Notification States
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getAll({ page: 1, limit: 10 });
      setNotifications(res.data.data || []);
      const countRes = await notificationService.getUnreadCount();
      setUnreadCount(countRes.data.data?.count || 0);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join:dashboard');

    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 10));
      setUnreadCount((prev) => prev + 1);
      
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.4;
        audio.play().catch(() => {});
      } catch (e) {}

      toast.info(`🔔 ${notification.title}: ${notification.message}`);
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket]);

  const handleMarkAsRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  };

  const handleDeleteNotification = async (e, id, isRead) => {
    e.stopPropagation();
    try {
      await notificationService.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (!isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification', error);
    }
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to logout?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0077B6',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Logout'
    });

    if (result.isConfirmed) {
      await logout();
      navigate('/login');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 px-5 h-16 border-b border-gray-200 dark:border-gray-800">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <FaTooth className="text-white text-sm" />
            </div>
            <span className="font-bold text-lg gradient-text">Denti-Choice</span>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-gray-500">
              <FaTimes />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {sidebarLinks.map(({ name, path, icon: Icon, end }) => (
              <NavLink
                key={path}
                to={path}
                end={end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'gradient-primary text-white shadow-md shadow-primary/25'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                <Icon className="text-base" />
                {name}
              </NavLink>
            ))}
          </nav>

          {/* Bottom */}
          <div className="px-3 pb-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
            >
              <FaSignOutAlt />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <FaBars />
            </button>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white hidden sm:block">Admin Dashboard</h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {darkMode ? <FaSun className="text-yellow-400" /> : <FaMoon />}
            </button>

            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative cursor-pointer"
              >
                <FaBell />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    {/* Backdrop to close dropdown on click outside */}
                    <div
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setShowNotifications(false)}
                    />
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 origin-top-right"
                    >
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
                        <span className="font-bold text-gray-800 dark:text-white text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-primary hover:text-primary-dark font-semibold flex items-center gap-1 cursor-pointer hover:underline"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      {/* Notification List */}
                      <div className="max-h-[350px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                        {notifications.length === 0 ? (
                          <div className="py-8 px-4 text-center text-gray-400 dark:text-gray-500 text-sm">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => {
                            const isUnread = !n.is_read;
                            let TypeIcon = FaBell;
                            let iconColor = 'text-gray-400 bg-gray-100 dark:bg-gray-800 dark:text-gray-500';
                            
                            if (n.type === 'appointment') {
                              TypeIcon = FaCalendarAlt;
                              iconColor = 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400';
                            } else if (n.type === 'message') {
                              TypeIcon = FaEnvelope;
                              iconColor = 'text-sky-500 bg-sky-50 dark:bg-sky-950/30 dark:text-sky-400';
                            } else if (n.type === 'alert') {
                              iconColor = 'text-red-500 bg-red-50 dark:bg-red-950/30 dark:text-red-400';
                            }

                            return (
                              <div
                                key={n.id}
                                onClick={() => handleMarkAsRead(n.id, n.is_read)}
                                className={`p-4 flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors cursor-pointer relative ${
                                  isUnread ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''
                                }`}
                              >
                                {/* Indicator dot */}
                                {isUnread && (
                                  <span className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full" />
                                )}

                                {/* Icon */}
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
                                  <TypeIcon className="text-sm" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 pr-4">
                                  <h4 className={`text-xs font-semibold text-gray-800 dark:text-white truncate ${isUnread ? 'font-bold' : ''}`}>
                                    {n.title}
                                  </h4>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                    {n.message}
                                  </p>
                                  <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-1.5">
                                    {dayjs(n.created_at).fromNow()}
                                  </span>
                                </div>

                                {/* Actions (Delete button) */}
                                <div className="flex items-center">
                                  <button
                                    onClick={(e) => handleDeleteNotification(e, n.id, n.is_read)}
                                    className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                    title="Delete"
                                  >
                                    <FaTrash className="text-xs" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <NavLink
              to="/dashboard/profile"
              className="flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-gray-700"
            >
              {user?.avatar ? (
                <img
                  src={getApiImageUrl(user.avatar)}
                  alt={user.name}
                  className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-800"
                />
              ) : (
                <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-semibold">
                  {getInitials(user?.name)}
                </div>
              )}
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-800 dark:text-white leading-tight">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
              </div>
            </NavLink>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
