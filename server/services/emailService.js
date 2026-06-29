const { createTransporter } = require('../config/mailer');
const logger = require('../utils/logger');
const { formatDate, formatTime } = require('../utils/helpers');

const BRAND_COLOR = '#0077B6';
const ACCENT_COLOR = '#00B4D8';

/**
 * Base HTML email wrapper
 */
const emailWrapper = (content, title) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, ${BRAND_COLOR}, ${ACCENT_COLOR}); padding: 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.9); margin: 5px 0 0; font-size: 14px; }
    .body { padding: 30px; }
    .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef; }
    .footer p { color: #6c757d; font-size: 12px; margin: 5px 0; }
    .btn { display: inline-block; padding: 12px 30px; background: ${BRAND_COLOR}; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 15px 0; }
    .info-box { background: #f0f9ff; border-left: 4px solid ${BRAND_COLOR}; padding: 15px 20px; margin: 15px 0; border-radius: 0 6px 6px 0; }
    .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .info-label { font-weight: 600; color: #555; min-width: 140px; }
    .info-value { color: #333; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-pending { background: #fff3cd; color: #856404; }
    .badge-confirmed { background: #d4edda; color: #155724; }
    .badge-completed { background: #d1ecf1; color: #0c5460; }
    .badge-cancelled { background: #f8d7da; color: #721c24; }
    h2 { color: #333; font-size: 22px; margin-bottom: 10px; }
    p { color: #555; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; }
    table td { padding: 10px 0; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
    table td:first-child { font-weight: 600; color: #555; width: 40%; }
    table td:last-child { color: #333; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🦷 Denti-Choice</h1>
      <p>Your Smile, Our Priority</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p><strong>Denti-Choice Dental Clinic</strong></p>
      <p>123 Dental Avenue, Healthcare District, New York, NY 10001</p>
      <p>📞 +1 (555) 123-4567 | ✉️ info@dentichoice.com</p>
      <p style="margin-top: 10px;">© ${new Date().getFullYear()} Denti-Choice. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

const EmailService = {
  /**
   * Send email
   */
  async send(to, subject, html) {
    try {
      const transporter = createTransporter();
      const info = await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'Denti-Choice'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to,
        subject,
        html
      });
      logger.email(`Email sent to ${to}: ${subject} (${info.messageId})`);
      return true;
    } catch (error) {
      logger.error(`Failed to send email to ${to}`, error);
      return false;
    }
  },

  /**
   * Booking confirmation to patient
   */
  async sendBookingConfirmation(appointment) {
    const content = `
      <h2>✅ Appointment Booked Successfully!</h2>
      <p>Dear <strong>${appointment.patient_name}</strong>,</p>
      <p>Your appointment has been successfully booked at Denti-Choice Dental Clinic. Here are your appointment details:</p>
      
      <div class="info-box">
        <table>
          <tr><td>📋 Appointment ID</td><td>#APT-${String(appointment.id).padStart(5, '0')}</td></tr>
          <tr><td>👨‍⚕️ Doctor</td><td>${appointment.doctor_name}</td></tr>
          <tr><td>🏥 Service</td><td>${appointment.service_name}</td></tr>
          <tr><td>📅 Date</td><td>${formatDate(appointment.appointment_date)}</td></tr>
          <tr><td>🕐 Time</td><td>${formatTime(appointment.appointment_time)}</td></tr>
          <tr><td>📌 Status</td><td><span class="badge badge-pending">Pending</span></td></tr>
        </table>
      </div>

      <p><strong>📍 Clinic Address:</strong> 123 Dental Avenue, Healthcare District, New York, NY 10001</p>
      <p><strong>📞 Contact:</strong> +1 (555) 123-4567</p>
      
      <p>Your appointment is currently <strong>pending confirmation</strong>. You will receive another email once it has been confirmed by our team.</p>
      <p>Thank you for choosing Denti-Choice! 😊</p>
    `;
    return this.send(appointment.patient_email, 'Appointment Booked - Denti-Choice', emailWrapper(content, 'Appointment Booked'));
  },

  /**
   * New appointment notification to admin
   */
  async sendAdminNotification(appointment) {
    const content = `
      <h2>🔔 New Appointment Booked</h2>
      <p>A new appointment has been booked at Denti-Choice.</p>
      
      <div class="info-box">
        <table>
          <tr><td>Patient</td><td>${appointment.patient_name}</td></tr>
          <tr><td>Email</td><td>${appointment.patient_email}</td></tr>
          <tr><td>Phone</td><td>${appointment.patient_phone}</td></tr>
          <tr><td>Doctor</td><td>${appointment.doctor_name}</td></tr>
          <tr><td>Service</td><td>${appointment.service_name}</td></tr>
          <tr><td>Date</td><td>${formatDate(appointment.appointment_date)}</td></tr>
          <tr><td>Time</td><td>${formatTime(appointment.appointment_time)}</td></tr>
          ${appointment.message ? `<tr><td>Message</td><td>${appointment.message}</td></tr>` : ''}
        </table>
      </div>

      <p>Please review and confirm this appointment from the admin dashboard.</p>
    `;
    const adminEmail = process.env.SMTP_USER || 'admin@dentichoice.com';
    return this.send(adminEmail, 'New Appointment Booked - Denti-Choice Admin', emailWrapper(content, 'New Appointment'));
  },

  /**
   * New patient notification to doctor
   */
  async sendDoctorNewPatient(appointment) {
    const content = `
      <h2>👤 New Patient Appointment</h2>
      <p>Dear Dr. <strong>${appointment.doctor_name}</strong>,</p>
      <p>A new appointment has been scheduled with you:</p>
      
      <div class="info-box">
        <table>
          <tr><td>Appointment ID</td><td>#APT-${String(appointment.id).padStart(5, '0')}</td></tr>
          <tr><td>Patient Name</td><td>${appointment.patient_name}</td></tr>
          <tr><td>Phone</td><td>${appointment.patient_phone}</td></tr>
          <tr><td>Email</td><td>${appointment.patient_email}</td></tr>
          <tr><td>Service</td><td>${appointment.service_name}</td></tr>
          <tr><td>Date</td><td>${formatDate(appointment.appointment_date)}</td></tr>
          <tr><td>Time</td><td>${formatTime(appointment.appointment_time)}</td></tr>
          ${appointment.message ? `<tr><td>Notes</td><td>${appointment.message}</td></tr>` : ''}
        </table>
      </div>
    `;
    return this.send(appointment.doctor_email, 'New Patient Appointment - Denti-Choice', emailWrapper(content, 'New Patient'));
  },

  /**
   * Appointment confirmed emails
   */
  async sendAppointmentConfirmed(appointment) {
    // Email to patient
    const patientContent = `
      <h2>✅ Appointment Confirmed!</h2>
      <p>Dear <strong>${appointment.patient_name}</strong>,</p>
      <p>Great news! Your appointment has been <strong>confirmed</strong>.</p>
      
      <div class="info-box">
        <table>
          <tr><td>📋 Appointment ID</td><td>#APT-${String(appointment.id).padStart(5, '0')}</td></tr>
          <tr><td>👨‍⚕️ Doctor</td><td>${appointment.doctor_name}</td></tr>
          <tr><td>🏥 Service</td><td>${appointment.service_name}</td></tr>
          <tr><td>📅 Date</td><td>${formatDate(appointment.appointment_date)}</td></tr>
          <tr><td>🕐 Time</td><td>${formatTime(appointment.appointment_time)}</td></tr>
          <tr><td>📌 Status</td><td><span class="badge badge-confirmed">Confirmed</span></td></tr>
        </table>
      </div>

      <p><strong>📍 Location:</strong> 123 Dental Avenue, Healthcare District, New York, NY 10001</p>
      <a href="https://maps.google.com/?q=123+Dental+Avenue+New+York" class="btn">📍 View on Google Maps</a>

      <h3>📋 Before Your Visit:</h3>
      <ul>
        <li>Please arrive 15 minutes before your scheduled time</li>
        <li>Bring your ID and insurance card (if applicable)</li>
        <li>List any medications you are currently taking</li>
        <li>Avoid eating 2 hours before the appointment (for certain procedures)</li>
      </ul>
      
      <p><strong>📞 Contact:</strong> +1 (555) 123-4567</p>
      <p>We look forward to seeing you! 😊</p>
    `;
    await this.send(appointment.patient_email, 'Appointment Confirmed - Denti-Choice', emailWrapper(patientContent, 'Appointment Confirmed'));

    // Email to doctor
    const doctorContent = `
      <h2>📅 Appointment Confirmed</h2>
      <p>Dear Dr. <strong>${appointment.doctor_name}</strong>,</p>
      <p>The following appointment has been confirmed:</p>
      
      <div class="info-box">
        <table>
          <tr><td>Appointment ID</td><td>#APT-${String(appointment.id).padStart(5, '0')}</td></tr>
          <tr><td>Patient</td><td>${appointment.patient_name}</td></tr>
          <tr><td>Phone</td><td>${appointment.patient_phone}</td></tr>
          <tr><td>Email</td><td>${appointment.patient_email}</td></tr>
          <tr><td>Service</td><td>${appointment.service_name}</td></tr>
          <tr><td>Date</td><td>${formatDate(appointment.appointment_date)}</td></tr>
          <tr><td>Time</td><td>${formatTime(appointment.appointment_time)}</td></tr>
          ${appointment.message ? `<tr><td>Notes</td><td>${appointment.message}</td></tr>` : ''}
        </table>
      </div>
    `;
    await this.send(appointment.doctor_email, 'Appointment Confirmed - Denti-Choice', emailWrapper(doctorContent, 'Appointment Confirmed'));
  },

  /**
   * Appointment cancelled emails
   */
  async sendAppointmentCancelled(appointment) {
    const patientContent = `
      <h2>❌ Appointment Cancelled</h2>
      <p>Dear <strong>${appointment.patient_name}</strong>,</p>
      <p>We regret to inform you that your appointment has been <strong>cancelled</strong>.</p>
      
      <div class="info-box">
        <table>
          <tr><td>Appointment ID</td><td>#APT-${String(appointment.id).padStart(5, '0')}</td></tr>
          <tr><td>Doctor</td><td>${appointment.doctor_name}</td></tr>
          <tr><td>Service</td><td>${appointment.service_name}</td></tr>
          <tr><td>Date</td><td>${formatDate(appointment.appointment_date)}</td></tr>
          <tr><td>Time</td><td>${formatTime(appointment.appointment_time)}</td></tr>
          ${appointment.cancellation_reason ? `<tr><td>Reason</td><td>${appointment.cancellation_reason}</td></tr>` : ''}
        </table>
      </div>

      <p>If you would like to reschedule, please book a new appointment or contact us.</p>
      <p><strong>📞 Contact:</strong> +1 (555) 123-4567</p>
    `;
    await this.send(appointment.patient_email, 'Appointment Cancelled - Denti-Choice', emailWrapper(patientContent, 'Appointment Cancelled'));

    const doctorContent = `
      <h2>❌ Appointment Cancelled</h2>
      <p>Dear Dr. <strong>${appointment.doctor_name}</strong>,</p>
      <p>The following appointment has been cancelled:</p>
      
      <div class="info-box">
        <table>
          <tr><td>Patient</td><td>${appointment.patient_name}</td></tr>
          <tr><td>Date</td><td>${formatDate(appointment.appointment_date)}</td></tr>
          <tr><td>Time</td><td>${formatTime(appointment.appointment_time)}</td></tr>
          ${appointment.cancellation_reason ? `<tr><td>Reason</td><td>${appointment.cancellation_reason}</td></tr>` : ''}
        </table>
      </div>
    `;
    await this.send(appointment.doctor_email, 'Appointment Cancelled - Denti-Choice', emailWrapper(doctorContent, 'Appointment Cancelled'));
  },

  /**
   * Appointment completed - Thank you email
   */
  async sendAppointmentCompleted(appointment) {
    const content = `
      <h2>🎉 Thank You for Visiting!</h2>
      <p>Dear <strong>${appointment.patient_name}</strong>,</p>
      <p>Thank you for visiting Denti-Choice Dental Clinic! We hope your experience was wonderful.</p>
      
      <div class="info-box">
        <table>
          <tr><td>Doctor</td><td>${appointment.doctor_name}</td></tr>
          <tr><td>Service</td><td>${appointment.service_name}</td></tr>
          <tr><td>Date</td><td>${formatDate(appointment.appointment_date)}</td></tr>
        </table>
      </div>

      <p>We would love to hear about your experience! Your feedback helps us improve our services and helps other patients make informed decisions.</p>
      
      <p>Thank you for trusting Denti-Choice with your dental care. We look forward to seeing you again! 😊</p>
      <p>Best regards,<br>The Denti-Choice Team</p>
    `;
    return this.send(appointment.patient_email, 'Thank You for Your Visit - Denti-Choice', emailWrapper(content, 'Thank You'));
  },

  /**
   * Contact form reply
   */
  async sendContactReply(contact, replyMessage) {
    const content = `
      <h2>📩 Reply to Your Inquiry</h2>
      <p>Dear <strong>${contact.name}</strong>,</p>
      <p>Thank you for reaching out to Denti-Choice. Here is our response to your inquiry:</p>
      
      <div class="info-box">
        <p><strong>Your Message:</strong></p>
        <p>${contact.message}</p>
      </div>

      <div class="info-box" style="border-left-color: ${ACCENT_COLOR};">
        <p><strong>Our Response:</strong></p>
        <p>${replyMessage}</p>
      </div>

      <p>If you have any further questions, feel free to reply to this email or call us at +1 (555) 123-4567.</p>
      <p>Best regards,<br>The Denti-Choice Team</p>
    `;
    return this.send(contact.email, 'Re: Your Inquiry - Denti-Choice', emailWrapper(content, 'Contact Reply'));
  }
};

module.exports = EmailService;
