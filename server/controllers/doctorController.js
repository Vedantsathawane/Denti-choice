const DoctorModel = require('../models/doctorModel');
const { success, created, error, paginated } = require('../utils/apiResponse');
const SocketService = require('../services/socketService');

const DoctorController = {
  async getAll(req, res, next) {
    try {
      const { search, specialization, is_active, page = 1, limit } = { ...req.query, ...req.body };
      const filters = { search, specialization, page: parseInt(page) };
      if (is_active !== undefined) filters.is_active = parseInt(is_active);
      if (limit) filters.limit = parseInt(limit);

      const doctors = await DoctorModel.findAll(filters);

      if (limit) {
        const total = await DoctorModel.count(filters);
        return paginated(res, doctors, total, page, limit);
      }

      return success(res, doctors);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const id = req.body.id || req.params.id;
      const doctor = await DoctorModel.findById(id);
      if (!doctor) return error(res, 'Doctor not found.', 404);
      return success(res, doctor);
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const data = req.body;
      if (req.file) data.image = `/uploads/${req.file.filename}`;
      if (typeof data.availability === 'string') data.availability = JSON.parse(data.availability);
      if (typeof data.social_links === 'string') data.social_links = JSON.parse(data.social_links);

      const id = await DoctorModel.create(data);
      const doctor = await DoctorModel.findById(id);
      SocketService.emitDoctorsUpdated();
      return created(res, doctor, 'Doctor created successfully');
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const id = req.body.id || req.params.id;
      const doctor = await DoctorModel.findById(id);
      if (!doctor) return error(res, 'Doctor not found.', 404);

      const data = req.body;
      if (req.file) {
        data.image = `/uploads/${req.file.filename}`;
      } else if (data.remove_image === 'true' || data.remove_image === true) {
        data.image = null;
      }
      
      if (typeof data.availability === 'string') data.availability = JSON.parse(data.availability);
      if (typeof data.social_links === 'string') data.social_links = JSON.parse(data.social_links);

      await DoctorModel.update(id, data);
      const updated = await DoctorModel.findById(id);
      SocketService.emitDoctorsUpdated();
      return success(res, updated, 'Doctor updated successfully');
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      const id = req.body.id || req.params.id;
      const deleted = await DoctorModel.delete(id);
      if (!deleted) return error(res, 'Doctor not found.', 404);
      SocketService.emitDoctorsUpdated();
      return success(res, null, 'Doctor deleted successfully');
    } catch (err) { next(err); }
  },
};

module.exports = DoctorController;
