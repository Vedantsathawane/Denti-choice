const { body } = require('express-validator');

exports.loginValidator = [
  body('email').isEmail().withMessage('Please enter a valid email address.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.')
];

exports.profileValidator = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
  body('email').optional().isEmail().withMessage('Please enter a valid email.').normalizeEmail()
];

exports.passwordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters.')
];

exports.doctorValidator = [
  body('name').trim().notEmpty().withMessage('Doctor name is required.'),
  body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('phone').trim().notEmpty().withMessage('Phone number is required.'),
  body('qualification').trim().notEmpty().withMessage('Qualification is required.'),
  body('experience').isInt({ min: 0 }).withMessage('Experience must be a positive number.'),
  body('specialization').trim().notEmpty().withMessage('Specialization is required.')
];

exports.serviceValidator = [
  body('name').trim().notEmpty().withMessage('Service name is required.'),
  body('description').trim().notEmpty().withMessage('Description is required.'),
  body('duration').trim().notEmpty().withMessage('Duration is required.'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number.')
];

exports.appointmentValidator = [
  body('full_name').trim().notEmpty().withMessage('Full name is required.'),
  body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('phone').trim().notEmpty().withMessage('Phone number is required.'),
  body('doctor_id').isInt({ min: 1 }).withMessage('Please select a doctor.'),
  body('service_id').isInt({ min: 1 }).withMessage('Please select a service.'),
  body('appointment_date').isDate().withMessage('Valid appointment date is required.'),
  body('appointment_time').matches(/^\d{2}:\d{2}:\d{2}$/).withMessage('Valid appointment time is required (HH:MM:SS).')
];

exports.testimonialValidator = [
  body('patient_name').trim().notEmpty().withMessage('Patient name is required.'),
  body('review').trim().notEmpty().withMessage('Review is required.'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5.')
];

exports.contactValidator = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('message').trim().notEmpty().withMessage('Message is required.')
];

exports.statusValidator = [
  body('status').isIn(['pending', 'confirmed', 'completed', 'cancelled']).withMessage('Invalid status.')
];

exports.replyValidator = [
  body('reply').trim().notEmpty().withMessage('Reply message is required.')
];
