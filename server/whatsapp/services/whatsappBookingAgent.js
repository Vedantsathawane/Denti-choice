const { pool } = require('../../config/db');
const PatientModel = require('../../models/patientModel');
const DoctorModel = require('../../models/doctorModel');
const AppointmentModel = require('../../models/appointmentModel');
const ServiceModel = require('../../models/serviceModel');
const ClinicSettingModel = require('../../models/clinic/clinicSettingModel');
const NotificationService = require('../../services/notificationService');
const SocketService = require('../../services/socketService');

const sessions = new Map();
const TTL = 30 * 60 * 1000; // 30 minutes session expiry

const cleanExpiredSessions = () => {
  const now = Date.now();
  for (const [phone, session] of sessions.entries()) {
    if (now - session.lastActive > TTL) {
      sessions.delete(phone);
    }
  }
};

const whatsappBookingAgent = {
  /**
   * Handle incoming message and progress state machine.
   * Returns response text to send back to patient.
   */
  async processMessage({ clinicId, fromPhone, messageText }) {
    cleanExpiredSessions();
    const cleanText = messageText.trim().toLowerCase();

    // Check if user requests menu reset
    if (cleanText === 'menu' || cleanText === 'hi' || cleanText === 'hello' || cleanText === 'exit' || !sessions.has(fromPhone)) {
      sessions.set(fromPhone, {
        state: 'menu',
        data: {},
        lastActive: Date.now()
      });
      return await this.renderMenu(clinicId);
    }

    const session = sessions.get(fromPhone);
    session.lastActive = Date.now();

    switch (session.state) {
      case 'menu':
        return await this.handleMenuSelection(clinicId, fromPhone, cleanText, session);
      
      // BOOKING STEPS
      case 'booking_service':
        return await this.handleServiceSelection(clinicId, fromPhone, cleanText, session);
      case 'booking_doctor':
        return await this.handleDoctorSelection(clinicId, fromPhone, cleanText, session);
      case 'booking_date':
        return await this.handleDateSelection(clinicId, fromPhone, cleanText, session);
      case 'booking_time':
        return await this.handleTimeSelection(clinicId, fromPhone, cleanText, session);
      case 'booking_name':
        return await this.handleNameSelection(clinicId, fromPhone, messageText.trim(), session);
      case 'booking_email':
        return await this.handleEmailSelection(clinicId, fromPhone, cleanText, session);

      // CANCELLATION STEPS
      case 'cancel_appt_id':
        return await this.handleCancelApptId(clinicId, fromPhone, cleanText, session);
      case 'cancel_reason':
        return await this.handleCancelReason(clinicId, fromPhone, messageText.trim(), session);

      // RESCHEDULE STEPS
      case 'reschedule_appt_id':
        return await this.handleRescheduleApptId(clinicId, fromPhone, cleanText, session);
      case 'reschedule_date':
        return await this.handleRescheduleDate(clinicId, fromPhone, cleanText, session);
      case 'reschedule_time':
        return await this.handleRescheduleTime(clinicId, fromPhone, cleanText, session);

      default:
        sessions.delete(fromPhone);
        return "Oops! I lost track of our session state. Please reply 'HI' or 'MENU' to start over.";
    }
  },

  async renderMenu(clinicId) {
    let name = 'Denti-Choice Clinic';
    const [rows] = await pool.query('SELECT name FROM clinics WHERE id = ?', [clinicId]);
    if (rows.length > 0) name = rows[0].name;

    return `Welcome to ${name}. How can we help you today?

Please reply with the option number (1-6):
1. Book Appointment
2. Reschedule Appointment
3. Cancel Appointment
4. Clinic Location
5. Services Offered
6. Contact Reception`;
  },

  async handleMenuSelection(clinicId, fromPhone, selection, session) {
    if (selection === '1' || selection.includes('book')) {
      // Fetch services list
      const [services] = await pool.query(
        `SELECT s.id, s.name, s.price 
         FROM services s
         JOIN clinic_services cs ON s.id = cs.service_id
         WHERE cs.clinic_id = ? AND s.is_active = 1`,
        [clinicId]
      );

      if (services.length === 0) {
        sessions.delete(fromPhone);
        return "We currently don't have any treatments listed. Please contact the clinic receptionist.";
      }

      session.state = 'booking_service';
      session.data.servicesList = services;

      let reply = "Please select a dental service/treatment from the list below (reply with number):\n\n";
      services.forEach((s, idx) => {
        reply += `${idx + 1}. ${s.name} ($${s.price})\n`;
      });
      return reply;
    } 
    
    else if (selection === '2' || selection.includes('reschedule')) {
      session.state = 'reschedule_appt_id';
      return "Please reply with your numeric Appointment ID (e.g. 104) to reschedule:";
    } 
    
    else if (selection === '3' || selection.includes('cancel')) {
      session.state = 'cancel_appt_id';
      return "Please reply with your numeric Appointment ID (e.g. 104) to cancel:";
    } 
    
    else if (selection === '4' || selection.includes('location')) {
      sessions.delete(fromPhone);
      const settings = await ClinicSettingModel.getSettings(clinicId);
      const address = settings.clinic_address || '123 Smile Street, Suite A';
      const maps = settings.google_maps_url || 'https://maps.google.com';
      return `📍 Clinic Location:\n${address}\n\nMap Link: ${maps}\n\nType 'HI' or 'MENU' to return to options.`;
    } 
    
    else if (selection === '5' || selection.includes('services')) {
      const [services] = await pool.query(
        `SELECT s.name, s.price, s.duration 
         FROM services s
         JOIN clinic_services cs ON s.id = cs.service_id
         WHERE cs.clinic_id = ? AND s.is_active = 1`,
        [clinicId]
      );
      sessions.delete(fromPhone);
      
      let reply = "🦷 Treatments & Services:\n\n";
      services.forEach(s => {
        reply += `- ${s.name} ($${s.price}) [Duration: ${s.duration}]\n`;
      });
      reply += "\nType 'HI' or 'MENU' to return to options.";
      return reply;
    } 
    
    else if (selection === '6' || selection.includes('contact')) {
      sessions.delete(fromPhone);
      const settings = await ClinicSettingModel.getSettings(clinicId);
      const phone = settings.clinic_phone || '+1 555 0199';
      const email = settings.clinic_email || 'reception@dentichoice.com';
      return `📞 Contact Details:\nPhone: ${phone}\nEmail: ${email}\n\nOur team is ready to help you! Type 'HI' or 'MENU' to return.`;
    }

    return "Invalid selection. Please reply with a number from 1 to 6, or type 'MENU'.";
  },

  async handleServiceSelection(clinicId, fromPhone, selection, session) {
    const idx = parseInt(selection) - 1;
    const services = session.data.servicesList;

    if (isNaN(idx) || idx < 0 || idx >= services.length) {
      return "Invalid selection. Please select one of the service options from the list above.";
    }

    session.data.serviceId = services[idx].id;
    session.data.serviceName = services[idx].name;

    // Fetch doctors list
    const [doctors] = await pool.query(
      `SELECT d.id, d.name, d.specialization 
       FROM doctors d
       JOIN clinic_doctors cd ON d.id = cd.doctor_id
       WHERE cd.clinic_id = ? AND d.is_active = 1`,
      [clinicId]
    );

    if (doctors.length === 0) {
      sessions.delete(fromPhone);
      return "There are no active doctors in the roster for this service right now. Please contact support.";
    }

    session.state = 'booking_doctor';
    session.data.doctorsList = doctors;

    let reply = `Selected service: ${session.data.serviceName}.\n\nPlease select a dentist doctor from the list below (reply with number):\n\n`;
    doctors.forEach((d, i) => {
      reply += `${i + 1}. Dr. ${d.name} (${d.specialization})\n`;
    });
    return reply;
  },

  async handleDoctorSelection(clinicId, fromPhone, selection, session) {
    const idx = parseInt(selection) - 1;
    const doctors = session.data.doctorsList;

    if (isNaN(idx) || idx < 0 || idx >= doctors.length) {
      return "Invalid selection. Please select one of the doctors from the list above.";
    }

    session.data.doctorId = doctors[idx].id;
    session.data.doctorName = doctors[idx].name;
    session.state = 'booking_date';

    return "Please reply with your desired booking date in YYYY-MM-DD format (e.g., 2026-08-10):";
  },

  async handleDateSelection(clinicId, fromPhone, selection, session) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(selection)) {
      return "Invalid date format. Please reply with the date exactly in YYYY-MM-DD format (e.g. 2026-08-15):";
    }

    // Check if date is in past
    const targetDate = new Date(selection);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (targetDate < today) {
      return "The date cannot be in the past. Please enter a future booking date in YYYY-MM-DD format:";
    }

    // Retrieve doctor availability details
    const doctor = await DoctorModel.findById(session.data.doctorId);
    if (!doctor) {
      sessions.delete(fromPhone);
      return "Selected doctor was not found. Reply 'MENU' to restart.";
    }

    const dayOfWeekName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
    let availDays = [];
    try {
      availDays = typeof doctor.availability === 'string' ? JSON.parse(doctor.availability) : (doctor.availability || []);
    } catch(e) {}

    if (availDays.length > 0 && !availDays.includes(dayOfWeekName)) {
      return `Dr. ${doctor.name} does not work on ${dayOfWeekName}s. Work days: ${availDays.join(', ')}. Please select another date:`;
    }

    // Query booked appointments
    const [booked] = await pool.query(
      `SELECT appointment_time FROM appointments 
       WHERE doctor_id = ? AND appointment_date = ? AND status != 'cancelled'`,
      [session.data.doctorId, selection]
    );
    const bookedTimes = booked.map(b => b.appointment_time.substring(0, 5));

    // Simple slots list
    const defaultSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
    const freeSlots = defaultSlots.filter(s => !bookedTimes.includes(s));

    if (freeSlots.length === 0) {
      return `All slots for Dr. ${doctor.name} are fully booked on ${selection}. Please try another date:`;
    }

    session.data.date = selection;
    session.data.slotsList = freeSlots;
    session.state = 'booking_time';

    let reply = `Available timeslots for Dr. ${doctor.name} on ${selection} (reply with number):\n\n`;
    freeSlots.forEach((s, idx) => {
      reply += `${idx + 1}. ${s}\n`;
    });
    return reply;
  },

  async handleTimeSelection(clinicId, fromPhone, selection, session) {
    const idx = parseInt(selection) - 1;
    const slots = session.data.slotsList;

    if (isNaN(idx) || idx < 0 || idx >= slots.length) {
      return "Invalid selection. Please choose a slot number from the list above.";
    }

    session.data.time = slots[idx];
    session.state = 'booking_name';

    return "Please reply with the patient's Full Name to register:";
  },

  async handleNameSelection(clinicId, fromPhone, selection, session) {
    if (selection.length < 2) {
      return "Please enter a valid patient full name (minimum 2 letters):";
    }

    session.data.patientName = selection;
    session.state = 'booking_email';

    return "Please reply with your Email address for notification alerts:";
  },

  async handleEmailSelection(clinicId, fromPhone, selection, session) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(selection)) {
      return "Invalid email address format. Please enter a valid email:";
    }

    session.data.patientEmail = selection;

    try {
      // 1. Get or Create Patient in MySQL
      let patientId;
      const [existing] = await pool.query(
        'SELECT id FROM patients WHERE phone = ? OR email = ? LIMIT 1',
        [fromPhone, selection]
      );

      if (existing.length > 0) {
        patientId = existing[0].id;
      } else {
        const [patientResult] = await pool.query(
          `INSERT INTO patients (full_name, email, phone, age, gender) 
           VALUES (?, ?, ?, 30, 'other')`,
          [session.data.patientName, selection, fromPhone]
        );
        patientId = patientResult.insertId;

        // map to clinic_patients
        await pool.query(
          'INSERT IGNORE INTO clinic_patients (clinic_id, patient_id) VALUES (?, ?)',
          [clinicId, patientId]
        );
      }

      // 2. Book appointment
      const formattedTime = `${session.data.time}:00`;
      const [apptResult] = await pool.query(
        `INSERT INTO appointments (patient_id, doctor_id, service_id, appointment_date, appointment_time, status, clinic_id) 
         VALUES (?, ?, ?, ?, ?, 'confirmed', ?)`,
        [patientId, session.data.doctorId, session.data.serviceId, session.data.date, formattedTime, clinicId]
      );
      const apptId = apptResult.insertId;

      // map to clinic_appointments
      await pool.query(
        'INSERT IGNORE INTO clinic_appointments (clinic_id, appointment_id) VALUES (?, ?)',
        [clinicId, apptId]
      );

      // 3. Trigger notification suites
      const fullAppt = {
        id: apptId,
        clinic_id: clinicId,
        patient_id: patientId,
        patient_name: session.data.patientName,
        patient_email: selection,
        patient_phone: fromPhone,
        doctor_name: session.data.doctorName,
        doctor_id: session.data.doctorId,
        appointment_date: session.data.date,
        appointment_time: formattedTime,
        service_name: session.data.serviceName,
        service_id: session.data.serviceId
      };

      // Dispatch Email & socket.io in background
      NotificationService.triggerAppointmentNotification(fullAppt, 'confirmed').catch(err => {
        logger.error('Failed dispatching notification on whatsapp appointment:', err.message);
      });

      // Clear session state
      sessions.delete(fromPhone);

      return `✅ Booking Confirmed!
Appointment ID: APT-${String(apptId).padStart(5, '0')}
Patient: ${fullAppt.patient_name}
Doctor: Dr. ${fullAppt.doctor_name}
Service: ${fullAppt.service_name}
Date: ${fullAppt.appointment_date}
Time: ${session.data.time}

A confirmation has been sent to your email. Thank you!`;

    } catch (err) {
      logger.error('WhatsApp booking insert error:', err.message);
      sessions.delete(fromPhone);
      return `Sorry, I encountered an internal database issue booking your slot. Please contact reception at settings.`;
    }
  },

  // --- CANCELLATION LOGIC ---
  async handleCancelApptId(clinicId, fromPhone, selection, session) {
    const apptId = parseInt(selection);
    if (isNaN(apptId)) {
      return "Invalid ID. Please reply with the numeric Appointment ID (e.g. 104):";
    }

    const appt = await AppointmentModel.findById(apptId);
    if (!appt || appt.clinic_id !== clinicId) {
      return "No appointment found with that ID under this clinic. Please verify the ID:";
    }

    if (appt.status === 'cancelled') {
      sessions.delete(fromPhone);
      return "This appointment is already cancelled. Reply 'MENU' to restart.";
    }

    session.data.appointment = appt;
    session.state = 'cancel_reason';
    return "Please enter the reason for cancellation:";
  },

  async handleCancelReason(clinicId, fromPhone, selection, session) {
    const appt = session.data.appointment;
    try {
      await pool.query(
        "UPDATE appointments SET status = 'cancelled', cancellation_reason = ? WHERE id = ?",
        [selection, appt.id]
      );

      // Trigger notifications
      NotificationService.triggerAppointmentNotification({
        ...appt,
        status: 'cancelled',
        cancellation_reason: selection
      }, 'cancelled').catch(() => {});

      sessions.delete(fromPhone);
      return `❌ Appointment APT-${String(appt.id).padStart(5, '0')} has been successfully cancelled.`;
    } catch (err) {
      sessions.delete(fromPhone);
      return "Failed to cancel appointment. Please try again later.";
    }
  },

  // --- RESCHEDULE LOGIC ---
  async handleRescheduleApptId(clinicId, fromPhone, selection, session) {
    const apptId = parseInt(selection);
    if (isNaN(apptId)) {
      return "Invalid ID. Please reply with the numeric Appointment ID (e.g. 104):";
    }

    const appt = await AppointmentModel.findById(apptId);
    if (!appt || appt.clinic_id !== clinicId) {
      return "No appointment found with that ID under this clinic. Please verify the ID:";
    }

    session.data.appointment = appt;
    session.state = 'reschedule_date';
    return "Please enter the new booking date in YYYY-MM-DD format (e.g. 2026-08-12):";
  },

  async handleRescheduleDate(clinicId, fromPhone, selection, session) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(selection)) {
      return "Invalid date format. Please reply with the date exactly in YYYY-MM-DD format:";
    }

    const targetDate = new Date(selection);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (targetDate < today) {
      return "The date cannot be in the past. Please enter a future booking date in YYYY-MM-DD format:";
    }

    const appt = session.data.appointment;
    const doctor = await DoctorModel.findById(appt.doctor_id);

    const dayOfWeekName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
    let availDays = [];
    try { availDays = typeof doctor.availability === 'string' ? JSON.parse(doctor.availability) : (doctor.availability || []); } catch(e) {}

    if (availDays.length > 0 && !availDays.includes(dayOfWeekName)) {
      return `Dr. ${doctor.name} does not work on ${dayOfWeekName}s. Work days: ${availDays.join(', ')}. Please select another date:`;
    }

    // Query booked
    const [booked] = await pool.query(
      `SELECT appointment_time FROM appointments 
       WHERE doctor_id = ? AND appointment_date = ? AND status != 'cancelled' AND id != ?`,
      [appt.doctor_id, selection, appt.id]
    );
    const bookedTimes = booked.map(b => b.appointment_time.substring(0, 5));

    const defaultSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
    const freeSlots = defaultSlots.filter(s => !bookedTimes.includes(s));

    if (freeSlots.length === 0) {
      return `All slots are fully booked on ${selection}. Please try another date:`;
    }

    session.data.newDate = selection;
    session.data.slotsList = freeSlots;
    session.state = 'reschedule_time';

    let reply = `Available timeslots on ${selection} (reply with number):\n\n`;
    freeSlots.forEach((s, idx) => {
      reply += `${idx + 1}. ${s}\n`;
    });
    return reply;
  },

  async handleRescheduleTime(clinicId, fromPhone, selection, session) {
    const idx = parseInt(selection) - 1;
    const slots = session.data.slotsList;

    if (isNaN(idx) || idx < 0 || idx >= slots.length) {
      return "Invalid selection. Please choose a timeslot number from the list above:";
    }

    const appt = session.data.appointment;
    const newTime = `${slots[idx]}:00`;
    const newDate = session.data.newDate;

    try {
      await pool.query(
        "UPDATE appointments SET appointment_date = ?, appointment_time = ? WHERE id = ?",
        [newDate, newTime, appt.id]
      );

      // Trigger notifications
      const updatedAppt = await AppointmentModel.findById(appt.id);
      NotificationService.triggerAppointmentNotification(updatedAppt, 'rescheduled').catch(() => {});

      sessions.delete(fromPhone);
      return `✅ Appointment APT-${String(appt.id).padStart(5, '0')} has been rescheduled to ${newDate} at ${slots[idx]}.`;
    } catch (err) {
      sessions.delete(fromPhone);
      return "Failed to reschedule appointment. Please try again later.";
    }
  }
};

module.exports = whatsappBookingAgent;
