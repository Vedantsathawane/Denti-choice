import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  FaRobot, FaPaperPlane, FaTrash, FaBullhorn, FaCheckCircle, 
  FaExclamationCircle, FaBrain, FaLightbulb, FaChartLine, FaServer 
} from 'react-icons/fa';
import api from '../../services/api';
import Swal from 'sweetalert2';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useTheme } from '../../hooks/useTheme';

export default function AIInsights() {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Chatbot states
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello Super Admin! 👋 I am your Platform Business Intelligence Engine. Ask me anything about MRR growth, AI token usage per clinic, active subscriptions, or platform security.'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef(null);

  // Broadcast states
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  // Preset prompt chips
  const promptSuggestions = [
    "Which clinics consume the most AI tokens?",
    "Summarize monthly recurring revenue (MRR)",
    "What is the system error & latency rate?",
    "Show active tenant count breakdown"
  ];

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.get('/super-admin/dashboard/kpis');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load KPIs:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendChat = async (e, textOverride = null) => {
    if (e) e.preventDefault();
    const query = textOverride || inputVal;
    if (!query.trim() || sendingChat) return;

    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setInputVal('');
    setSendingChat(true);

    try {
      const response = await api.post('/super-admin/ai/insights', { question: userMessage.content });
      if (response.data.success) {
        const reply = response.data.data.answer;
        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      } else {
        throw new Error(response.data.message || 'Error occurred');
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I failed to fetch real-time intelligence data. Please ensure GEMINI_API_KEY is configured in your server environment.' 
      }]);
    } finally {
      setSendingChat(false);
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim() || broadcasting) return;

    setBroadcasting(true);
    try {
      const res = await api.post('/notifications/broadcast', {
        title: broadcastTitle,
        message: broadcastMessage
      });
      if (res.data.success) {
        Swal.fire({
          title: 'Broadcast Dispatched!',
          text: 'Announcement successfully published across all clinic dashboard headers.',
          icon: 'success',
          confirmButtonColor: '#6366F1'
        });
        setBroadcastTitle('');
        setBroadcastMessage('');
      } else {
        throw new Error(res.data.message);
      }
    } catch (err) {
      Swal.fire('Error', 'Failed to send broadcast announcement.', 'error');
    } finally {
      setBroadcasting(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              Platform Intelligence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            SaaS AI Operations & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Execute conversational BI queries, monitor Gemini AI API overhead, and publish platform-wide alerts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Conversational AI Intelligence Hub */}
        <div className="lg:col-span-2 flex flex-col h-[650px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <FaRobot size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Business Intelligence Assistant
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider">
                    Gemini 1.5 Flash Connected
                  </span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setMessages([{ 
                role: 'assistant', 
                content: 'Hello Super Admin! 👋 I am your Platform Business Intelligence Engine. Ask me anything about MRR growth, AI token usage per clinic, active subscriptions, or platform security.' 
              }])}
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
              title="Clear Conversation"
            >
              <FaTrash size={14} />
            </button>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/30 dark:bg-slate-950/40">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="flex gap-3 max-w-[85%] items-start">
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold shadow-xs">
                      <FaBrain size={12} />
                    </div>
                  )}
                  
                  <div className={`rounded-2xl p-4 text-xs font-medium leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-tl-none'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}

            {sendingChat && (
              <div className="flex justify-start">
                <div className="flex gap-3 items-center">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600/20 text-indigo-500 flex items-center justify-center shrink-0 text-xs">
                    <FaBrain size={12} className="animate-spin" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-300 rounded-2xl rounded-tl-none p-3 text-xs font-bold flex items-center gap-2 shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                    <span>Analyzing system database telemetry...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompt Suggestion Chips */}
          <div className="px-4 py-2 bg-slate-100/50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 shrink-0 flex items-center gap-1 uppercase tracking-wider">
              <FaLightbulb className="text-amber-400" /> Prompts:
            </span>
            {promptSuggestions.map((prompt, i) => (
              <button
                key={i}
                onClick={(e) => handleSendChat(e, prompt)}
                disabled={sendingChat}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-600 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleSendChat} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask BI Assistant: e.g. 'Which clinics have the highest appointment volume?'"
              className="flex-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
            />
            <button
              type="submit"
              disabled={sendingChat || !inputVal.trim()}
              className="w-11 h-11 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center justify-center font-bold cursor-pointer disabled:opacity-40 shadow-md shadow-indigo-500/20 transition-all shrink-0"
            >
              <FaPaperPlane size={14} />
            </button>
          </form>
        </div>

        {/* Right Column: Broadcast Announcer & AI Operational KPI Cards */}
        <div className="space-y-6">
          {/* Global Broadcast Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <FaBullhorn size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Global Announcement Broadcast</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">Publish alert banners to all clinic dashboards</p>
              </div>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Announcement Header</label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Scheduled System Maintenance"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Banner Body Message</label>
                <textarea
                  required
                  rows="3"
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="e.g. Denti-Choice platform upgrades scheduled tonight from 02:00 UTC."
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={broadcasting || !broadcastTitle.trim() || !broadcastMessage.trim()}
                className="w-full py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:opacity-95 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 disabled:opacity-40 cursor-pointer transition-all"
              >
                <FaBullhorn size={13} />
                <span>{broadcasting ? 'Publishing Alert...' : 'Publish Announcement Banner'}</span>
              </button>
            </form>
          </div>

          {/* AI Telemetry & Operations KPI Cards */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FaServer className="text-indigo-500" /> AI System Telemetry
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-500/10 text-indigo-500 uppercase">Live</span>
            </div>

            {stats && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-150 dark:border-slate-700/60 rounded-2xl p-3 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Total AI Invocations</span>
                  <p className="text-base font-black text-slate-900 dark:text-white">{stats.system.aiRequests}</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-150 dark:border-slate-700/60 rounded-2xl p-3 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Gemini API Cost</span>
                  <p className="text-base font-black text-emerald-500">${stats.system.geminiCost}</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-150 dark:border-slate-700/60 rounded-2xl p-3 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Active Tenants</span>
                  <p className="text-base font-black text-slate-900 dark:text-white">{stats.clinics.active} / {stats.clinics.total}</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-150 dark:border-slate-700/60 rounded-2xl p-3 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">System Health</span>
                  {stats.system.openTickets === 0 ? (
                    <span className="text-xs text-emerald-500 font-extrabold flex items-center gap-1">
                      <FaCheckCircle size={11} /> Operational
                    </span>
                  ) : (
                    <span className="text-xs text-rose-500 font-extrabold flex items-center gap-1">
                      <FaExclamationCircle size={11} /> {stats.system.openTickets} Ticket(s)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
