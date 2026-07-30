const { pool } = require('../../config/db');

const analyticsService = {
  predict: async (clinicId) => {
    try {
      // 1. Fetch Completed Appointments Count & Revenue Trend (last 6 months)
      const [revenueHistory] = await pool.query(
        `SELECT 
           DATE_FORMAT(a.appointment_date, '%Y-%m') as month,
           COUNT(a.id) as appointment_count,
           SUM(s.price) as revenue
         FROM appointments a
         JOIN clinic_appointments ca ON a.id = ca.appointment_id
         JOIN services s ON a.service_id = s.id
         WHERE ca.clinic_id = ? AND a.status = 'completed'
         GROUP BY month
         ORDER BY month ASC
         LIMIT 6`,
        [clinicId]
      );

      // Simple forecasting calculation
      let predictedRevenue = 0;
      if (revenueHistory.length > 1) {
        const revenues = revenueHistory.map(r => parseFloat(r.revenue || 0));
        let diffSum = 0;
        for (let i = 1; i < revenues.length; i++) {
          diffSum += (revenues[i] - revenues[i - 1]);
        }
        const averageChange = diffSum / (revenues.length - 1);
        predictedRevenue = Math.max(0, revenues[revenues.length - 1] + averageChange);
      } else if (revenueHistory.length === 1) {
        predictedRevenue = parseFloat(revenueHistory[0].revenue || 0);
      } else {
        predictedRevenue = 500.00; // Fallback mock value
      }

      // 2. Fetch Busy Days (Appointments by day name)
      const [busyDays] = await pool.query(
        `SELECT 
           DAYNAME(a.appointment_date) as day_name,
           COUNT(a.id) as count
         FROM appointments a
         JOIN clinic_appointments ca ON a.id = ca.appointment_id
         WHERE ca.clinic_id = ? AND a.status != 'cancelled'
         GROUP BY day_name
         ORDER BY count DESC`,
        [clinicId]
      );

      // 3. Patient Retention Metric
      const [patientRetention] = await pool.query(
        `SELECT 
           COUNT(DISTINCT patient_id) as total_patients,
           SUM(CASE WHEN appt_count > 1 THEN 1 ELSE 0 END) as returning_patients
         FROM (
           SELECT a.patient_id, COUNT(a.id) as appt_count
           FROM appointments a
           JOIN clinic_appointments ca ON a.id = ca.appointment_id
           WHERE ca.clinic_id = ?
           GROUP BY a.patient_id
         ) as patient_stats`,
        [clinicId]
      );

      const totalPatients = patientRetention[0]?.total_patients || 0;
      const returningPatients = patientRetention[0]?.returning_patients || 0;
      const retentionRate = totalPatients > 0 
        ? parseFloat(((returningPatients / totalPatients) * 100).toFixed(1)) 
        : 0;

      // 4. Popular Services Distribution
      const [popularServices] = await pool.query(
        `SELECT 
           s.name as service_name,
           COUNT(a.id) as count,
           SUM(s.price) as revenue
         FROM appointments a
         JOIN clinic_appointments ca ON a.id = ca.appointment_id
         JOIN services s ON a.service_id = s.id
         WHERE ca.clinic_id = ? AND a.status != 'cancelled'
         GROUP BY s.id
         ORDER BY count DESC`,
        [clinicId]
      );

      return {
        revenueForecast: {
          history: revenueHistory,
          predictedNextMonth: parseFloat(predictedRevenue.toFixed(2))
        },
        busyDays: busyDays.map(bd => ({
          day: bd.day_name,
          appointments: bd.count
        })),
        retention: {
          totalPatients,
          returningPatients,
          retentionRatePercent: retentionRate
        },
        servicesPopularity: popularServices.map(ps => ({
          service: ps.service_name,
          bookings: ps.count,
          revenue: parseFloat(ps.revenue || 0)
        }))
      };
    } catch (error) {
      console.error('analyticsService calculations error:', error);
      throw error;
    }
  }
};

module.exports = analyticsService;
