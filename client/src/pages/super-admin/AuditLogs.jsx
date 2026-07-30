import { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FaShieldAlt } from 'react-icons/fa';
import { useTheme } from '../../hooks/useTheme';

export default function AuditLogs() {
  const { darkMode } = useTheme();

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await api.get('/super-admin/logs');
        setLogs(res.data.data || []);
      } catch (err) {
        console.error('Failed to load audit logs:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FaShieldAlt className={darkMode ? 'text-indigo-500' : 'text-pink-500'} /> Platform Security & Audit Trails
        </h1>
        <p className="text-gray-500 dark:text-gray-400">View system-wide activity logs, admin alterations, and API interactions in real-time.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Log ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Tenant Clinic</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Actor</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Action type</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Description</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">IP Address</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                    No security audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      #{log.id}
                    </td>
                    <td className="px-6 py-4 font-bold text-xs text-gray-700 dark:text-gray-300">
                      {log.clinic_name || 'Global SaaS'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-gray-800 dark:text-white">{log.user_name || 'SYSTEM'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs uppercase font-extrabold px-2 py-0.5 rounded ${darkMode ? 'text-indigo-400 bg-indigo-950/30' : 'text-pink-650 bg-pink-50 dark:text-pink-400 dark:bg-pink-950/20'}`}>
                        {log.action_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-400">
                      {log.description}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-400">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
