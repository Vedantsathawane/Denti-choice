const { pool } = require('../../config/db');
const ClinicSettingModel = require('../../models/clinic/clinicSettingModel');
const { success, error } = require('../../utils/apiResponse');

const PublicClinicController = {
  /**
   * Fetch public site data for a specific clinic resolved by subdomain or custom domain
   */
  async getPublicSiteData(req, res, next) {
    try {
      const identifier = req.params.identifier || req.query.subdomain || req.headers['x-clinic-subdomain'];
      const hostname = req.hostname;

      if (!identifier && (!hostname || hostname === 'localhost')) {
        return error(res, 'Clinic subdomain or custom domain identifier is required.', 400);
      }

      let clinic = null;

      // 1. Resolve clinic by custom domain or subdomain
      if (identifier) {
        const [rows] = await pool.query(
          'SELECT id, name, subdomain, custom_domain, logo_url, branding_color FROM clinics WHERE (subdomain = ? OR custom_domain = ?) AND is_active = 1',
          [identifier, identifier]
        );
        if (rows.length > 0) clinic = rows[0];
      }

      if (!clinic && hostname && hostname !== 'localhost') {
        const [rows] = await pool.query(
          'SELECT id, name, subdomain, custom_domain, logo_url, branding_color FROM clinics WHERE custom_domain = ? AND is_active = 1',
          [hostname]
        );
        if (rows.length > 0) {
          clinic = rows[0];
        } else {
          // Parse subdomain from host split (e.g. clinic1.dentist-choice.com)
          const parts = hostname.split('.');
          if (parts.length > 2) {
            const parsedSub = parts[0];
            const [subRows] = await pool.query(
              'SELECT id, name, subdomain, custom_domain, logo_url, branding_color FROM clinics WHERE subdomain = ? AND is_active = 1',
              [parsedSub]
            );
            if (subRows.length > 0) clinic = subRows[0];
          }
        }
      }

      // If still unresolved, default to clinic ID = 1
      if (!clinic) {
        const [rows] = await pool.query(
          'SELECT id, name, subdomain, custom_domain, logo_url, branding_color FROM clinics WHERE id = 1 AND is_active = 1'
        );
        if (rows.length > 0) clinic = rows[0];
      }

      if (!clinic) {
        return error(res, 'Clinic space not found.', 404);
      }

      const clinicId = clinic.id;

      // 2. Fetch clinic-specific settings
      const settings = await ClinicSettingModel.getSettings(clinicId);

      // 3. Fetch active doctors
      const [doctors] = await pool.query(
        'SELECT id, name, email, phone, qualification, experience, specialization, availability, image, bio, social_links FROM doctors WHERE clinic_id = ? AND is_active = 1',
        [clinicId]
      );

      // 4. Fetch active services
      const [services] = await pool.query(
        'SELECT id, name, description, icon, image, duration, price FROM services WHERE clinic_id = ? AND is_active = 1 ORDER BY sort_order ASC',
        [clinicId]
      );

      // 5. Fetch visible testimonials
      const [testimonials] = await pool.query(
        'SELECT id, patient_name, patient_photo, review, rating FROM testimonials WHERE clinic_id = ? AND is_visible = 1 ORDER BY id DESC',
        [clinicId]
      );

      // Parse JSON columns safely
      const parsedDoctors = doctors.map(doc => {
        try {
          doc.availability = typeof doc.availability === 'string' ? JSON.parse(doc.availability) : doc.availability;
          doc.social_links = typeof doc.social_links === 'string' ? JSON.parse(doc.social_links) : doc.social_links;
        } catch (e) {
          doc.availability = [];
          doc.social_links = {};
        }
        return doc;
      });

      return success(res, {
        clinic,
        settings,
        doctors: parsedDoctors,
        services,
        testimonials
      }, 'Public site data resolved successfully');
    } catch (err) {
      next(err);
    }
  }
};

module.exports = PublicClinicController;
