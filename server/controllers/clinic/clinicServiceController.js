const ClinicServiceModel = require('../../models/clinic/clinicServiceModel');
const { success, created, error } = require('../../utils/apiResponse');
const SocketService = require('../../services/socketService');

const ClinicServiceController = {
  async getAll(req, res, next) {
    try {
      const clinicId = req.clinicId || 1;
      const { search, is_active } = { ...req.query, ...req.body };
      const filters = { search };
      if (is_active !== undefined) filters.is_active = parseInt(is_active);

      const services = await ClinicServiceModel.findAll(clinicId, filters);
      return success(res, services);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const clinicId = req.clinicId || 1;
      const id = req.body.id || req.params.id;
      const service = await ClinicServiceModel.findById(clinicId, id);
      if (!service) return error(res, 'Service not found.', 404);
      return success(res, service);
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const clinicId = req.clinicId || 1;
      const data = req.body;
      if (req.file) data.image = `/uploads/${req.file.filename}`;

      const id = await ClinicServiceModel.create(clinicId, data);
      const service = await ClinicServiceModel.findById(clinicId, id);
      SocketService.emitServicesUpdated();
      return created(res, service, 'Treatment service created successfully');
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const clinicId = req.clinicId || 1;
      const id = req.body.id || req.params.id;
      const service = await ClinicServiceModel.findById(clinicId, id);
      if (!service) return error(res, 'Service not found.', 404);

      const data = req.body;
      if (req.file) {
        data.image = `/uploads/${req.file.filename}`;
      } else if (data.remove_image === 'true' || data.remove_image === true) {
        data.image = null;
      }

      await ClinicServiceModel.update(clinicId, id, data);
      const updated = await ClinicServiceModel.findById(clinicId, id);
      SocketService.emitServicesUpdated();
      return success(res, updated, 'Treatment service updated successfully');
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      const clinicId = req.clinicId || 1;
      const id = req.body.id || req.params.id;
      const deleted = await ClinicServiceModel.delete(clinicId, id);
      if (!deleted) return error(res, 'Service not found.', 404);
      SocketService.emitServicesUpdated();
      return success(res, null, 'Treatment service deleted successfully');
    } catch (err) { next(err); }
  }
};

module.exports = ClinicServiceController;
