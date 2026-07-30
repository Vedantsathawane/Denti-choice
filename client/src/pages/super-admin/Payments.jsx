import { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FaFileInvoiceDollar, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

export default function Payments() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    async function fetchPayments() {
      try {
        const res = await api.get('/super-admin/payments');
        setPayments(res.data.data || []);
      } catch (err) {
        console.error('Failed to load payments history', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, []);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transaction Logs</h1>
        <p className="text-gray-500 dark:text-gray-400">Billing invoice and payment transaction records across all tenant clinics.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Transaction ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Tenant Clinic</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Payment Method</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-gray-800 dark:text-white">
                      {p.transaction_id || `TXN-${p.id}`}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{p.clinic_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-extrabold text-gray-900 dark:text-white">${p.amount} {p.currency}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        p.status === 'completed' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                      }`}>
                        {p.status === 'completed' ? <FaCheckCircle /> : <FaExclamationCircle />}
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">
                      {p.payment_method || 'stripe'}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-400">
                      {new Date(p.created_at).toLocaleString()}
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
