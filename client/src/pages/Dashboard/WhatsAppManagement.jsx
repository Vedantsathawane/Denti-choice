import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaWhatsapp, FaServer, FaHistory, FaBullhorn, FaListAlt, 
  FaPaperPlane, FaSave, FaSync, FaExclamationCircle, FaCheckCircle, FaSpinner 
} from 'react-icons/fa';
import api, { toastError } from '../../services/api';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';
import WhatsAppSettings from './WhatsAppSettings';


export default function WhatsAppManagement() {
  const [activeTab, setActiveTab] = useState('status');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Status info states
  const [statusInfo, setStatusInfo] = useState({
    connected: false,
    phoneId: '',
    useSandbox: true,
    webhookStatus: 'inactive',
    apiStatus: 'inactive',
    displayName: '',
    stats: { total: 0, sent: 0, delivered: 0, read: 0, failed: 0, successRatePercent: 100 }
  });

  // Settings form states
  const [settings, setSettings] = useState({
    phone_number_id: '',
    access_token: '',
    verify_token: 'dentichoice_token',
    webhook_secret: '',
    display_name: '',
    api_status: 'sandbox'
  });

  // Message Logs states
  const [logs, setLogs] = useState([]);
  const [chatRecipient, setChatRecipient] = useState('');
  const [chatText, setChatText] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

  // Broadcaster states
  const [broadcastTemplate, setBroadcastTemplate] = useState('appointment_reminder');
  const [broadcastNumbers, setBroadcastNumbers] = useState('');
  const [broadcastParam1, setBroadcastParam1] = useState('');
  const [broadcastParam2, setBroadcastParam2] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  // Template Manager states
  const [templates, setTemplates] = useState([]);
  const [newTemplate, setNewTemplate] = useState({
    template_name: '',
    category: 'utility',
    language_code: 'en_US',
    body_text: ''
  });
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Queue states
  const [queueItems, setQueueItems] = useState([]);
  const [processingQueue, setProcessingQueue] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Load Status
      const statusRes = await api.get('/whatsapp/status');
      if (statusRes.data.success) {
        setStatusInfo(statusRes.data.data);
        // Pre-fill settings form
        const dbAcc = statusRes.data.data;
        setSettings({
          phone_number_id: dbAcc.phoneId || '',
          access_token: '', // Keep token hidden
          verify_token: 'dentichoice_token',
          webhook_secret: '',
          display_name: dbAcc.displayName || '',
          api_status: dbAcc.useSandbox ? 'sandbox' : 'live'
        });
      }

      // 2. Load Logs
      const logsRes = await api.get('/whatsapp/logs');
      if (logsRes.data.success) {
        setLogs(res => logsRes.data.data);
      }

      // 3. Load Templates
      const tmplRes = await api.get('/whatsapp/templates');
      if (tmplRes.data.success) {
        setTemplates(tmplRes.data.data);
      }

      // 4. Load Queue
      const queueRes = await api.get('/whatsapp/queue');
      if (queueRes.data.success) {
        setQueueItems(queueRes.data.data);
      }

    } catch (err) {
      console.error('Failed to load WhatsApp data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/whatsapp/settings', settings);
      Swal.fire({
        title: 'Success',
        text: 'Connection credentials updated successfully.',
        icon: 'success',
        confirmButtonColor: '#10B981'
      });
      loadAllData();
    } catch (err) {
      toastError('Failed to save settings', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatRecipient || !chatText || sendingChat) return;

    setSendingChat(true);
    try {
      await api.post('/whatsapp/send', {
        recipient: chatRecipient,
        text: chatText
      });
      setChatText('');
      Swal.fire('Sent!', 'Your manual message was dispatched.', 'success');
      loadAllData();
    } catch (err) {
      toastError('Failed to send message', err);
    } finally {
      setSendingChat(false);
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastNumbers || broadcasting) return;

    const list = broadcastNumbers.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    if (list.length === 0) return;

    setBroadcasting(true);
    try {
      const params = [];
      if (broadcastParam1) params.push({ text: broadcastParam1 });
      if (broadcastParam2) params.push({ text: broadcastParam2 });

      await api.post('/whatsapp/broadcast', {
        templateName: broadcastTemplate,
        recipients: list,
        parameters: params
      });

      setBroadcastNumbers('');
      setBroadcastParam1('');
      setBroadcastParam2('');

      Swal.fire({
        title: 'Broadcast Enqueued',
        text: `Successfully queued ${list.length} template broadcasts.`,
        icon: 'success',
        confirmButtonColor: '#10B981'
      });
      loadAllData();
    } catch (err) {
      toastError('Broadcast failed', err);
    } finally {
      setBroadcasting(false);
    }
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplate.template_name || !newTemplate.body_text || savingTemplate) return;

    setSavingTemplate(true);
    try {
      await api.post('/whatsapp/templates', newTemplate);
      setNewTemplate({
        template_name: '',
        category: 'utility',
        language_code: 'en_US',
        body_text: ''
      });
      Swal.fire('Success', 'Template saved successfully.', 'success');
      loadAllData();
    } catch (err) {
      toastError('Failed to save template', err);
    } finally {
      setSavingTemplate(false);
    }
  };

  const triggerQueueProcess = async () => {
    setProcessingQueue(true);
    try {
      await api.post('/whatsapp/queue/process');
      Swal.fire('Queue Executed', 'Background dispatcher queue runner completed successfully.', 'success');
      loadAllData();
    } catch (err) {
      toastError('Queue execution failed', err);
    } finally {
      setProcessingQueue(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <FaSpinner className="text-emerald-500 text-4xl animate-spin mb-4" />
        <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Loading WhatsApp Panel...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <FaWhatsapp className="text-emerald-500" /> WhatsApp <span className="bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text text-transparent">Management</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Centralized communications dashboard for Meta Cloud Integration, real-time message logs, campaign broadcasts, and automated alerts.
          </p>
        </div>
        <button
          onClick={loadAllData}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer transition-colors"
        >
          <FaSync /> Refresh Status
        </button>
      </div>

      {/* Connection Widgets Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">API Endpoint Status</span>
            <h4 className="text-base font-black text-slate-800 dark:text-white">
              {statusInfo.useSandbox ? 'Mock Sandbox' : 'Meta Live Mode'}
            </h4>
          </div>
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${
            statusInfo.useSandbox ? 'bg-amber-500' : 'bg-emerald-500'
          }`}>
            <FaServer size={18} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total Outbound Logs</span>
            <h4 className="text-xl font-black text-slate-800 dark:text-white">{statusInfo.stats.total}</h4>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center">
            <FaHistory size={18} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Deliveries Failed</span>
            <h4 className="text-xl font-black text-rose-500">{statusInfo.stats.failed}</h4>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <FaExclamationCircle size={18} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Success Delivery Rate</span>
            <h4 className="text-xl font-black text-emerald-500">{statusInfo.stats.successRatePercent}%</h4>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <FaCheckCircle size={18} />
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-4 overflow-x-auto whitespace-nowrap">
        {[
          { key: 'status', label: 'Status & Logs', icon: FaHistory },
          { key: 'settings', label: 'API Accounts Setup', icon: FaServer },
          { key: 'broadcast', label: 'Outbound Broadcasts', icon: FaBullhorn },
          { key: 'templates', label: 'Templates Manager', icon: FaListAlt },
          { key: 'queue', label: 'Retry Queue', icon: FaSync }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 pb-3 text-xs font-extrabold uppercase tracking-wider cursor-pointer border-b-2 transition-colors ${
              activeTab === t.key 
                ? 'border-emerald-500 text-emerald-500' 
                : 'border-transparent text-gray-400 hover:text-slate-700 dark:hover:text-white'
            }`}
          >
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="grid grid-cols-1 gap-6">
        {activeTab === 'status' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live message log ledger */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-850 dark:text-white">Live Conversation Logs</h3>
              <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40 space-y-3">
                {logs.length === 0 ? (
                  <div className="text-center py-12 text-xs text-gray-400">No message histories logged yet.</div>
                ) : (
                  logs.map(l => (
                    <div key={l.id} className="pt-3 flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          l.direction === 'inbound' 
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' 
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20'
                        }`}>
                          {l.direction}
                        </span>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">{l.message_text}</p>
                        <div className="flex gap-2 text-[10px] text-gray-400">
                          <span>To/From: {l.phone_number}</span>
                          <span>•</span>
                          <span>{dayjs(l.created_at).format('MMM DD, YYYY HH:mm')}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                        l.status === 'read' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20' :
                        l.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' :
                        l.status === 'failed' ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                      }`}>
                        {l.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick manual text sender */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4 h-fit">
              <h3 className="text-base font-bold text-slate-850 dark:text-white flex items-center gap-2">
                <FaPaperPlane className="text-emerald-500" /> Manual Messaging
              </h3>
              <form onSubmit={handleSendChat} className="space-y-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recipient Phone</label>
                  <input
                    type="text"
                    required
                    value={chatRecipient}
                    onChange={(e) => setChatRecipient(e.target.value)}
                    placeholder="e.g. +15550199"
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Message Text</label>
                  <textarea
                    required
                    rows="4"
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    placeholder="Hi, this is ABC dental clinic..."
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingChat || !chatRecipient || !chatText}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
                >
                  <FaPaperPlane size={11} /> {sendingChat ? 'Sending Message...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <WhatsAppSettings />
        )}

        {activeTab === 'broadcast' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-xs max-w-3xl space-y-4">
            <h3 className="text-base font-bold text-slate-850 dark:text-white flex items-center gap-2">
              <FaBullhorn className="text-emerald-500" /> Outbound Campaign Broadcaster
            </h3>
            <p className="text-xs text-gray-400">Queue bulk templates dispatch to patient phone lists.</p>

            <form onSubmit={handleBroadcast} className="space-y-4">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Message Template</label>
                <select
                  value={broadcastTemplate}
                  onChange={(e) => setBroadcastTemplate(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs dark:text-white focus:outline-none"
                >
                  <option value="appointment_confirmation">Appointment Confirmation</option>
                  <option value="appointment_reminder">Appointment Reminder</option>
                  <option value="appointment_cancellation">Appointment Cancellation</option>
                  <option value="review_request">Review Request Feedback</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Parameter 1 (Patient Name)</label>
                  <input
                    type="text"
                    value={broadcastParam1}
                    onChange={(e) => setBroadcastParam1(e.target.value)}
                    placeholder="John Doe"
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs dark:text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Parameter 2 (Date/Time / Details)</label>
                  <input
                    type="text"
                    value={broadcastParam2}
                    onChange={(e) => setBroadcastParam2(e.target.value)}
                    placeholder="Tomorrow at 3:00 PM"
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recipients List (One phone number per line)</label>
                <textarea
                  required
                  rows="5"
                  value={broadcastNumbers}
                  onChange={(e) => setBroadcastNumbers(e.target.value)}
                  placeholder="+15550199&#10;+15550299"
                  className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs dark:text-white focus:outline-none resize-none font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={broadcasting || !broadcastNumbers}
                className="px-4 py-2.5 bg-gradient-to-tr from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
              >
                <FaBullhorn /> {broadcasting ? 'Queueing Broadcast...' : 'Broadcast Template Alert'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* New template creator */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4 h-fit">
              <h3 className="text-base font-bold text-slate-850 dark:text-white">Register Approved Template</h3>
              <form onSubmit={handleSaveTemplate} className="space-y-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Template Name</label>
                  <input
                    type="text"
                    required
                    value={newTemplate.template_name}
                    onChange={(e) => setNewTemplate({...newTemplate, template_name: e.target.value})}
                    placeholder="e.g. review_request"
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs dark:text-white focus:outline-none"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category</label>
                  <select
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate({...newTemplate, category: e.target.value})}
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs dark:text-white focus:outline-none"
                  >
                    <option value="utility">Utility</option>
                    <option value="marketing">Marketing</option>
                    <option value="authentication">Authentication</option>
                  </select>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Body Message Text</label>
                  <textarea
                    required
                    rows="4"
                    value={newTemplate.body_text}
                    onChange={(e) => setNewTemplate({...newTemplate, body_text: e.target.value})}
                    placeholder="Hello {{1}}, thank you for visiting us. Please leave a review."
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs dark:text-white focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingTemplate || !newTemplate.template_name || !newTemplate.body_text}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
                >
                  <FaSave /> Save Template
                </button>
              </form>
            </div>

            {/* List templates */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-850 dark:text-white">Active Approved Templates</h3>
              <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40 space-y-3">
                {templates.length === 0 ? (
                  <div className="text-center py-12 text-xs text-gray-400">No custom templates registered yet. Use Meta Business Manager to request approval.</div>
                ) : (
                  templates.map(t => (
                    <div key={t.id} className="pt-3 flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{t.template_name}</span>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">{t.body_text}</p>
                        <div className="flex gap-2 text-[9px] text-gray-400">
                          <span>Cat: {t.category}</span>
                          <span>•</span>
                          <span>Lang: {t.language_code}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold uppercase bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                        {t.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-850 dark:text-white">Outbound Message Dispatch Queue</h3>
                <p className="text-xs text-gray-400">View retry statuses, run times, and trigger immediate manual retry executions.</p>
              </div>
              <button
                onClick={triggerQueueProcess}
                disabled={processingQueue}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer transition-colors disabled:opacity-50"
              >
                {processingQueue ? 'Executing Queue...' : 'Force Process Queue'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium text-slate-600 dark:text-slate-400">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Queue ID</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Message Content</th>
                    <th className="py-3 px-4">Retry Count</th>
                    <th className="py-3 px-4">Queue Status</th>
                    <th className="py-3 px-4">Run At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {queueItems.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-gray-400">Queue is currently empty.</td>
                    </tr>
                  ) : (
                    queueItems.map(item => (
                      <tr key={item.queue_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                        <td className="py-3 px-4 font-bold text-slate-850 dark:text-white">#Q-{item.queue_id}</td>
                        <td className="py-3 px-4">{item.phone_number}</td>
                        <td className="py-3 px-4 truncate max-w-[200px]">{item.message_text}</td>
                        <td className="py-3 px-4 font-bold">{item.retry_count} / 3</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            item.queue_status === 'completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' :
                            item.queue_status === 'failed' ? 'bg-red-50 text-red-600 dark:bg-red-900/20' :
                            item.queue_status === 'processing' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 animate-pulse' : 'bg-slate-100 text-slate-650 dark:bg-slate-800'
                          }`}>
                            {item.queue_status}
                          </span>
                        </td>
                        <td className="py-3 px-4">{dayjs(item.run_at).format('MMM DD, HH:mm')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
