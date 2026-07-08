const TestimonialModel = require('../models/testimonialModel');
const { success, created, error, paginated } = require('../utils/apiResponse');

const TestimonialController = {
  async getAll(req, res, next) {
    try {
      const { is_visible, page = 1, limit } = { ...req.query, ...req.body };
      const filters = { page: parseInt(page) };
      if (is_visible !== undefined) filters.is_visible = parseInt(is_visible);
      if (limit) filters.limit = parseInt(limit);
      const testimonials = await TestimonialModel.findAll(filters);
      if (limit) {
        const total = await TestimonialModel.count(filters);
        return paginated(res, testimonials, total, page, limit);
      }
      return success(res, testimonials);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const id = req.body.id || req.params.id;
      const testimonial = await TestimonialModel.findById(id);
      if (!testimonial) return error(res, 'Testimonial not found.', 404);
      return success(res, testimonial);
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const data = req.body;
      if (req.file) data.patient_photo = `/uploads/${req.file.filename}`;
      const id = await TestimonialModel.create(data);
      const testimonial = await TestimonialModel.findById(id);
      return created(res, testimonial, 'Testimonial created successfully');
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const id = req.body.id || req.params.id;
      const existing = await TestimonialModel.findById(id);
      if (!existing) return error(res, 'Testimonial not found.', 404);
      const data = req.body;
      if (req.file) data.patient_photo = `/uploads/${req.file.filename}`;
      await TestimonialModel.update(id, data);
      const updated = await TestimonialModel.findById(id);
      return success(res, updated, 'Testimonial updated successfully');
    } catch (err) { next(err); }
  },

  async toggleVisibility(req, res, next) {
    try {
      const id = req.body.id || req.params.id;
      await TestimonialModel.toggleVisibility(id);
      const updated = await TestimonialModel.findById(id);
      return success(res, updated, 'Visibility toggled successfully');
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      const id = req.body.id || req.params.id;
      const deleted = await TestimonialModel.delete(id);
      if (!deleted) return error(res, 'Testimonial not found.', 404);
      return success(res, null, 'Testimonial deleted successfully');
    } catch (err) { next(err); }
  }
};

module.exports = TestimonialController;
