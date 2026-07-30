const ClinicPatientModel = require('../../models/clinic/clinicPatientModel');
const { success, created, error, paginated } = require('../../utils/apiResponse');

const ClinicPatientController = {
  async getAll(req, res, next) {
    try {
      const clinicId = req.clinicId || 1;
      const { search, page = 1, limit } = { ...req.query, ...req.body };
      const filters = { search, page: parseInt(page) };
      if (limit) filters.limit = parseInt(limit);

      const patients = await ClinicPatientModel.findAll(clinicId, filters);

      if (limit) {
        const total = await ClinicPatientModel.count(clinicId, filters);
        return paginated(res, patients, total, page, limit);
      }

      return success(res, patients);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const clinicId = req.clinicId || 1;
      const id = req.body.id || req.params.id;
      const patient = await ClinicPatientModel.findById(clinicId, id);
      if (!patient) return error(res, 'Patient not found.', 404);
      return success(res, patient);
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const clinicId = req.clinicId || 1;
      const data = req.body;

      // Check if patient email or phone already exists in this clinic
      const existing = await ClinicPatientModel.findByEmailOrPhone(clinicId, data.email, data.phone);
      if (existing) {
        return success(res, existing, 'Existing patient record resolved');
      }

      const id = await ClinicPatientModel.create(clinicId, data);
      const patient = await ClinicPatientModel.findById(clinicId, id);
      return created(res, patient, 'Patient registered successfully');
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const clinicId = req.clinicId || 1;
      const id = req.body.id || req.params.id;
      const patient = await ClinicPatientModel.findById(clinicId, id);
      if (!patient) return error(res, 'Patient not found.', 404);

      await ClinicPatientModel.update(clinicId, id, req.body);
      const updated = await ClinicPatientModel.findById(clinicId, id);
      return success(res, updated, 'Patient details updated successfully');
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      const clinicId = req.clinicId || 1;
      const id = req.body.id || req.params.id;
      const deleted = await ClinicPatientModel.delete(clinicId, id);
      if (!deleted) return error(res, 'Patient not found.', 404);
      return success(res, null, 'Patient record deleted successfully');
    } catch (err) { next(err); }
  }
};

module.exports = ClinicPatientController;
