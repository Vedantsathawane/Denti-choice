const PatientModel = require('../models/patientModel');
const { success, error, paginated } = require('../utils/apiResponse');

const PatientController = {
  async getAll(req, res, next) {
    try {
      const { search, page = 1, limit = 10 } = req.query;
      const filters = { search, page: parseInt(page), limit: parseInt(limit) };
      const [patients, total] = await Promise.all([
        PatientModel.findAll(filters),
        PatientModel.count(filters)
      ]);
      return paginated(res, patients, total, page, limit);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const patient = await PatientModel.findById(req.params.id);
      if (!patient) return error(res, 'Patient not found.', 404);
      return success(res, patient);
    } catch (err) { next(err); }
  }
};

module.exports = PatientController;
