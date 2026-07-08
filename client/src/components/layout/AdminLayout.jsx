import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTooth, FaChartPie, FaCalendarAlt, FaUserMd, FaConciergeBell,
  FaStar, FaEnvelope, FaCog, FaUser, FaSignOutAlt, FaBars, FaTimes,
  FaBell, FaMoon, FaSun
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { getInitials, getApiImageUrl } from '../../utils/helpers';
import Swal from 'sweetalert2';

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

            <button className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative">
              <FaBell />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

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
