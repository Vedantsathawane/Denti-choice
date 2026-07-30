import { useState, useEffect } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FaRegQuestionCircle, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { useTheme } from '../../hooks/useTheme';

export default function SupportTickets() {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/super-admin/tickets');
      setTickets(res.data.data || []);
    } catch (err) {
      console.error('Failed to load support tickets:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      await api.post(`/super-admin/tickets/${selectedTicketId}/reply`, { reply: replyText });
      Swal.fire('Success', 'Support ticket replied and resolved successfully', 'success');
      setReplyText('');
      setSelectedTicketId(null);
      fetchTickets();
    } catch (err) {
      Swal.fire('Error', 'Failed to reply to ticket', 'error');
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Helpdesk Support Tickets</h1>
        <p className="text-gray-500 dark:text-gray-400">View and respond to support queries filed by tenant clinics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
              <span className="font-bold text-sm text-gray-700 dark:text-gray-300">Open Tickets</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {tickets.length === 0 ? (
                <div className="p-6 text-center text-gray-400 dark:text-gray-500 text-sm">
                  No support tickets found.
                </div>
              ) : (
                tickets.map((t) => (
                  <div 
                    key={t.id} 
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`p-5 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 cursor-pointer transition-colors ${selectedTicketId === t.id ? (darkMode ? 'bg-indigo-950/20 border-l-2 border-indigo-500' : 'bg-pink-50 border-l-2 border-pink-500') : ''}`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className={`text-xs uppercase font-extrabold ${darkMode ? 'text-indigo-400' : 'text-pink-650'} tracking-wider block`}>{t.clinic_name}</span>
                        <h3 className="font-bold text-sm text-gray-800 dark:text-white mt-1">{t.subject}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{t.description}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                        t.status === 'open' 
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400' 
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400">
                      <span>Submitted by: <strong>{t.user_name}</strong></span>
                      <span>{new Date(t.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Selected Ticket Thread / Action Details */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm h-fit">
          {selectedTicketId ? (
            (() => {
              const ticket = tickets.find(t => t.id === selectedTicketId);
              if (!ticket) return null;
              return (
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className={`text-xs font-bold ${darkMode ? 'text-indigo-400' : 'text-pink-650'} uppercase`}>{ticket.clinic_name}</span>
                    <span className="text-xs text-gray-400 font-mono">#{ticket.id}</span>
                  </div>
                  <h3 className="font-bold text-base text-gray-800 dark:text-white">{ticket.subject}</h3>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-xs text-gray-600 dark:text-gray-300 leading-relaxed max-h-48 overflow-y-auto">
                    {ticket.description}
                  </div>

                  <hr className="border-gray-100 dark:border-gray-800" />

                  {ticket.status === 'resolved' ? (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-gray-400 uppercase">Admin Reply</span>
                      <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs text-gray-700 dark:text-gray-300">
                        {ticket.admin_reply}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <FaCheckCircle className="text-emerald-500" /> Resolved on {new Date(ticket.replied_at).toLocaleDateString()}
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleReplySubmit} className="space-y-3">
                      <label className="text-xs font-bold text-gray-400 uppercase">Write Resolution Reply</label>
                      <textarea
                        required
                        rows={5}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Provide details or solution..."
                        className={`w-full bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs dark:text-white focus:outline-none focus:border-${darkMode ? 'indigo' : 'pink'}-500`}
                      />
                      <button 
                        type="submit"
                        className={`w-full py-2.5 ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-pink-600 hover:bg-pink-700'} text-white font-bold rounded-xl text-xs cursor-pointer shadow-md transition-colors`}
                      >
                        Submit Response & Close Ticket
                      </button>
                    </form>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="py-12 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center gap-2">
              <FaRegQuestionCircle className="text-3xl" />
              <span className="text-xs font-semibold">Select a ticket from the list to view or reply.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
