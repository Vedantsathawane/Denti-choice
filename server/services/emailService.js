const { createTransporter } = require('../config/mailer');
const logger = require('../utils/logger');
const { formatDate, formatTime } = require('../utils/helpers');
const SettingModel = require('../models/settingModel');

const BRAND_COLOR = '#0066FF';
const ACCENT_COLOR = '#00F5D4';

// Inline styling tokens for premium, responsive HTML email delivery (Vibrant Accent Edition)
const bodyStyle = 'background-color: #F4F7FC; padding: 40px 10px; font-family: \'Outfit\', \'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif; margin: 0;';
const containerStyle = 'max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #D6E4FF; overflow: hidden; box-shadow: 0 15px 30px -5px rgba(0, 102, 255, 0.08), 0 8px 12px -6px rgba(0, 102, 255, 0.04);';
const bodyContentStyle = 'padding: 40px 30px;';
const greetingStyle = 'font-size: 20px; font-weight: 700; color: #002266; margin-top: 0; margin-bottom: 8px;';
const paragraphStyle = 'font-size: 15px; color: #4A5D78; line-height: 1.6; margin-top: 0; margin-bottom: 24px;';
const sectionTitleStyle = 'font-size: 15px; font-weight: 700; color: #0066FF; margin-top: 32px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #E6F0FF; padding-bottom: 8px;';

// Change background from gradient to solid color to support automatic dark-mode inverting
const detailsCardStyle = 'background-color: #F8FAFC; border: 1px solid #D6E4FF; border-radius: 16px; padding: 24px; margin: 24px 0; box-shadow: 0 4px 15px rgba(0, 102, 255, 0.03);';
const detailsTableStyle = 'width: 100%; border-collapse: collapse;';
const detailsRowLabelStyle = 'padding: 12px 0; font-size: 14px; font-weight: 500; color: #4A5D78; text-align: left; border-bottom: 1px solid #E6F0FF; white-space: nowrap;';
// Added word-break: break-word to prevent text overflow on small screens
const detailsRowValueStyle = 'padding: 12px 0; font-size: 14px; font-weight: 700; color: #002266; text-align: right; border-bottom: 1px solid #E6F0FF; word-break: break-word;';

const badgeBase = 'display: inline-block; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;';
const badgePending = `${badgeBase} background-color: #FFFBEB; color: #D97706; border: 1px solid #FDE68A;`;
const badgeConfirmed = `${badgeBase} background-color: #ECFDF5; color: #059669; border: 1px solid #A7F3D0;`;
const badgeCompleted = `${badgeBase} background-color: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE;`;
const badgeCancelled = `${badgeBase} background-color: #FEF2F2; color: #DC2626; border: 1px solid #FCA5A5;`;

const btnStyle = `display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, ${BRAND_COLOR}, #004AD6); color: #ffffff !important; text-decoration: none; border-radius: 9999px; font-weight: 700; font-size: 14px; margin: 16px 0; text-align: center; box-shadow: 0 4px 12px rgba(0, 102, 255, 0.25); letter-spacing: 0.5px;`;

const footerStyle = 'background-color: #F8FAFC; padding: 30px; text-align: center; border-top: 1px solid #E6F0FF;';
const footerTextStyle = 'color: #7A8FA8; font-size: 12px; margin: 4px 0; line-height: 1.5;';

/**
 * Format Doctor name safely to prevent "Dr. Dr. Williams"
 */
const formatDoctorName = (name) => {
  if (!name) return '';
  const trimmed = name.trim();
  if (/^dr\.?/i.test(trimmed)) {
    return trimmed;
  }
  return `Dr. ${trimmed}`;
};

/**
 * Base HTML email wrapper
 */
const emailWrapper = (content, title, settings = {}) => {
  const clinicName = settings.clinic_name || 'Denti-Choice Dental Clinic';
  const clinicAddress = settings.clinic_address || '123 Dental Avenue, Healthcare District, New York, NY 10001';
  const clinicPhone = settings.clinic_phone || '+1 (555) 123-4567';
  const clinicEmail = settings.clinic_email || 'info@dentichoice.com';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; font-family: 'Outfit', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #F4F7FC; -webkit-font-smoothing: antialiased; }
    
    /* Mobile responsiveness queries */
    @media only screen and (max-width: 600px) {
      .container { border-radius: 0 !important; border: none !important; }
      .content-body { padding: 30px 16px !important; }
      .details-card { padding: 16px !important; margin: 16px 0 !important; }
      
      /* Stack layout for table key-values on small screens */
      .responsive-table, .responsive-table tbody, .responsive-table tr, .responsive-table td {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box;
      }
      
      .responsive-table tr {
        border-bottom: 1px solid #E6F0FF !important;
        padding: 8px 0 !important;
      }
      
      .responsive-table tr:last-child {
        border-bottom: none !important;
      }
      
      .responsive-table td {
        padding: 2px 0 !important;
        border-bottom: none !important;
        text-align: left !important;
        white-space: normal !important;
      }
      
      .responsive-table td.label-cell {
        font-size: 13px !important;
        color: #7A8FA8 !important;
      }
      
      .responsive-table td.value-cell {
        font-size: 14px !important;
        font-weight: 700 !important;
        margin-top: 2px;
        word-break: break-word !important;
      }
    }

    /* Dark Mode styling overrides */
    @media (prefers-color-scheme: dark) {
      body {
        background-color: #0F172A !important;
      }
      .container {
        background-color: #1E293B !important;
        border-color: #334155 !important;
        box-shadow: none !important;
      }
      .content-body {
        background-color: #1E293B !important;
      }
      .details-card {
        background-color: #0F172A !important;
        background: #0F172A !important;
        border-color: #334155 !important;
        box-shadow: none !important;
      }
      .responsive-table tr {
        border-bottom-color: #1E293B !important;
      }
      .responsive-table td.label-cell {
        color: #94A3B8 !important;
        border-bottom-color: #1E293B !important;
      }
      .responsive-table td.value-cell {
        color: #F8FAFC !important;
        border-bottom-color: #1E293B !important;
      }
      
      /* Checklist and location items */
      .checklist-table td {
        color: #94A3B8 !important;
      }
      .location-card {
        background-color: #0F172A !important;
        background: #0F172A !important;
        border-color: #334155 !important;
      }
      .location-card p, .location-card strong {
        color: #F8FAFC !important;
      }
      
      .footer {
        background-color: #0F172A !important;
        border-top-color: #334155 !important;
      }
      .footer p {
        color: #94A3B8 !important;
      }
      .footer-title {
        color: #F8FAFC !important;
      }
      
      /* Reply label & text details */
      .details-card .reply-label {
        color: #38BDF8 !important;
      }
      .details-card .reply-text {
        color: #F8FAFC !important;
      }
      
      /* Generic text and headers */
      h2, h3, strong {
        color: #F8FAFC !important;
      }
      p {
        color: #CBD5E1 !important;
      }
      
      /* Badges in dark mode */
      .badge-pending {
        background-color: #78350F !important;
        color: #FDE68A !important;
        border-color: #D97706 !important;
      }
      .badge-confirmed {
        background-color: #064E3B !important;
        color: #A7F3D0 !important;
        border-color: #059669 !important;
      }
      .badge-completed {
        background-color: #1E3A8A !important;
        color: #BFDBFE !important;
        border-color: #2563EB !important;
      }
      .badge-cancelled {
        background-color: #7F1D1D !important;
        color: #FCA5A5 !important;
        border-color: #DC2626 !important;
      }
    }
  </style>
</head>
<body style="${bodyStyle}">
  <div class="container" style="${containerStyle}">
    <!-- Colorful Vibrant Header Banner -->
    <div class="header" style="background: linear-gradient(135deg, ${BRAND_COLOR}, #00D2FF); padding: 40px 30px; text-align: center;">
      <div style="display: inline-block; padding: 12px; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 50%; margin-bottom: 12px;">
        <span style="font-size: 28px; line-height: 1;">🦷</span>
      </div>
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase;">${clinicName}</h1>
      <p style="color: rgba(255, 255, 255, 0.85); margin: 6px 0 0; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Your Smile, Our Priority</p>
    </div>
    <!-- Body Content -->
    <div class="content-body" style="${bodyContentStyle}">
      ${content}
    </div>
    <!-- Footer -->
    <div class="footer" style="${footerStyle}">
      <p class="footer-title" style="font-size: 14px; font-weight: 700; color: #002266; margin: 0 0 8px 0;">${clinicName}</p>
      <p style="${footerTextStyle}">${clinicAddress}</p>
      <p style="${footerTextStyle}">📞 ${clinicPhone} | ✉️ ${clinicEmail}</p>
      <p style="${footerTextStyle} margin-top: 16px; font-size: 11px; color: #A5B8CF;">© ${new Date().getFullYear()} ${clinicName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
};

const EmailService = {
  /**
   * Send email
   */
  async send(to, subject, html, settings = {}) {
    try {
      const transporter = createTransporter(settings);
      const fromName = settings.clinic_name || process.env.SMTP_FROM_NAME || 'Denti-Choice';
      const fromEmail = settings.clinic_email || process.env.SMTP_FROM_EMAIL || settings.smtp_user || process.env.SMTP_USER;
      
      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
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
    const settings = await SettingModel.getAll();
    const clinicAddress = settings.clinic_address || '123 Dental Avenue, Healthcare District, New York, NY 10001';
    const clinicPhone = settings.clinic_phone || '+1 (555) 123-4567';
    const googleMapsUrl = settings.google_maps_url || 'https://maps.google.com/?q=123+Dental+Avenue+New+York';

    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background-color: #FFF9E6; border: 1px solid #FFEBA3; color: #D97706; font-size: 24px; margin-bottom: 16px; text-align: center; vertical-align: middle;">⏳</div>
        <h2 style="font-size: 22px; font-weight: 800; color: #D97706; margin: 0 0 8px 0; letter-spacing: -0.5px;">Booking Received</h2>
        <p style="font-size: 15px; color: #4A5D78; margin: 0; line-height: 1.5;">Dear <strong>${appointment.patient_name}</strong>, your request has been logged and is pending confirmation.</p>
      </div>
      
      <div class="details-card" style="${detailsCardStyle}">
        <table class="responsive-table" style="${detailsTableStyle}">
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">📋 Appointment ID</td>
            <td class="value-cell" style="${detailsRowValueStyle}">#APT-${String(appointment.id).padStart(5, '0')}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">👨‍⚕️ Doctor</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${formatDoctorName(appointment.doctor_name)}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">🏥 Service</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${appointment.service_name}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">📅 Date</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${formatDate(appointment.appointment_date)}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">🕐 Time</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${formatTime(appointment.appointment_time)}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}; border-bottom: none;">📌 Status</td>
            <td class="value-cell" style="${detailsRowValueStyle}; border-bottom: none;"><span class="badge-pending" style="${badgePending}">Pending</span></td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 30px 0 10px 0;">
        ${googleMapsUrl ? `<a href="${googleMapsUrl}" target="_blank" style="${btnStyle}">📍 View on Google Maps</a>` : ''}
      </div>
      
      <div class="location-card" style="background-color: #F0F7FF; border: 1px solid #D6E4FF; border-left: 4px solid ${BRAND_COLOR}; border-radius: 4px 12px 12px 4px; padding: 20px; font-size: 14px; color: #4A5D78; margin-top: 25px;">
        <p style="margin: 0 0 8px 0; color: #002266;"><strong>📍 Location:</strong> ${clinicAddress}</p>
        <p style="margin: 0; color: #002266;"><strong>📞 Contact:</strong> ${clinicPhone}</p>
      </div>

      <p style="${paragraphStyle} margin-top: 25px;">We will send you another email once your slot is confirmed. Thank you! 😊</p>
    `;
    return this.send(appointment.patient_email, `Appointment Booked - ${settings.clinic_name || 'Denti-Choice'}`, emailWrapper(content, 'Appointment Booked', settings), settings);
  },

  /**
   * New appointment notification to admin
   */
  async sendAdminNotification(appointment) {
    const settings = await SettingModel.getAll();
    const content = `
      <h2 style="${greetingStyle}">🔔 New Appointment Booked</h2>
      <p style="${paragraphStyle}">A new appointment request has been submitted. Please review and manage it in the admin dashboard.</p>
      
      <div class="details-card" style="${detailsCardStyle}">
        <table class="responsive-table" style="${detailsTableStyle}">
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Patient</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${appointment.patient_name}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Email</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${appointment.patient_email}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Phone</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${appointment.patient_phone}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Doctor</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${formatDoctorName(appointment.doctor_name)}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Service</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${appointment.service_name}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Date</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${formatDate(appointment.appointment_date)}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Time</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${formatTime(appointment.appointment_time)}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}; border-bottom: none;">Message</td>
            <td class="value-cell" style="${detailsRowValueStyle}; border-bottom: none; font-style: italic;">"${appointment.message || 'None'}"</td>
          </tr>
        </table>
      </div>
    `;
    const adminEmail = settings.clinic_email || process.env.SMTP_USER || 'admin@dentichoice.com';
    return this.send(adminEmail, `New Appointment Booked - ${settings.clinic_name || 'Denti-Choice'} Admin`, emailWrapper(content, 'New Appointment', settings), settings);
  },

  /**
   * New patient notification to doctor
   */
  async sendDoctorNewPatient(appointment) {
    const settings = await SettingModel.getAll();
    const content = `
      <h2 style="${greetingStyle}">👤 New Appointment Scheduled</h2>
      <p style="${paragraphStyle}">Dear Dr. <strong>${appointment.doctor_name}</strong>,</p>
      <p style="${paragraphStyle}">A new patient appointment has been scheduled with you:</p>
      
      <div class="details-card" style="${detailsCardStyle}">
        <table class="responsive-table" style="${detailsTableStyle}">
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Appointment ID</td>
            <td class="value-cell" style="${detailsRowValueStyle}">#APT-${String(appointment.id).padStart(5, '0')}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Patient Name</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${appointment.patient_name}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Phone</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${appointment.patient_phone}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Email</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${appointment.patient_email}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Service</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${appointment.service_name}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Date</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${formatDate(appointment.appointment_date)}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Time</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${formatTime(appointment.appointment_time)}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}; border-bottom: none;">Notes</td>
            <td class="value-cell" style="${detailsRowValueStyle}; border-bottom: none; font-style: italic;">"${appointment.message || 'None'}"</td>
          </tr>
        </table>
      </div>
    `;
    return this.send(appointment.doctor_email, `New Patient Appointment - ${settings.clinic_name || 'Denti-Choice'}`, emailWrapper(content, 'New Patient', settings), settings);
  },

  /**
   * Appointment confirmed emails
   */
  async sendAppointmentConfirmed(appointment) {
    const settings = await SettingModel.getAll();
    const clinicAddress = settings.clinic_address || '123 Dental Avenue, Healthcare District, New York, NY 10001';
    const clinicPhone = settings.clinic_phone || '+1 (555) 123-4567';
    const googleMapsUrl = settings.google_maps_url || 'https://maps.google.com/?q=123+Dental+Avenue+New+York';

    // Email to patient
    const patientContent = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background-color: #ECFDF5; border: 1px solid #A7F3D0; color: #059669; font-size: 24px; margin-bottom: 16px; text-align: center; vertical-align: middle;">✓</div>
        <h2 style="font-size: 22px; font-weight: 800; color: ${BRAND_COLOR}; margin: 0 0 8px 0; letter-spacing: -0.5px;">Appointment Confirmed</h2>
        <p style="font-size: 15px; color: #4A5D78; margin: 0; line-height: 1.5;">Dear <strong>${appointment.patient_name}</strong>, great news! Your slot is officially locked in.</p>
      </div>
      
      <div class="details-card" style="${detailsCardStyle}">
        <table class="responsive-table" style="${detailsTableStyle}">
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">📋 Appointment ID</td>
            <td class="value-cell" style="${detailsRowValueStyle}">#APT-${String(appointment.id).padStart(5, '0')}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">👨‍⚕️ Doctor</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${formatDoctorName(appointment.doctor_name)}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">🏥 Service</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${appointment.service_name}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">📅 Date</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${formatDate(appointment.appointment_date)}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">🕐 Time</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${formatTime(appointment.appointment_time)}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}; border-bottom: none;">📌 Status</td>
            <td class="value-cell" style="${detailsRowValueStyle}; border-bottom: none;"><span class="badge-confirmed" style="${badgeConfirmed}">Confirmed</span></td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 30px 0 10px 0;">
        ${googleMapsUrl ? `<a href="${googleMapsUrl}" target="_blank" style="${btnStyle}">📍 View on Google Maps</a>` : ''}
      </div>

      <h3 style="${sectionTitleStyle}">📋 Before Your Visit:</h3>
      <table class="checklist-table" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="width: 24px; padding: 8px 0; font-size: 14px; color: #10B981; vertical-align: top;">✓</td>
          <td style="padding: 8px 0 8px 8px; font-size: 14px; color: #4A5D78; line-height: 1.5;">Please arrive 15 minutes before your scheduled time.</td>
        </tr>
        <tr>
          <td style="width: 24px; padding: 8px 0; font-size: 14px; color: #10B981; vertical-align: top;">✓</td>
          <td style="padding: 8px 0 8px 8px; font-size: 14px; color: #4A5D78; line-height: 1.5;">Bring your ID and insurance card (if applicable).</td>
        </tr>
        <tr>
          <td style="width: 24px; padding: 8px 0; font-size: 14px; color: #10B981; vertical-align: top;">✓</td>
          <td style="padding: 8px 0 8px 8px; font-size: 14px; color: #4A5D78; line-height: 1.5;">List any medications you are currently taking.</td>
        </tr>
        <tr>
          <td style="width: 24px; padding: 8px 0; font-size: 14px; color: #10B981; vertical-align: top;">✓</td>
          <td style="padding: 8px 0 8px 8px; font-size: 14px; color: #4A5D78; line-height: 1.5;">Avoid eating 2 hours before the appointment (for certain procedures).</td>
        </tr>
      </table>
      
      <div class="location-card" style="background-color: #F0F7FF; border: 1px solid #D6E4FF; border-left: 4px solid #0066FF; border-radius: 4px 12px 12px 4px; padding: 20px; font-size: 14px; color: #4A5D78;">
        <p style="margin: 0 0 8px 0; color: #002266;"><strong>📍 Location:</strong> ${clinicAddress}</p>
        <p style="margin: 0; color: #002266;"><strong>📞 Contact:</strong> ${clinicPhone}</p>
      </div>
    `;
    await this.send(appointment.patient_email, `Appointment Confirmed - ${settings.clinic_name || 'Denti-Choice'}`, emailWrapper(patientContent, 'Appointment Confirmed', settings), settings);

    // Email to doctor
    const doctorContent = `
      <h2 style="${greetingStyle}">📅 Appointment Confirmed</h2>
      <p style="${paragraphStyle}">Dear Dr. <strong>${appointment.doctor_name}</strong>,</p>
      <p style="${paragraphStyle}">The following appointment has been confirmed and scheduled in your calendar:</p>
      
      <div class="details-card" style="${detailsCardStyle}">
        <table class="responsive-table" style="${detailsTableStyle}">
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Appointment ID</td>
            <td class="value-cell" style="${detailsRowValueStyle}">#APT-${String(appointment.id).padStart(5, '0')}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Patient</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${appointment.patient_name}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Phone</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${appointment.patient_phone}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Email</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${appointment.patient_email}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Service</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${appointment.service_name}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Date</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${formatDate(appointment.appointment_date)}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Time</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${formatTime(appointment.appointment_time)}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}; border-bottom: none;">Notes</td>
            <td class="value-cell" style="${detailsRowValueStyle}; border-bottom: none; font-style: italic;">"${appointment.message || 'None'}"</td>
          </tr>
        </table>
      </div>
    `;
    await this.send(appointment.doctor_email, `Appointment Confirmed - ${settings.clinic_name || 'Denti-Choice'}`, emailWrapper(doctorContent, 'Appointment Confirmed', settings), settings);
  },

  /**
   * Appointment cancelled emails
   */
  async sendAppointmentCancelled(appointment) {
    const settings = await SettingModel.getAll();
    const clinicPhone = settings.clinic_phone || '+1 (555) 123-4567';

    const patientContent = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background-color: #FEF2F2; border: 1px solid #FCA5A5; color: #DC2626; font-size: 24px; margin-bottom: 16px; text-align: center; vertical-align: middle;">✕</div>
        <h2 style="font-size: 22px; font-weight: 800; color: #DC2626; margin: 0 0 8px 0; letter-spacing: -0.5px;">Appointment Cancelled</h2>
        <p style="font-size: 15px; color: #4A5D78; margin: 0; line-height: 1.5;">Dear <strong>${appointment.patient_name}</strong>, your appointment has been cancelled.</p>
      </div>
      
      <div class="details-card" style="${detailsCardStyle}">
        <table class="responsive-table" style="${detailsTableStyle}">
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Appointment ID</td>
            <td class="value-cell" style="${detailsRowValueStyle}">#APT-${String(appointment.id).padStart(5, '0')}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Doctor</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${formatDoctorName(appointment.doctor_name)}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Service</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${appointment.service_name}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Date</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${formatDate(appointment.appointment_date)}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Time</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${formatTime(appointment.appointment_time)}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}; border-bottom: none; color: #DC2626;">Reason</td>
            <td class="value-cell" style="${detailsRowValueStyle}; border-bottom: none; color: #DC2626;">"${appointment.cancellation_reason || 'No reason provided'}"</td>
          </tr>
        </table>
      </div>

      <p style="${paragraphStyle}">If you would like to reschedule, please visit our website or contact our clinic.</p>
      
      <div class="location-card" style="background-color: #FEF2F2; border: 1px solid #FCA5A5; border-left: 4px solid #DC2626; border-radius: 4px 12px 12px 4px; padding: 20px; font-size: 14px; color: #4A5D78;">
        <p style="margin: 0; color: #DC2626;"><strong>📞 Contact:</strong> ${clinicPhone}</p>
      </div>
    `;
    await this.send(appointment.patient_email, `Appointment Cancelled - ${settings.clinic_name || 'Denti-Choice'}`, emailWrapper(patientContent, 'Appointment Cancelled', settings), settings);

    const doctorContent = `
      <h2 style="${greetingStyle}; color: #DC2626;">❌ Appointment Cancelled</h2>
      <p style="${paragraphStyle}">Dear Dr. <strong>${appointment.doctor_name}</strong>,</p>
      <p style="${paragraphStyle}">The following appointment has been cancelled:</p>
      
      <div class="details-card" style="${detailsCardStyle}">
        <table class="responsive-table" style="${detailsTableStyle}">
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Patient</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${appointment.patient_name}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Date</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${formatDate(appointment.appointment_date)}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Time</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${formatTime(appointment.appointment_time)}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}; border-bottom: none; color: #DC2626;">Reason</td>
            <td class="value-cell" style="${detailsRowValueStyle}; border-bottom: none; color: #DC2626;">"${appointment.cancellation_reason || 'No reason provided'}"</td>
          </tr>
        </table>
      </div>
    `;
    await this.send(appointment.doctor_email, `Appointment Cancelled - ${settings.clinic_name || 'Denti-Choice'}`, emailWrapper(doctorContent, 'Appointment Cancelled', settings), settings);
  },

  /**
   * Appointment completed - Thank you email
   */
  async sendAppointmentCompleted(appointment) {
    const settings = await SettingModel.getAll();
    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background-color: #EFF6FF; border: 1px solid #BFDBFE; color: #0066FF; font-size: 24px; margin-bottom: 16px; text-align: center; vertical-align: middle;">🎉</div>
        <h2 style="font-size: 22px; font-weight: 800; color: #0066FF; margin: 0 0 8px 0; letter-spacing: -0.5px;">Thank You for Visiting!</h2>
        <p style="font-size: 15px; color: #4A5D78; margin: 0; line-height: 1.5;">Dear <strong>${appointment.patient_name}</strong>, thank you for choosing our clinic for your dental care.</p>
      </div>
      
      <div class="details-card" style="${detailsCardStyle}">
        <table class="responsive-table" style="${detailsTableStyle}">
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Doctor</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${formatDoctorName(appointment.doctor_name)}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Service</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${appointment.service_name}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}; border-bottom: none;">Date</td>
            <td class="value-cell" style="${detailsRowValueStyle}; border-bottom: none;">${formatDate(appointment.appointment_date)}</td>
          </tr>
        </table>
      </div>

      <p style="${paragraphStyle}">Your feedback helps us continue providing excellent services. We look forward to seeing you again for your next dental checkup!</p>
      <p style="${paragraphStyle}">Best regards,<br>The ${settings.clinic_name || 'Denti-Choice'} Team</p>
    `;
    return this.send(appointment.patient_email, `Thank You for Your Visit - ${settings.clinic_name || 'Denti-Choice'}`, emailWrapper(content, 'Thank You', settings), settings);
  },

  /**
   * Contact form reply
   */
  async sendContactReply(contact, replyMessage) {
    const settings = await SettingModel.getAll();
    const clinicPhone = settings.clinic_phone || '+1 (555) 123-4567';
    const content = `
      <h2 style="${greetingStyle}">📩 Response to Your Inquiry</h2>
      <p style="${paragraphStyle}">Dear <strong>${contact.name}</strong>,</p>
      <p style="${paragraphStyle}">Thank you for reaching out. Here is our response to your question:</p>
      
      <div class="details-card" style="${detailsCardStyle}">
        <p class="reply-label" style="font-size: 14px; font-weight: 700; color: #002266; margin: 0 0 6px 0;">Your Inquiry:</p>
        <p class="reply-text" style="font-size: 14px; color: #4A5D78; margin: 0 0 16px 0; font-style: italic; line-height: 1.5;">"${contact.message}"</p>
        
        <p class="reply-label" style="font-size: 14px; font-weight: 700; color: ${BRAND_COLOR}; margin: 0 0 6px 0; border-top: 1px solid #E6F0FF; padding-top: 16px;">Our Reply:</p>
        <p class="reply-text" style="font-size: 14px; color: #002266; margin: 0; line-height: 1.5; font-weight: 500;">${replyMessage}</p>
      </div>

      <p style="${paragraphStyle}">If you have any further questions, feel free to reply directly to this email or call us at <strong>${clinicPhone}</strong>.</p>
    `;
    return this.send(contact.email, `Re: Your Inquiry - ${settings.clinic_name || 'Denti-Choice'}`, emailWrapper(content, 'Contact Reply', settings), settings);
  },

  /**
   * Send appointment reminder to patient
   */
  async sendAppointmentReminder(appointment) {
    const settings = await SettingModel.getAll();
    const clinicAddress = settings.clinic_address || '123 Dental Avenue, Healthcare District, New York, NY 10001';
    const clinicPhone = settings.clinic_phone || '+1 (555) 123-4567';
    const googleMapsUrl = settings.google_maps_url || 'https://maps.google.com/?q=123+Dental+Avenue+New+York';
    const clinicEmail = settings.clinic_email || 'info@dentichoice.com';
    const clinicName = settings.clinic_name || 'Denti-Choice Dental Clinic';

    const isToday = require('dayjs')(appointment.appointment_date).isSame(require('dayjs')(), 'day');
    const subject = `Reminder: Your Appointment at ${clinicName} ${isToday ? 'Today' : 'Tomorrow'}`;

    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background-color: #EFF6FF; border: 1px solid #BFDBFE; color: #0066FF; font-size: 24px; margin-bottom: 16px; text-align: center; vertical-align: middle;">⏰</div>
        <h2 style="font-size: 22px; font-weight: 800; color: #0066FF; margin: 0 0 8px 0; letter-spacing: -0.5px;">Appointment Reminder</h2>
        <p style="font-size: 15px; color: #4A5D78; margin: 0; line-height: 1.5;">Dear <strong>${appointment.patient_name}</strong>, this is a friendly reminder of your upcoming slot:</p>
      </div>
      
      <div class="details-card" style="${detailsCardStyle}">
        <table class="responsive-table" style="${detailsTableStyle}">
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">📋 Appointment ID</td>
            <td class="value-cell" style="${detailsRowValueStyle}">#APT-${String(appointment.id).padStart(5, '0')}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">👨‍⚕️ Doctor</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${formatDoctorName(appointment.doctor_name)}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">🏥 Service</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${appointment.service_name}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">📅 Date</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${formatDate(appointment.appointment_date)}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">🕐 Time</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${formatTime(appointment.appointment_time)}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}; border-bottom: none;">📌 Status</td>
            <td class="value-cell" style="${detailsRowValueStyle}; border-bottom: none;"><span class="badge-confirmed" style="${badgeConfirmed}">Confirmed</span></td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 30px 0 10px 0;">
        ${googleMapsUrl ? `<a href="${googleMapsUrl}" target="_blank" style="${btnStyle}">📍 View on Google Maps</a>` : ''}
      </div>

      <h3 style="${sectionTitleStyle}">📋 Preparation Instructions:</h3>
      <table class="checklist-table" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="width: 24px; padding: 8px 0; font-size: 14px; color: #0066FF; vertical-align: top;">✓</td>
          <td style="padding: 8px 0 8px 8px; font-size: 14px; color: #4A5D78; line-height: 1.5;">Please arrive 10–15 minutes early to complete check-in.</td>
        </tr>
        <tr>
          <td style="width: 24px; padding: 8px 0; font-size: 14px; color: #0066FF; vertical-align: top;">✓</td>
          <td style="padding: 8px 0 8px 8px; font-size: 14px; color: #4A5D78; line-height: 1.5;">Bring any previous reports, X-rays, or relevant medical records.</td>
        </tr>
        <tr>
          <td style="width: 24px; padding: 8px 0; font-size: 14px; color: #0066FF; vertical-align: top;">✓</td>
          <td style="padding: 8px 0 8px 8px; font-size: 14px; color: #4A5D78; line-height: 1.5;">If you need to cancel or reschedule, please notify us 24h in advance.</td>
        </tr>
      </table>

      <div class="location-card" style="background-color: #F0F7FF; border: 1px solid #D6E4FF; border-left: 4px solid #0066FF; border-radius: 4px 12px 12px 4px; padding: 20px; font-size: 14px; color: #4A5D78;">
        <p style="margin: 0 0 8px 0; color: #002266;"><strong>📍 Location:</strong> ${clinicAddress}</p>
        <p style="margin: 0; color: #002266;"><strong>📞 Contact:</strong> ${clinicPhone} | ✉️ ${clinicEmail}</p>
      </div>
    `;
    return this.send(appointment.patient_email, subject, emailWrapper(content, 'Appointment Reminder', settings), settings);
  },

  /**
   * Send appointment reminder to doctor
   */
  async sendDoctorReminder(appointment) {
    const settings = await SettingModel.getAll();
    const clinicName = settings.clinic_name || 'Denti-Choice';
    const isToday = require('dayjs')(appointment.appointment_date).isSame(require('dayjs')(), 'day');
    const subject = `Appointment Reminder: Patient ${appointment.patient_name} - ${isToday ? 'Today' : 'Tomorrow'}`;

    const content = `
      <h2 style="${greetingStyle}">👨‍⚕️ Patient Appointment Reminder</h2>
      <p style="${paragraphStyle}">Dear Dr. <strong>${appointment.doctor_name}</strong>,</p>
      <p style="${paragraphStyle}">This is a reminder that you have an upcoming appointment scheduled with the following patient:</p>
      
      <div class="details-card" style="${detailsCardStyle}">
        <table class="responsive-table" style="${detailsTableStyle}">
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Appointment ID</td>
            <td class="value-cell" style="${detailsRowValueStyle}">#APT-${String(appointment.id).padStart(5, '0')}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Patient Name</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${appointment.patient_name}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Phone</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${appointment.patient_phone}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Email</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${appointment.patient_email}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Service</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${appointment.service_name}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}">Time</td>
            <td class="value-cell" style="${detailsRowValueStyle}">${formatTime(appointment.appointment_time)}</td>
          </tr>
          <tr>
            <td class="label-cell" style="${detailsRowLabelStyle}; border-bottom: none;">Notes</td>
            <td class="value-cell" style="${detailsRowValueStyle}; border-bottom: none; font-style: italic;">"${appointment.message || 'None'}"</td>
          </tr>
        </table>
      </div>
    `;
    return this.send(appointment.doctor_email, subject, emailWrapper(content, 'Doctor Appointment Reminder', settings), settings);
  }
};

module.exports = EmailService;
