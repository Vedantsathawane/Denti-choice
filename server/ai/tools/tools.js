const { pool } = require('../../config/db');
const AppointmentModel = require('../../models/appointmentModel');
const DoctorModel = require('../../models/doctorModel');
const saasLogger = require('../../utils/saasLogger');
const { z } = require('zod');

// Helpers to get day name
const getDayName = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

const tools = {
  // 1. Check Doctor Availability
  checkDoctorAvailability: {
    description: 'Check available time slots for a specific doctor on a given date (YYYY-MM-DD)',
    parameters: z.object({
      doctorId: z.number().describe('The ID of the doctor'),
      date: z.string().describe('The date in YYYY-MM-DD format')
    }),
    execute: async ({ doctorId, date }, { clinicId }) => {
      try {
        const doctor = await DoctorModel.findById(doctorId);
        if (!doctor || !doctor.is_active) {
          return { error: 'DOCTOR_NOT_FOUND', message: 'Doctor not found or inactive.' };
        }

        // Verify doctor belongs to clinic
        const [mapping] = await pool.query(
          'SELECT id FROM clinic_doctors WHERE clinic_id = ? AND doctor_id = ?',
          [clinicId, doctorId]
        );
        if (mapping.length === 0) {
          return { error: 'UNAUTHORIZED_DOCTOR', message: 'This doctor is not assigned to your clinic.' };
        }

        // Check availability day
        const dayName = getDayName(date);
        let availableDays = [];
        try {
          availableDays = typeof doctor.availability === 'string' 
            ? JSON.parse(doctor.availability) 
            : (doctor.availability || []);
        } catch (e) {
          availableDays = [];
        }

        if (!availableDays.includes(dayName)) {
          return {
            available: false,
            message: `${doctor.name} is not available on ${dayName}s. Work days: ${availableDays.join(', ')}`
          };
        }

        // Get booked appointments for this doctor on this day
        const [booked] = await pool.query(
          `SELECT appointment_time FROM appointments 
           WHERE doctor_id = ? AND appointment_date = ? AND status != 'cancelled'`,
          [doctorId, date]
        );

        const bookedSlots = booked.map(b => b.appointment_time.substring(0, 5));

        // Generate standard working slots (e.g. 09:00 to 17:00 hourly)
        const allSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
        const freeSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

        return {
          available: freeSlots.length > 0,
          date,
          dayName,
          slots: freeSlots,
          message: freeSlots.length > 0 
            ? `Available slots for ${doctor.name} on ${date}: ${freeSlots.join(', ')}` 
            : `All slots are booked for ${doctor.name} on ${date}.`
        };
      } catch (error) {
        console.error('checkDoctorAvailability tool error:', error);
        return { error: 'SERVER_ERROR', message: error.message };
      }
    }
  },

  // 2. Book Appointment
  bookAppointment: {
    description: 'Book a new dental appointment for a patient',
    parameters: z.object({
      patientName: z.string().describe('Full name of the patient'),
      patientEmail: z.string().email().describe('Email address of the patient'),
      patientPhone: z.string().describe('Phone number of the patient'),
      patientAge: z.number().optional().describe('Age of the patient'),
      patientGender: z.enum(['male', 'female', 'other']).optional().describe('Gender of the patient'),
      doctorId: z.number().describe('ID of the doctor to book with'),
      serviceId: z.number().describe('ID of the dental service required'),
      date: z.string().describe('Appointment date in YYYY-MM-DD'),
      time: z.string().describe('Appointment time in HH:MM (e.g. 14:00)'),
      message: z.string().optional().describe('Additional notes or symptoms')
    }),
    execute: async (args, { clinicId }) => {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // 1. Resolve or Create Patient
        let [patient] = await connection.query(
          'SELECT id FROM patients WHERE email = ? OR phone = ? LIMIT 1',
          [args.patientEmail, args.patientPhone]
        );

        let patientId;
        if (patient.length === 0) {
          const [insertPatient] = await connection.query(
            `INSERT INTO patients (full_name, email, phone, age, gender) 
             VALUES (?, ?, ?, ?, ?)`,
            [args.patientName, args.patientEmail, args.patientPhone, args.patientAge || null, args.patientGender || null]
          );
          patientId = insertPatient.insertId;

          // Map patient to clinic
          await connection.query(
            'INSERT INTO clinic_patients (clinic_id, patient_id) VALUES (?, ?)',
            [clinicId, patientId]
          );
        } else {
          patientId = patient[0].id;
          
          // Verify patient mapping to clinic
          await connection.query(
            'INSERT IGNORE INTO clinic_patients (clinic_id, patient_id) VALUES (?, ?)',
            [clinicId, patientId]
          );
        }

        // 2. Lock and Check availability (Prevent double booking)
        const [existing] = await connection.query(
          `SELECT id FROM appointments 
           WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? 
           AND status != 'cancelled'
           FOR UPDATE`,
          [args.doctorId, args.date, args.time]
        );

        if (existing.length > 0) {
          await connection.rollback();
          return { error: 'SLOT_TAKEN', message: 'This time slot is already booked.' };
        }

        // 3. Create Appointment
        const [insertAppointment] = await connection.query(
          `INSERT INTO appointments (patient_id, doctor_id, service_id, appointment_date, appointment_time, message) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [patientId, args.doctorId, args.serviceId, args.date, args.time, args.message || null]
        );
        const appointmentId = insertAppointment.insertId;

        // Map appointment to clinic
        await connection.query(
          'INSERT INTO clinic_appointments (clinic_id, appointment_id) VALUES (?, ?)',
          [clinicId, appointmentId]
        );

        // Add Appointment Log
        await connection.query(
          `INSERT INTO appointment_logs (appointment_id, new_status, changed_by, notes) 
           VALUES (?, 'pending', 'AI Agent', 'Appointment booked via AI Booking Agent')`,
          [appointmentId]
        );

        await connection.commit();
        saasLogger.logBooking(clinicId, 'CREATE', `Appt ID: ${appointmentId} for Patient ID: ${patientId}`);

        return {
          success: true,
          appointmentId,
          message: `Appointment successfully booked with ID ${appointmentId} for ${args.patientName} on ${args.date} at ${args.time}.`
        };
      } catch (error) {
        await connection.rollback();
        console.error('bookAppointment tool error:', error);
        return { error: 'SERVER_ERROR', message: error.message };
      } finally {
        connection.release();
      }
    }
  },

  // 3. Reschedule Appointment
  rescheduleAppointment: {
    description: 'Reschedule an existing appointment to a new date and time',
    parameters: z.object({
      appointmentId: z.number().describe('The ID of the existing appointment'),
      newDate: z.string().describe('The new appointment date in YYYY-MM-DD'),
      newTime: z.string().describe('The new appointment time in HH:MM (e.g. 10:00)')
    }),
    execute: async ({ appointmentId, newDate, newTime }, { clinicId }) => {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Verify appointment exists and belongs to clinic
        const [apptCheck] = await connection.query(
          `SELECT a.* FROM appointments a 
           JOIN clinic_appointments ca ON a.id = ca.appointment_id 
           WHERE a.id = ? AND ca.clinic_id = ?`,
          [appointmentId, clinicId]
        );

        if (apptCheck.length === 0) {
          await connection.rollback();
          return { error: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found in this clinic.' };
        }

        const appt = apptCheck[0];

        // Check availability on new slot
        const [existing] = await connection.query(
          `SELECT id FROM appointments 
           WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? 
           AND id != ? AND status != 'cancelled'
           FOR UPDATE`,
          [appt.doctor_id, newDate, newTime, appointmentId]
        );

        if (existing.length > 0) {
          await connection.rollback();
          return { error: 'SLOT_TAKEN', message: 'The requested new slot is already booked.' };
        }

        // Update appointment
        await connection.query(
          `UPDATE appointments SET appointment_date = ?, appointment_time = ?, status = 'pending' 
           WHERE id = ?`,
          [newDate, newTime, appointmentId]
        );

        // Add Log
        await connection.query(
          `INSERT INTO appointment_logs (appointment_id, old_status, new_status, changed_by, notes) 
           VALUES (?, ?, 'pending', 'AI Agent', ?)`,
          [appointmentId, appt.status, `Rescheduled from ${appt.appointment_date} ${appt.appointment_time} to ${newDate} ${newTime}`]
        );

        await connection.commit();
        saasLogger.logBooking(clinicId, 'RESCHEDULE', `Appt ID: ${appointmentId} to ${newDate} ${newTime}`);

        return {
          success: true,
          message: `Appointment ${appointmentId} successfully rescheduled to ${newDate} at ${newTime}.`
        };
      } catch (error) {
        await connection.rollback();
        console.error('rescheduleAppointment tool error:', error);
        return { error: 'SERVER_ERROR', message: error.message };
      } finally {
        connection.release();
      }
    }
  },

  // 4. Cancel Appointment
  cancelAppointment: {
    description: 'Cancel an existing dental appointment',
    parameters: z.object({
      appointmentId: z.number().describe('The ID of the appointment to cancel'),
      reason: z.string().describe('The reason for cancellation')
    }),
    execute: async ({ appointmentId, reason }, { clinicId }) => {
      try {
        // Verify appointment belongs to clinic
        const [apptCheck] = await pool.query(
          `SELECT a.status FROM appointments a 
           JOIN clinic_appointments ca ON a.id = ca.appointment_id 
           WHERE a.id = ? AND ca.clinic_id = ?`,
          [appointmentId, clinicId]
        );

        if (apptCheck.length === 0) {
          return { error: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found in this clinic.' };
        }

        const oldStatus = apptCheck[0].status;

        // Update status to cancelled
        await pool.query(
          `UPDATE appointments SET status = 'cancelled', cancellation_reason = ? WHERE id = ?`,
          [reason, appointmentId]
        );

        // Add Log
        await pool.query(
          `INSERT INTO appointment_logs (appointment_id, old_status, new_status, changed_by, notes) 
           VALUES (?, ?, 'cancelled', 'AI Agent', ?)`,
          [appointmentId, oldStatus, `Cancelled via AI: ${reason}`]
        );

        saasLogger.logBooking(clinicId, 'CANCEL', `Appt ID: ${appointmentId} for reason: ${reason}`);

        return {
          success: true,
          message: `Appointment ${appointmentId} has been successfully cancelled.`
        };
      } catch (error) {
        console.error('cancelAppointment tool error:', error);
        return { error: 'SERVER_ERROR', message: error.message };
      }
    }
  },

  // 5. Query Dashboard Stats (operations & reporting)
  queryDashboardStats: {
    description: 'Query operational numbers like today appointments count, monthly revenue, cancellation count or popular service',
    parameters: z.object({
      queryType: z.enum(['appointments_today', 'revenue_this_month', 'cancellations', 'popular_treatment', 'doctor_performance', 'average_treatment_cost']).describe('Type of statistics to fetch')
    }),
    execute: async ({ queryType }, { clinicId }) => {
      try {
        if (queryType === 'appointments_today') {
          const [rows] = await pool.query(
            `SELECT COUNT(*) as total FROM appointments a
             JOIN clinic_appointments ca ON a.id = ca.appointment_id
             WHERE ca.clinic_id = ? AND a.appointment_date = CURDATE() AND a.status != 'cancelled'`,
            [clinicId]
          );
          return { total: rows[0].total, message: `There are ${rows[0].total} active appointments scheduled for today.` };
        }

        if (queryType === 'revenue_this_month') {
          const [rows] = await pool.query(
            `SELECT SUM(s.price) as total_revenue FROM appointments a
             JOIN clinic_appointments ca ON a.id = ca.appointment_id
             JOIN services s ON a.service_id = s.id
             WHERE ca.clinic_id = ? 
               AND MONTH(a.appointment_date) = MONTH(CURDATE()) 
               AND YEAR(a.appointment_date) = YEAR(CURDATE())
               AND a.status = 'completed'`,
            [clinicId]
          );
          const revenue = rows[0].total_revenue || 0.00;
          return { revenue, message: `Estimated revenue for completed appointments this month is $${parseFloat(revenue).toFixed(2)}.` };
        }

        if (queryType === 'cancellations') {
          const [rows] = await pool.query(
            `SELECT COUNT(*) as total FROM appointments a
             JOIN clinic_appointments ca ON a.id = ca.appointment_id
             WHERE ca.clinic_id = ? AND a.status = 'cancelled'`,
            [clinicId]
          );
          return { total: rows[0].total, message: `A total of ${rows[0].total} appointments have been cancelled.` };
        }

        if (queryType === 'popular_treatment') {
          const [rows] = await pool.query(
            `SELECT s.name, COUNT(a.id) as count FROM appointments a
             JOIN clinic_appointments ca ON a.id = ca.appointment_id
             JOIN services s ON a.service_id = s.id
             WHERE ca.clinic_id = ?
             GROUP BY s.id
             ORDER BY count DESC LIMIT 1`,
            [clinicId]
          );
          if (rows.length > 0) {
            return { service: rows[0].name, bookings: rows[0].count, message: `The most popular treatment is ${rows[0].name} with ${rows[0].count} bookings.` };
          }
          return { service: 'None', bookings: 0, message: 'No treatments have been booked yet.' };
        }

        if (queryType === 'doctor_performance') {
          const [rows] = await pool.query(
            `SELECT d.name, COUNT(a.id) as count FROM appointments a
             JOIN clinic_appointments ca ON a.id = ca.appointment_id
             JOIN doctors d ON a.doctor_id = d.id
             WHERE ca.clinic_id = ? AND a.status = 'completed'
             GROUP BY d.id
             ORDER BY count DESC`,
            [clinicId]
          );
          return {
            performance: rows,
            message: rows.map(r => `${r.name}: ${r.count} completed treatments`).join(', ')
          };
        }

        if (queryType === 'average_treatment_cost') {
          const [rows] = await pool.query(
            `SELECT AVG(s.price) as avg_cost FROM appointments a
             JOIN clinic_appointments ca ON a.id = ca.appointment_id
             JOIN services s ON a.service_id = s.id
             WHERE ca.clinic_id = ? AND a.status != 'cancelled'`,
            [clinicId]
          );
          const avgCost = rows[0].avg_cost || 0.00;
          return { averageCost: avgCost, message: `The average treatment cost is $${parseFloat(avgCost).toFixed(2)}.` };
        }

        return { error: 'INVALID_QUERY', message: 'Query type is not supported.' };
      } catch (error) {
        console.error('queryDashboardStats tool error:', error);
        return { error: 'SERVER_ERROR', message: error.message };
      }
    }
  }
};

module.exports = tools;
