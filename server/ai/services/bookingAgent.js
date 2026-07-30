const { z } = require('zod');
const { pool } = require('../../config/db');
const { getStreamingResponse } = require('./openAiService');
const PatientModel = require('../../models/patientModel');
const DoctorModel = require('../../models/doctorModel');
const AppointmentModel = require('../../models/appointmentModel');
const ServiceModel = require('../../models/serviceModel');
const saasLogger = require('../../utils/saasLogger');
const { getIO } = require('../../config/socket');

// Helper to get weekday name from date string
const getDayName = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

// Emit Socket.IO real-time events safely
const emitRealTimeUpdate = (room, eventName, payload) => {
  try {
    const io = getIO();
    io.to(room).emit(eventName, payload);
    console.log(`📣 Real-time Socket.IO update emitted to ${room}: ${eventName}`);
  } catch (err) {
    console.warn(`⚠️ Socket.IO emit warning (expected in tests):`, err.message);
  }
};

// Define OpenAI tools using Vercel AI SDK format
const receptionistTools = {
  // 1. checkAvailability
  checkAvailability: {
    description: 'Check available timeslots for a doctor on a specific date (YYYY-MM-DD)',
    parameters: z.object({
      doctorId: z.number().describe('The ID of the doctor'),
      date: z.string().describe('The target date in YYYY-MM-DD format')
    }),
    execute: async ({ doctorId, date }, { clinicId }) => {
      try {
        const doctor = await DoctorModel.findById(doctorId);
        if (!doctor || !doctor.is_active) {
          return { error: 'DOCTOR_NOT_FOUND', message: 'Doctor not found or inactive.' };
        }

        // Parse weekday name
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
            message: `${doctor.name} does not work on ${dayName}s. Scheduled days: ${availableDays.join(', ')}`
          };
        }

        // Retrieve booked appointments
        const [booked] = await pool.query(
          `SELECT appointment_time FROM appointments 
           WHERE doctor_id = ? AND appointment_date = ? AND status != 'cancelled'`,
          [doctorId, date]
        );
        const bookedSlots = booked.map(b => b.appointment_time.substring(0, 5));

        // Available slots from standard working hours (09:00 - 17:00 hourly)
        const workingSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
        const freeSlots = workingSlots.filter(s => !bookedSlots.includes(s));

        return {
          available: freeSlots.length > 0,
          date,
          dayName,
          availableSlots: freeSlots,
          message: freeSlots.length > 0 
            ? `Slots available: ${freeSlots.join(', ')}` 
            : 'All timeslots are fully booked.'
        };
      } catch (err) {
        console.error('Tool checkAvailability error:', err);
        return { error: 'QUERY_FAILED', message: err.message };
      }
    }
  },

  // 2. createPatient
  createPatient: {
    description: 'Create a new patient record in the database',
    parameters: z.object({
      name: z.string().describe('Full name of the patient'),
      email: z.string().email().describe('Email address of the patient'),
      phone: z.string().describe('Primary phone number of the patient'),
      age: z.number().optional().describe('Age of the patient'),
      gender: z.enum(['male', 'female', 'other']).optional().describe('Gender of the patient')
    }),
    execute: async ({ name, email, phone, age, gender }, { clinicId }) => {
      try {
        const patientId = await PatientModel.create({
          full_name: name,
          email,
          phone,
          age,
          gender
        });

        // Link patient to the current clinic tenant
        await pool.query(
          'INSERT IGNORE INTO clinic_patients (clinic_id, patient_id) VALUES (?, ?)',
          [clinicId, patientId]
        );

        saasLogger.logBooking(clinicId, 'PATIENT_CREATE', `Created Patient ID: ${patientId} (${name})`);
        return { success: true, patientId, message: `Patient record successfully created with ID ${patientId}.` };
      } catch (err) {
        console.error('Tool createPatient error:', err);
        return { error: 'INSERT_FAILED', message: err.message };
      }
    }
  },

  // 3. bookAppointment
  bookAppointment: {
    description: 'Book a new appointment slot for an existing patient',
    parameters: z.object({
      patientId: z.number().describe('The ID of the existing patient'),
      doctorId: z.number().describe('The ID of the dentist'),
      serviceId: z.number().describe('The ID of the dental service'),
      date: z.string().describe('Appointment date in YYYY-MM-DD format'),
      time: z.string().describe('Appointment time in HH:MM format (e.g. 11:00)'),
      message: z.string().optional().describe('Brief message or symptoms description')
    }),
    execute: async ({ patientId, doctorId, serviceId, date, time, message }, { clinicId }) => {
      try {
        const result = await AppointmentModel.create({
          patient_id: patientId,
          doctor_id: doctorId,
          service_id: serviceId,
          appointment_date: date,
          appointment_time: time,
          message
        });

        if (result.error) {
          return { error: result.error, message: result.message };
        }

        const appointmentId = result.id;

        // Link appointment to current clinic
        await pool.query(
          'INSERT INTO clinic_appointments (clinic_id, appointment_id) VALUES (?, ?)',
          [clinicId, appointmentId]
        );

        // Realtime Socket updates
        emitRealTimeUpdate('dashboard', 'dashboard:update', { action: 'book', appointmentId });
        emitRealTimeUpdate('appointments', 'appointment:booked', { appointmentId });

        saasLogger.logBooking(clinicId, 'APPT_BOOK', `Booked Appt ID: ${appointmentId} on ${date} at ${time}`);

        return {
          success: true,
          appointmentId,
          message: `Appointment successfully booked (ID: ${appointmentId}) for patient on ${date} at ${time}.`
        };
      } catch (err) {
        console.error('Tool bookAppointment error:', err);
        return { error: 'BOOKING_FAILED', message: err.message };
      }
    }
  },

  // 4. cancelAppointment
  cancelAppointment: {
    description: 'Cancel an existing dental appointment',
    parameters: z.object({
      appointmentId: z.number().describe('The ID of the appointment to cancel'),
      reason: z.string().describe('Reason for the cancellation')
    }),
    execute: async ({ appointmentId, reason }, { clinicId }) => {
      try {
        // Verify appointment mapping
        const [mapping] = await pool.query(
          'SELECT appointment_id FROM clinic_appointments WHERE clinic_id = ? AND appointment_id = ?',
          [clinicId, appointmentId]
        );

        if (mapping.length === 0) {
          return { error: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found in this clinic.' };
        }

        const success = await AppointmentModel.updateStatus(appointmentId, 'cancelled', 'AI Receptionist', reason);
        if (!success) {
          return { error: 'UPDATE_FAILED', message: 'Failed to update appointment status.' };
        }

        // Realtime updates
        emitRealTimeUpdate('dashboard', 'dashboard:update', { action: 'cancel', appointmentId });
        emitRealTimeUpdate('appointments', 'appointment:statusChanged', { appointmentId, status: 'cancelled' });

        saasLogger.logBooking(clinicId, 'APPT_CANCEL', `Cancelled Appt ID: ${appointmentId} - ${reason}`);

        return { success: true, message: `Appointment ${appointmentId} was successfully cancelled.` };
      } catch (err) {
        console.error('Tool cancelAppointment error:', err);
        return { error: 'CANCEL_FAILED', message: err.message };
      }
    }
  },

  // 5. rescheduleAppointment
  rescheduleAppointment: {
    description: 'Reschedule an existing appointment to a new date and time',
    parameters: z.object({
      appointmentId: z.number().describe('The ID of the appointment'),
      date: z.string().describe('New appointment date in YYYY-MM-DD'),
      time: z.string().describe('New appointment time in HH:MM')
    }),
    execute: async ({ appointmentId, date, time }, { clinicId }) => {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Verify mapping
        const [mapping] = await connection.query(
          'SELECT appointment_id FROM clinic_appointments WHERE clinic_id = ? AND appointment_id = ?',
          [clinicId, appointmentId]
        );

        if (mapping.length === 0) {
          await connection.rollback();
          return { error: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found in this clinic.' };
        }

        const [apptDetails] = await connection.query('SELECT doctor_id, status FROM appointments WHERE id = ?', [appointmentId]);
        if (apptDetails.length === 0) {
          await connection.rollback();
          return { error: 'APPOINTMENT_NOT_FOUND', message: 'Appointment details not found.' };
        }

        const doctorId = apptDetails[0].doctor_id;

        // Check availability on new date/time (double-booking protection)
        const [existing] = await connection.query(
          `SELECT id FROM appointments 
           WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? 
           AND id != ? AND status != 'cancelled'
           FOR UPDATE`,
          [doctorId, date, time, appointmentId]
        );

        if (existing.length > 0) {
          await connection.rollback();
          return { error: 'SLOT_TAKEN', message: 'The new requested time slot is already booked.' };
        }

        // Perform reschedule update
        await connection.query(
          'UPDATE appointments SET appointment_date = ?, appointment_time = ?, status = "pending" WHERE id = ?',
          [date, time, appointmentId]
        );

        // Add Log
        await connection.query(
          `INSERT INTO appointment_logs (appointment_id, old_status, new_status, changed_by, notes) 
           VALUES (?, ?, 'pending', 'AI Receptionist', ?)`,
          [appointmentId, apptDetails[0].status, `Rescheduled to ${date} at ${time} via AI`]
        );

        await connection.commit();

        // Realtime updates
        emitRealTimeUpdate('dashboard', 'dashboard:update', { action: 'reschedule', appointmentId });
        emitRealTimeUpdate('appointments', 'appointment:statusChanged', { appointmentId, status: 'pending' });

        saasLogger.logBooking(clinicId, 'APPT_RESCHEDULE', `Rescheduled Appt ID: ${appointmentId} to ${date} at ${time}`);

        return { success: true, message: `Appointment ${appointmentId} rescheduled successfully to ${date} at ${time}.` };
      } catch (err) {
        await connection.rollback();
        console.error('Tool rescheduleAppointment error:', err);
        return { error: 'RESCHEDULE_FAILED', message: err.message };
      } finally {
        connection.release();
      }
    }
  },

  // 6. findDoctor
  findDoctor: {
    description: 'Find a list of dentists matching specialization or name',
    parameters: z.object({
      specialization: z.string().optional().describe('Doctor specialization, e.g. Orthodontist, Pediatric'),
      name: z.string().optional().describe('Doctor name or fragment')
    }),
    execute: async ({ specialization, name }, { clinicId }) => {
      try {
        let sql = `
          SELECT d.id, d.name, d.specialization, d.qualification, d.experience, d.availability 
          FROM doctors d
          JOIN clinic_doctors cd ON d.id = cd.doctor_id
          WHERE cd.clinic_id = ? AND d.is_active = 1
        `;
        const params = [clinicId];

        if (specialization) {
          sql += ' AND d.specialization LIKE ?';
          params.push(`%${specialization}%`);
        }
        if (name) {
          sql += ' AND d.name LIKE ?';
          params.push(`%${name}%`);
        }

        const [doctors] = await pool.query(sql, params);
        
        const parsedDoctors = doctors.map(doc => {
          let avail = [];
          try { avail = typeof doc.availability === 'string' ? JSON.parse(doc.availability) : doc.availability; } catch (e) {}
          return { ...doc, availability: avail };
        });

        return { success: true, doctors: parsedDoctors };
      } catch (err) {
        console.error('Tool findDoctor error:', err);
        return { error: 'QUERY_FAILED', message: err.message };
      }
    }
  },

  // 7. listServices
  listServices: {
    description: 'Retrieve a list of dental treatments and services offered by the clinic',
    parameters: z.object({}),
    execute: async (_, { clinicId }) => {
      try {
        const [services] = await pool.query(
          `SELECT s.id, s.name, s.description, s.duration, s.price 
           FROM services s
           JOIN clinic_services cs ON s.id = cs.service_id
           WHERE cs.clinic_id = ? AND s.is_active = 1`,
          [clinicId]
        );
        return { success: true, services };
      } catch (err) {
        console.error('Tool listServices error:', err);
        return { error: 'QUERY_FAILED', message: err.message };
      }
    }
  }
};

const bookingAgent = {
  chat: async ({ clinicId, messages, onChunk, onFinish }) => {
    try {
      // 1. Fetch clinic details
      let clinicName = 'Denti-Choice';
      const [clinicRows] = await pool.query('SELECT name FROM clinics WHERE id = ?', [clinicId]);
      if (clinicRows.length > 0) {
        clinicName = clinicRows[0].name;
      }

      // 2. Fetch doctors in clinic roster
      const [doctorRows] = await pool.query(
        `SELECT d.id, d.name, d.specialization 
         FROM doctors d
         JOIN clinic_doctors cd ON d.id = cd.doctor_id
         WHERE cd.clinic_id = ? AND d.is_active = 1`,
        [clinicId]
      );

      // 3. Fetch services list
      const [serviceRows] = await pool.query(
        `SELECT s.id, s.name, s.price 
         FROM services s
         JOIN clinic_services cs ON s.id = cs.service_id
         WHERE cs.clinic_id = ? AND s.is_active = 1`,
        [clinicId]
      );

      // 4. Construct System Prompt
      const systemPrompt = `
You are the professional AI Receptionist for "${clinicName}". Your objective is to help patients interact with the clinic.

You have access to 7 database tools:
- \`checkAvailability(doctorId, date)\`: Check if a doctor is available on a YYYY-MM-DD date.
- \`createPatient(name, email, phone, age, gender)\`: Register a new patient.
- \`bookAppointment(patientId, doctorId, serviceId, date, time, message)\`: Schedule a slot.
- \`cancelAppointment(appointmentId, reason)\`: Cancel a booking.
- \`rescheduleAppointment(appointmentId, date, time)\`: Change booking schedule.
- \`findDoctor(specialization, name)\`: Retrieve doctor directories.
- \`listServices()\`: List all available treatments.

Roster Data Summary:
Doctors: ${JSON.stringify(doctorRows)}
Services: ${JSON.stringify(serviceRows)}

Guidelines:
- **Conversation Memory**: Pay close attention to what the patient states (like their name, desired doctor, appointment ID). Keep track of it in context.
- **Do not generate fake data**: Always use the available tools to check directories, availabilities, or verify items. Do not assume or hallucinate patient IDs or slots.
- **New Bookings Flow**:
  1. Check doctor/service list or find doctor matching preferences.
  2. Call \`checkAvailability\` on desired date to find free slots.
  3. Register patient using \`createPatient\` to obtain their \`patientId\` if they are new.
  4. Call \`bookAppointment\` with the \`patientId\` and chosen time.
  5. State confirmation details (date, time, doctor) clearly.
- **Reschedules / Cancellations**: Retrieve details from tool calls first, then execute updates.

Always respond in a professional and clinical tone.
`;

      // 5. Stream responses via AI model
      const fullText = await getStreamingResponse({
        clinicId,
        system: systemPrompt,
        messages,
        tools: receptionistTools,
        onChunk,
        onFinish
      });

      return fullText;
    } catch (err) {
      console.error('bookingAgent chat error:', err);
      throw err;
    }
  }
};

module.exports = { bookingAgent, receptionistTools };
