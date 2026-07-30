import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTooth, FaChartPie, FaBuilding, FaCreditCard, FaQuestionCircle,
  FaCog, FaSignOutAlt, FaBars, FaTimes, FaMoon, FaSun, FaHistory, FaLaptop
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import Swal from 'sweetalert2';

const superAdminLinks = [
  { name: 'Dashboard', path: '/super-admin/dashboard', icon: FaChartPie, end: true },
  { name: 'Clinics', path: '/super-admin/clinics', icon: FaBuilding },
  { name: 'Website Builder', path: '/super-admin/website-builder', icon: FaLaptop },
  { name: 'Subscriptions', path: '/super-admin/subscriptions', icon: FaCreditCard },
  { name: 'Payments', path: '/super-admin/payments', icon: FaCreditCard },
  { name: 'Support', path: '/super-admin/support', icon: FaQuestionCircle },
  { name: 'Settings', path: '/super-admin/settings', icon: FaCog },
  { name: 'Audit Logs', path: '/super-admin/logs', icon: FaHistory }
];

const SuperAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to logout from Super Admin?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: darkMode ? '#6366F1' : '#EC4899',
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
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${
              darkMode ? 'from-indigo-600 to-purple-500' : 'from-pink-500 to-rose-500'
            } flex items-center justify-center`}>
              <FaTooth className="text-white text-sm" />
            </div>
            <span className={`font-bold text-lg bg-gradient-to-r ${
              darkMode ? 'from-indigo-500 to-purple-500' : 'from-pink-600 to-rose-500'
            } bg-clip-text text-transparent`}>
              Dentist-Choice
            </span>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-gray-500">
              <FaTimes />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {superAdminLinks.map(({ name, path, icon: Icon, end }) => (
              <NavLink
                key={path}
                to={path}
                end={end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? `bg-gradient-to-r ${
                          darkMode 
                            ? 'from-indigo-600 to-purple-500 shadow-indigo-600/25' 
                            : 'from-pink-600 to-rose-500 shadow-pink-500/25'
                        } text-white shadow-md`
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
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full cursor-pointer"
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
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white hidden sm:block">SaaS Super Admin Portal</h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {darkMode ? <FaSun className="text-yellow-400" /> : <FaMoon />}
            </button>

            <div className="flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-gray-700">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${
                darkMode ? 'from-indigo-600 to-purple-500' : 'from-pink-500 to-rose-500'
              } flex items-center justify-center text-white text-sm font-semibold`}>
                SA
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-800 dark:text-white leading-tight">{user?.name || 'Super Admin'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">SaaS Platform Operator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50 dark:bg-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
