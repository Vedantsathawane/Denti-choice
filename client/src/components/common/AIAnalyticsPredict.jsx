import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBrain, FaCalendarDay, FaChartLine, FaUsers, FaLightbulb } from 'react-icons/fa';
import api from '../../services/api';

export default function AIAnalyticsPredict() {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get('/ai/analytics/predict');
        if (response.data.success) {
          setPredictions(response.data.predictions);
        }
      } catch (err) {
        console.error('Error fetching AI analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center justify-center space-y-2">
          <FaBrain size={32} className="text-[#0066FF] animate-spin" />
          <span className="text-xs text-gray-400">Loading AI Predictive Reports...</span>
        </div>
      </div>
    );
  }

  if (!predictions) return null;

  const { revenueForecast, busyDays, retention, servicesPopularity } = predictions;

  // Formulate simple operations advice based on calculations
  let businessTip = "All operations are running smoothly. Keep up the high retention rate!";
  if (retention.retentionRatePercent < 30) {
    businessTip = "Patient retention is low. We recommend running a review generator campaign to follow up with completed appointments.";
  } else if (busyDays.length > 0 && busyDays[0].appointments > 5) {
    businessTip = `${busyDays[0].day}s are extremely busy (${busyDays[0].appointments} bookings). Advise staff to allocate extra cleaning slots.`;
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-2xl">
          <FaBrain size={20} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">AI Analytics & Future Forecasting</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Predictive values calculated based on historical completed operations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Revenue Forecast */}
        <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl flex flex-col justify-between border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase">Projected Next Month</span>
            <FaChartLine className="text-green-500" size={16} />
          </div>
          <div>
            <h4 className="text-2xl font-black text-gray-900 dark:text-white">${revenueForecast.predictedNextMonth.toFixed(2)}</h4>
            <span className="text-[10px] text-gray-400 block mt-1">Estimated billing revenue forecast</span>
          </div>
        </div>

        {/* Card 2: Retention Rate */}
        <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl flex flex-col justify-between border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase">Patient Retention</span>
            <FaUsers className="text-[#0066FF]" size={16} />
          </div>
          <div>
            <h4 className="text-2xl font-black text-gray-900 dark:text-white">{retention.retentionRatePercent}%</h4>
            <span className="text-[10px] text-gray-400 block mt-1">
              {retention.returningPatients} returning out of {retention.totalPatients} patients
            </span>
          </div>
        </div>

        {/* Card 3: Busy Day */}
        <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl flex flex-col justify-between border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase">Busiest Weekday</span>
            <FaCalendarDay className="text-purple-500" size={16} />
          </div>
          <div>
            <h4 className="text-2xl font-black text-gray-900 dark:text-white">
              {busyDays.length > 0 ? busyDays[0].day : 'N/A'}
            </h4>
            <span className="text-[10px] text-gray-400 block mt-1">
              Avg. {busyDays.length > 0 ? busyDays[0].appointments : 0} bookings scheduled
            </span>
          </div>
        </div>
      </div>

      {/* AI Smart recommendation list */}
      <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100/30 dark:border-purple-900/30 rounded-2xl p-4 flex items-start space-x-3">
        <FaLightbulb className="text-amber-500 shrink-0 mt-0.5" size={16} />
        <div>
          <span className="text-xs font-bold text-[#0066FF] dark:text-[#00C2FF] block mb-0.5">AI Clinic Optimizer Recommendations</span>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">{businessTip}</p>
        </div>
      </div>
    </div>
  );
}
