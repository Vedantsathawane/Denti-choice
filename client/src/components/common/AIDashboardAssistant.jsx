import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaChartBar, FaPaperPlane, FaRobot, FaQuestionCircle } from 'react-icons/fa';
import api, { toastError } from '../../services/api';

export default function AIDashboardAssistant() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setAnswer('');
    try {
      const response = await api.post('/ai/dashboard/ask', { question: question.trim() });
      if (response.data.success) {
        setAnswer(response.data.answer);
      }
    } catch (err) {
      console.error(err);
      toastError('Failed to query dashboard analytics.', err);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "Revenue this month?",
    "Cancelled appointments?",
    "Average treatment cost?",
    "Top dentist performance?"
  ];

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-all duration-300">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="p-3 bg-blue-50 dark:bg-blue-950 text-[#0066FF] rounded-2xl">
          <FaChartBar size={20} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">AI Dashboard Operations Analyst</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Ask operational queries using simple natural language.</p>
        </div>
      </div>

      {/* Suggested Questions */}
      <div className="flex flex-wrap gap-2 mb-4">
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setQuestion(p)}
            className="px-2.5 py-1 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-[#0066FF] text-[11px] rounded-lg border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Answer Area */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-950 rounded-2xl p-4 min-h-[120px] mb-4 flex flex-col justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <FaRobot size={28} className="text-[#0066FF] animate-bounce" />
            <span className="text-xs text-gray-400">Querying database registers...</span>
          </div>
        ) : answer ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <FaRobot className="text-[#0066FF]" />
              <span className="text-xs font-bold text-gray-400">Operational Report:</span>
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">{answer}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-gray-400 space-y-1">
            <FaQuestionCircle size={24} />
            <span className="text-xs">Results will render here. Choose a quick prompt above.</span>
          </div>
        )}
      </div>

      {/* Input bar */}
      <form onSubmit={handleAsk} className="flex items-center space-x-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask e.g. How many appointments did we have today?"
          className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#0066FF] dark:text-white"
        />
        <button
          type="submit"
          className="p-2.5 bg-gradient-to-tr from-[#0066FF] to-[#0088FF] text-white rounded-xl flex items-center justify-center cursor-pointer shadow-md hover:shadow-lg focus:outline-none"
        >
          <FaPaperPlane size={12} />
        </button>
      </form>
    </div>
  );
}
