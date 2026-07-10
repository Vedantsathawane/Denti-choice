import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaSearch, FaFilter, FaEnvelopeOpen, FaEnvelope, FaReply, FaTrash, FaTimes,
  FaPaperPlane, FaUser, FaPhone, FaCalendarAlt, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { toastError } from '../../services/api';
import { contactService } from '../../services/dataService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/helpers';
import { useSocket } from '../../hooks/useSocket';

const ContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Filters
  const [search, setSearch] = useState('');
  const [isReadFilter, setIsReadFilter] = useState('');

  // Active message detail modal / reply modal
  const [activeMessage, setActiveMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const { socket } = useSocket();

  const fetchMessages = useCallback(async () => {
    try {
      const params = {
        search,
        page,
        limit
      };
      if (isReadFilter !== '') {
        params.is_read = isReadFilter;
      }
      const res = await contactService.getAll(params);
      setMessages(res.data.data || []);
      setTotal(res.data.meta?.total || res.data.data?.length || 0);
    } catch (error) {
      toastError('Failed to load messages.', error);
    } finally {
      setLoading(false);
    }
  }, [search, isReadFilter, page, limit]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Socket update
  useEffect(() => {
    if (!socket) return;
    socket.emit('join:dashboard');

    const handleNewMessage = () => {
      fetchMessages();
    };

    socket.on('message:new', handleNewMessage);
    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [socket, fetchMessages]);

  const handleMarkAsRead = async (msg) => {
    if (msg.is_read === 1) return;
    try {
      await contactService.markAsRead(msg.id);
      fetchMessages();
      // Update details if currently viewing
      if (activeMessage && activeMessage.id === msg.id) {
        setActiveMessage(prev => ({ ...prev, is_read: 1 }));
      }
    } catch {
      toast.error('Failed to mark message as read.');
    }
  };

  const handleOpenDetail = (msg) => {
    setActiveMessage(msg);
    setReplyText('');
    handleMarkAsRead(msg);
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSendingReply(true);
    try {
      await contactService.reply(activeMessage.id, { reply: replyText });
      toast.success('Reply sent successfully!');
      setReplyText('');
      // Refresh details to show reply was stored
      const updated = {
        ...activeMessage,
        admin_reply: replyText,
        replied_at: new Date().toISOString()
      };
      setActiveMessage(updated);
      fetchMessages();
    } catch {
      toast.error('Failed to send email reply.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this message permanently?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete message'
    });

    if (confirm.isConfirmed) {
      try {
        await contactService.delete(id);
        Swal.fire('Deleted!', 'Message has been deleted.', 'success');
        if (activeMessage && activeMessage.id === id) {
          setActiveMessage(null);
        }
        fetchMessages();
      } catch {
        toast.error('Failed to delete message.');
      }
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contact Messages</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">View patient inquiries, reply to emails via SMTP, and manage contact forms.</p>
      </div>

      {/* Filters Banner */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search sender, email, subject..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>

        <select
          value={isReadFilter}
          onChange={e => { setIsReadFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm md:w-48"
        >
          <option value="">All Messages</option>
          <option value="0">Unread</option>
          <option value="1">Read</option>
        </select>
      </div>

      {/* Messages list */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20"><LoadingSpinner /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <FaEnvelope className="text-5xl mx-auto mb-3 text-gray-300 animate-bounce" />
            <h3 className="font-semibold text-lg">No Messages Received</h3>
            <p className="text-sm mt-1">Inbox is empty.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => handleOpenDetail(msg)}
                className={`p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-gray-50/70 dark:hover:bg-gray-800/40 cursor-pointer transition-colors ${
                  msg.is_read === 0 ? 'bg-primary/5 border-l-4 border-primary dark:bg-primary/5' : ''
                }`}
              >
                <div className="flex gap-3 items-start">
                  <div className="mt-1">
                    {msg.is_read === 0 ? (
                      <FaEnvelope className="text-primary text-base" />
                    ) : (
                      <FaEnvelopeOpen className="text-gray-400 text-base" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">{msg.name}</span>
                      <span className="text-xs text-gray-400 font-medium">({msg.email})</span>
                      {msg.admin_reply && (
                        <span className="text-[10px] bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-400 px-2 py-0.5 rounded-full font-bold">
                          Replied
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-snug">
                      {msg.subject || 'No Subject'}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {msg.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 shrink-0 self-end sm:self-center">
                  <span className="flex items-center gap-1.5"><FaCalendarAlt /> {formatDate(msg.created_at)}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(msg.id); }}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg hover:scale-105 transition-all cursor-pointer"
                    title="Delete Message"
                  >
                    <FaTrash className="text-sm" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-800 text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total messages)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
              >
                <FaChevronLeft className="text-xs" />
              </button>
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
              >
                <FaChevronRight className="text-xs" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal View Details / Reply Panel */}
      <AnimatePresence>
        {activeMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveMessage(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 overflow-y-auto max-h-[90vh] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Message Details</h3>
                  <button onClick={() => setActiveMessage(null)} className="text-gray-500 hover:text-gray-700 text-lg cursor-pointer">
                    <FaTimes />
                  </button>
                </div>

                {/* Senders Details */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 border border-gray-100 dark:border-gray-800 rounded-2xl text-xs space-y-2">
                    <h4 className="font-bold text-primary flex items-center gap-1.5"><FaUser /> Sender Details</h4>
                    <p><span className="text-gray-500 dark:text-gray-400 font-medium">Name:</span> <strong>{activeMessage.name}</strong></p>
                    <p><span className="text-gray-500 dark:text-gray-400 font-medium">Email:</span> <strong>{activeMessage.email}</strong></p>
                    {activeMessage.phone && <p><span className="text-gray-500 dark:text-gray-400 font-medium">Phone:</span> <strong>{activeMessage.phone}</strong></p>}
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 border border-gray-100 dark:border-gray-800 rounded-2xl text-xs space-y-2">
                    <h4 className="font-bold text-secondary flex items-center gap-1.5"><FaCalendarAlt /> Metadata</h4>
                    <p><span className="text-gray-500 dark:text-gray-400 font-medium">Received On:</span> <strong>{formatDate(activeMessage.created_at)}</strong></p>
                    <p><span className="text-gray-500 dark:text-gray-400 font-medium">Status:</span> <strong>{activeMessage.is_read === 1 ? 'Read' : 'Unread'}</strong></p>
                  </div>
                </div>

                {/* The Message */}
                <div className="bg-gray-50 dark:bg-gray-800 p-5 border border-gray-100 dark:border-gray-800 rounded-2xl mb-5">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Subject: {activeMessage.subject || 'No Subject'}</h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line leading-relaxed italic">
                    "{activeMessage.message}"
                  </p>
                </div>

                {/* Previous replies */}
                {activeMessage.admin_reply && (
                  <div className="bg-sky-50 dark:bg-sky-950/20 border-l-4 border-sky-400 p-5 rounded-r-2xl mb-5">
                    <h5 className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FaReply /> Previous Admin Response ({activeMessage.replied_at ? formatDate(activeMessage.replied_at) : 'Date unavailable'})
                    </h5>
                    <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line leading-relaxed">
                      {activeMessage.admin_reply}
                    </p>
                  </div>
                )}
              </div>

              {/* Reply Section */}
              <div>
                {!activeMessage.admin_reply ? (
                  <form onSubmit={handleReplySubmit} className="space-y-3.5 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Send Email Reply</label>
                      <textarea
                        rows={3}
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Write your email response here..."
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveMessage(null)}
                        className="px-6 py-2.5 bg-gray-lighter hover:bg-gray-lighter-hover text-dark rounded-xl font-semibold text-sm transition-colors duration-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={sendingReply}
                        className="inline-flex items-center gap-2 px-6 py-2.5 gradient-primary text-white font-semibold rounded-xl text-sm hover:shadow-lg hover:shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {sendingReply ? 'Sending Reply...' : <><FaPaperPlane /> Send Reply</>}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex justify-end border-t border-gray-100 dark:border-gray-800 pt-4">
                    <button
                      onClick={() => setActiveMessage(null)}
                      className="px-6 py-2.5 bg-gray-lighter hover:bg-gray-lighter-hover text-dark rounded-xl font-semibold text-sm transition-colors duration-200 cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContactMessages;
