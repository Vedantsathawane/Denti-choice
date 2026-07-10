const ServiceModel = require('../models/serviceModel');
const { success, created, error, paginated } = require('../utils/apiResponse');
const SocketService = require('../services/socketService');

const ServiceController = {
  async getAll(req, res, next) {
    try {
      const { search, is_active, page = 1, limit } = { ...req.query, ...req.body };
      const filters = { search, page: parseInt(page) };
      if (is_active !== undefined) filters.is_active = parseInt(is_active);
      if (limit) filters.limit = parseInt(limit);

      const services = await ServiceModel.findAll(filters);

      if (limit) {
        const total = await ServiceModel.count(filters);
        return paginated(res, services, total, page, limit);
      }
      return success(res, services);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const id = req.body.id || req.params.id;
      const service = await ServiceModel.findById(id);
      if (!service) return error(res, 'Service not found.', 404);
      return success(res, service);
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const data = req.body;
      if (req.file) data.image = `/uploads/${req.file.filename}`;
      const id = await ServiceModel.create(data);
      const service = await ServiceModel.findById(id);
      SocketService.emitServicesUpdated();
      return created(res, service, 'Service created successfully');
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const id = req.body.id || req.params.id;
      const service = await ServiceModel.findById(id);
      if (!service) return error(res, 'Service not found.', 404);
      const data = req.body;
      if (req.file) data.image = `/uploads/${req.file.filename}`;
      await ServiceModel.update(id, data);
      const updated = await ServiceModel.findById(id);
      SocketService.emitServicesUpdated();
      return success(res, updated, 'Service updated successfully');
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      const id = req.body.id || req.params.id;
      const deleted = await ServiceModel.delete(id);
      if (!deleted) return error(res, 'Service not found.', 404);
      SocketService.emitServicesUpdated();
      return success(res, null, 'Service deleted successfully');
    } catch (err) { next(err); }
  },
};

module.exports = ServiceController;
