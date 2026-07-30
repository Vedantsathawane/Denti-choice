import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCode, FaCopy, FaCheck, FaWordpress, FaExternalLinkAlt, FaBookOpen } from 'react-icons/fa';
import { useSettings } from '../../hooks/useSettings';

export default function IntegrationSettings() {
  const { settings } = useSettings();
  const [copiedIframe, setCopiedIframe] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState('iframe');

  // Resolve subdomain and construct links
  const clinicSubdomain = settings?.subdomain || 'denti-choice';
  
  // Dynamic host determination
  const hostUrl = window.location.host.includes('localhost')
    ? `${window.location.protocol}//${clinicSubdomain}.localhost:${window.location.port}`
    : `https://${clinicSubdomain}.denti-choice-three.vercel.app`;

  const iframeUrl = `${hostUrl}/appointment`;
  
  const iframeCode = `<iframe 
  src="${iframeUrl}" 
  width="100%" 
  height="700px" 
  style="border:none; border-radius:20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);" 
  allow="geolocation; microphone; camera">
</iframe>`;

  const scriptCode = `<!-- Denti-Choice AI Booking Assistant Widget -->
<script>
  window.dentiChoiceConfig = {
    subdomain: "${clinicSubdomain}",
    primaryColor: "${settings?.primary_color || '#0066FF'}"
  };
</script>
<script src="https://denti-choice.onrender.com/widget.js" defer></script>`;

  const copyToClipboard = (text, setCopied) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">WordPress & External Integrations</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Embed your booking calendar and conversational AI chatbot widget into WordPress, Wix, or custom websites.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Embed Codes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Iframe Embed section */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <FaCode className="text-indigo-500" /> Inline Scheduling Calendar Iframe
              </h4>
              <span className="text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md font-bold uppercase">
                Recommended
              </span>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Paste this responsive HTML block in your WordPress editor (Gutenberg Custom HTML Block, Elementor HTML Widget, or Divi Code module) to render the full scheduler natively on your page.
            </p>

            <div className="relative bg-slate-900 dark:bg-slate-950 p-4 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto border border-slate-800">
              <pre className="whitespace-pre">{iframeCode}</pre>
              <button
                onClick={() => copyToClipboard(iframeCode, setCopiedIframe)}
                className="absolute top-3.5 right-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg p-2 transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-bold"
              >
                {copiedIframe ? (
                  <>
                    <FaCheck className="text-green-400" /> Copied!
                  </>
                ) : (
                  <>
                    <FaCopy /> Copy Snippet
                  </>
                )}
              </button>
            </div>

            <div className="flex gap-4 text-xs font-semibold text-indigo-600 dark:text-indigo-400 pt-1">
              <a href={iframeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:underline">
                Live Preview Scheduling Page <FaExternalLinkAlt size={10} />
              </a>
            </div>
          </div>

          {/* Script widget section */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <FaCode className="text-indigo-500" /> Floating AI Chatbot Widget Snippet
              </h4>
              <span className="text-[10px] bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 px-2.5 py-0.5 rounded-md font-bold uppercase">
                Premium
              </span>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Add a floating chat button at the bottom-right corner of your site. This allows visitors to ask questions, check business hours, and schedule appointments instantly through AI.
            </p>

            <div className="relative bg-slate-900 dark:bg-slate-950 p-4 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto border border-slate-800">
              <pre className="whitespace-pre">{scriptCode}</pre>
              <button
                onClick={() => copyToClipboard(scriptCode, setCopiedScript)}
                className="absolute top-3.5 right-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg p-2 transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-bold"
              >
                {copiedScript ? (
                  <>
                    <FaCheck className="text-green-400" /> Copied!
                  </>
                ) : (
                  <>
                    <FaCopy /> Copy Snippet
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: WordPress Quick Integration Guide */}
        <div className="bg-gradient-to-b from-indigo-50/30 to-indigo-100/10 dark:from-indigo-950/10 dark:to-slate-900 border border-indigo-500/20 dark:border-indigo-500/10 p-5 rounded-2xl space-y-4">
          <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2 border-b border-indigo-500/20 pb-2">
            <FaWordpress className="text-indigo-600 dark:text-indigo-400 text-lg" /> WP Integration Guide
          </h4>
          
          <div className="flex bg-slate-200/50 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
            <button 
              onClick={() => setActiveGuideTab('iframe')}
              className={`flex-1 py-1.5 rounded-md cursor-pointer transition-all ${activeGuideTab === 'iframe' ? 'bg-white dark:bg-gray-700 text-indigo-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
            >
              Calendar Iframe
            </button>
            <button 
              onClick={() => setActiveGuideTab('widget')}
              className={`flex-1 py-1.5 rounded-md cursor-pointer transition-all ${activeGuideTab === 'widget' ? 'bg-white dark:bg-gray-700 text-indigo-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
            >
              AI Chat Widget
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {activeGuideTab === 'iframe' ? (
              <ul className="space-y-3 list-decimal list-inside text-slate-600 dark:text-slate-400">
                <li>
                  <strong className="text-slate-800 dark:text-white">Copy Code:</strong> Click <strong>Copy Snippet</strong> in the iframe box on the left.
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-white">Open WP Admin:</strong> Log in to your WordPress dashboard and open the page where you want the scheduler.
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-white">Add HTML Block:</strong>
                  <p className="mt-1 pl-4 leading-relaxed font-sans">
                    - In Elementor, search for the HTML widget and drag it onto the page.
                    <br />
                    - In Gutenberg block editor, click (+) and add a Custom HTML block.
                  </p>
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-white">Paste & Save:</strong> Paste the copied iframe code, click **Update/Publish**, and your clients can book directly!
                </li>
              </ul>
            ) : (
              <ul className="space-y-3 list-decimal list-inside text-slate-600 dark:text-slate-400">
                <li>
                  <strong className="text-slate-800 dark:text-white">Install Plugin:</strong> In WordPress, go to **Plugins** and click **Add New**. Search for **Header Footer Code Manager** or **WPCode**. Install & Activate it.
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-white">Add Script:</strong> Click **Add Snippet** inside the plugin. Choose snippet type **HTML** and location **Footer**.
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-white">Paste Script:</strong> Copy the code block from the chatbot widget box on the left, paste it inside the plugin content area, and hit **Save**.
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-white">Verify:</strong> Visit your public WordPress website; you will see the floating AI chat assistant icon in the bottom-right corner!
                </li>
              </ul>
            )}
          </div>

          <div className="pt-2 mt-4 bg-indigo-50/50 dark:bg-indigo-950/20 p-3.5 rounded-xl border border-indigo-500/10 flex items-start gap-2.5">
            <FaBookOpen className="text-indigo-500 mt-0.5 shrink-0" size={14} />
            <div className="text-[11px] text-indigo-900/80 dark:text-indigo-300/80 leading-relaxed font-sans">
              <strong>Zero dependencies:</strong> All embed code is optimized for zero-dependency native execution. It runs fully in WordPress without slowing down page load speed!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
