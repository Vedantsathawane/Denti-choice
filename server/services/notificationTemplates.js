/**
 * SaaS Notification Templates Registry
 */
const NotificationTemplates = {
  /**
   * Get Email HTML & Subject templates
   */
  getEmailTemplate(type, data) {
    let subject = '';
    let html = '';

    switch (type) {
      case 'created':
        subject = `Booking Received - ${data.clinic_name || 'Denti-Choice'}`;
        html = `
          <div style="font-family: Arial, sans-serif; padding: 25px; color: #002266; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color: #D97706; margin-top: 0;">Booking Received</h2>
            <p>Hello <strong>${data.patient_name}</strong>,</p>
            <p>Your appointment request has been successfully received and is currently <strong>pending confirmation</strong>. We will review it shortly and send you another email once your slot is confirmed.</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 12px; margin: 15px 0;">
              <strong>Clinic:</strong> ${data.clinic_name || 'Denti-Choice Clinic'}<br/>
              <strong>Doctor:</strong> Dr. ${data.doctor_name}<br/>
              <strong>Service:</strong> ${data.service_name}<br/>
              <strong>Date:</strong> ${data.appointment_date}<br/>
              <strong>Time:</strong> ${data.appointment_time}<br/>
              <strong>Location:</strong> ${data.clinic_address || 'Clinic Address'}
            </div>
            <p>Thank you for choosing us!</p>
          </div>
        `;
        break;

      case 'confirmed':
        subject = `Appointment Confirmed - ${data.clinic_name || 'Denti-Choice'}`;
        html = `
          <div style="font-family: Arial, sans-serif; padding: 25px; color: #002266; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color: #0066FF; margin-top: 0;">Appointment Confirmed!</h2>
            <p>Hello <strong>${data.patient_name}</strong>,</p>
            <p>Your appointment has been successfully scheduled and confirmed with the following details:</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 12px; margin: 15px 0;">
              <strong>Clinic:</strong> ${data.clinic_name || 'Denti-Choice Clinic'}<br/>
              <strong>Doctor:</strong> Dr. ${data.doctor_name}<br/>
              <strong>Service:</strong> ${data.service_name}<br/>
              <strong>Date:</strong> ${data.appointment_date}<br/>
              <strong>Time:</strong> ${data.appointment_time}<br/>
              <strong>Location:</strong> ${data.clinic_address || 'Clinic Address'}
            </div>
            <p>Thank you for choosing us!</p>
          </div>
        `;
        break;

      case 'rescheduled':
        subject = `Appointment Rescheduled - ${data.clinic_name || 'Denti-Choice'}`;
        html = `
          <div style="font-family: Arial, sans-serif; padding: 25px; color: #002266; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color: #4f46e5; margin-top: 0;">Appointment Rescheduled</h2>
            <p>Hello <strong>${data.patient_name}</strong>,</p>
            <p>Your appointment has been successfully updated to a new time slot:</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 12px; margin: 15px 0;">
              <strong>New Date:</strong> ${data.appointment_date}<br/>
              <strong>New Time:</strong> ${data.appointment_time}<br/>
              <strong>Doctor:</strong> Dr. ${data.doctor_name}
            </div>
            <p>We look forward to seeing you then!</p>
          </div>
        `;
        break;

      case 'cancelled':
        subject = `Appointment Cancelled - ${data.clinic_name || 'Denti-Choice'}`;
        html = `
          <div style="font-family: Arial, sans-serif; padding: 25px; color: #002266; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color: #ef4444; margin-top: 0;">Appointment Cancelled</h2>
            <p>Hello <strong>${data.patient_name}</strong>,</p>
            <p>Your appointment on <strong>${data.appointment_date}</strong> has been cancelled.</p>
            ${data.cancellation_reason ? `<p><strong>Reason for cancellation:</strong> ${data.cancellation_reason}</p>` : ''}
            <p>If you'd like to schedule another visit, please feel free to book online or call us.</p>
          </div>
        `;
        break;

      case 'completed':
        subject = `Thank you for your visit - ${data.clinic_name || 'Denti-Choice'}`;
        html = `
          <div style="font-family: Arial, sans-serif; padding: 25px; color: #002266; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color: #10b981; margin-top: 0;">Thank You!</h2>
            <p>Hello <strong>${data.patient_name}</strong>,</p>
            <p>Thank you for choosing us for your dental care. Your appointment with Dr. <strong>${data.doctor_name}</strong> is now complete.</p>
            <p>Please share your feedback to help us serve you better:</p>
            <p style="text-align: center; margin: 25px 0;">
              <a href="${data.review_link || '#'}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 99px; font-weight: bold; font-size: 14px;">Leave a Review</a>
            </p>
          </div>
        `;
        break;

      case 'payment':
        subject = `Payment Successful Receipt - ${data.clinic_name || 'Denti-Choice'}`;
        html = `
          <div style="font-family: Arial, sans-serif; padding: 25px; color: #002266; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color: #10b981; margin-top: 0;">Payment Received</h2>
            <p>Hello <strong>${data.patient_name}</strong>,</p>
            <p>Your transaction has been processed successfully. Details of your invoice are below:</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 12px; margin: 15px 0;">
              <strong>Invoice Number:</strong> ${data.invoice_number}<br/>
              <strong>Amount Paid:</strong> $${parseFloat(data.amount).toFixed(2)}<br/>
              <strong>GST Tax Included:</strong> $${parseFloat(data.gst_amount).toFixed(2)}<br/>
              <strong>Transaction ID:</strong> ${data.transaction_id || 'N/A'}<br/>
              <strong>Date:</strong> ${new Date().toLocaleDateString()}
            </div>
            <p>A copy of your printable invoice has been linked to your account.</p>
          </div>
        `;
        break;

      case 'reminder':
        subject = `Upcoming Appointment Reminder - ${data.clinic_name || 'Denti-Choice'}`;
        html = `
          <div style="font-family: Arial, sans-serif; padding: 25px; color: #002266; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color: #0066FF; margin-top: 0;">Upcoming Appointment Reminder</h2>
            <p>Hello <strong>${data.patient_name}</strong>,</p>
            <p>This is an automated reminder that you have an appointment scheduled with <strong>Dr. ${data.doctor_name}</strong> tomorrow at <strong>${data.appointment_time}</strong>.</p>
            <p>We look forward to seeing you soon!</p>
          </div>
        `;
        break;
    }

    return { subject, html };
  },

  /**
   * Get WhatsApp template body params matching Meta Cloud API
   */
  getWhatsAppParams(type, data) {
    let templateName = '';
    let parameters = [];

    switch (type) {
      case 'created':
      case 'confirmed':
        templateName = 'appointment_confirmation';
        parameters = [
          { type: 'text', text: data.patient_name },
          { type: 'text', text: data.clinic_name || 'Denti-Choice Clinic' },
          { type: 'text', text: data.doctor_name },
          { type: 'text', text: data.service_name },
          { type: 'text', text: data.appointment_date },
          { type: 'text', text: data.appointment_time },
          { type: 'text', text: data.clinic_address || 'Clinic Address' }
        ];
        break;

      case 'rescheduled':
        templateName = 'appointment_rescheduled';
        parameters = [
          { type: 'text', text: data.patient_name },
          { type: 'text', text: data.appointment_date },
          { type: 'text', text: data.appointment_time }
        ];
        break;

      case 'cancelled':
        templateName = 'appointment_cancelled';
        parameters = [
          { type: 'text', text: data.patient_name }
        ];
        break;

      case 'completed':
        templateName = 'review_request';
        parameters = [
          { type: 'text', text: data.patient_name },
          { type: 'text', text: data.doctor_name },
          { type: 'text', text: data.review_link || 'http://dentist-choice.com/review' }
        ];
        break;

      case 'payment':
        templateName = 'payment_receipt';
        parameters = [
          { type: 'text', text: data.invoice_number },
          { type: 'text', text: `$${parseFloat(data.amount).toFixed(2)}` },
          { type: 'text', text: `$${parseFloat(data.gst_amount).toFixed(2)}` },
          { type: 'text', text: data.transaction_id || 'N/A' }
        ];
        break;

      case 'reminder':
        templateName = 'appointment_reminder';
        parameters = [
          { type: 'text', text: data.patient_name },
          { type: 'text', text: data.doctor_name },
          { type: 'text', text: data.appointment_time }
        ];
        break;
    }

    return { templateName, parameters };
  }
};

module.exports = NotificationTemplates;
