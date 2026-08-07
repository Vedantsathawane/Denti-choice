const jwt = require('jsonwebtoken');
const AdminModel = require('../models/adminModel');
const { success, error } = require('../utils/apiResponse');

const AuthController = {
  /**
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password, remember } = req.body;

      const admin = await AdminModel.findByEmail(email);
      if (!admin) {
        return error(res, 'Invalid email or password.', 401);
      }

      if (!admin.is_active) {
        return error(res, 'Your account has been deactivated.', 403);
      }

      const isMatch = await AdminModel.comparePassword(password, admin.password);
      if (!isMatch) {
        return error(res, 'Invalid email or password.', 401);
      }

      // Generate JWT
      const expiresIn = remember ? '30d' : (process.env.JWT_EXPIRES_IN || '7d');
      const token = jwt.sign(
        { id: admin.id, clinic_id: admin.clinic_id, email: admin.email, role: admin.role },
        process.env.JWT_SECRET,
        { expiresIn }
      );

      // Update last login
      await AdminModel.updateLastLogin(admin.id);

      // Set cookie
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: remember ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
      };
      res.cookie('token', token, cookieOptions);

      const AuditLogger = require('../services/auditLogger');
      await AuditLogger.log({
        clinicId: admin.clinic_id,
        userId: admin.id,
        actionType: 'LOGIN',
        description: `User "${admin.name}" (${admin.email}) logged in successfully.`,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Unknown'
      });

      return success(res, {
        token,
        user: {
          id: admin.id,
          clinic_id: admin.clinic_id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          avatar: admin.avatar
        }
      }, 'Login successful');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/logout
   */
  async logout(req, res) {
    const AuditLogger = require('../services/auditLogger');
    if (req.user) {
      await AuditLogger.log({
        clinicId: req.user.clinic_id,
        userId: req.user.id,
        actionType: 'LOGOUT',
        description: `User with ID ${req.user.id} logged out.`,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Unknown'
      });
    }
    res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
    return success(res, null, 'Logged out successfully');
  },

  /**
   * GET /api/auth/me
   */
  async getMe(req, res, next) {
    try {
      const admin = await AdminModel.findById(req.user.id);
      if (!admin) {
        return error(res, 'User not found.', 404);
      }
      return success(res, admin);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/auth/profile
   */
  async updateProfile(req, res, next) {
    try {
      const { name, email } = req.body;
      let avatar = req.user.avatar;

      if (req.file) {
        avatar = `/uploads/${req.file.filename}`;
      }

      await AdminModel.updateProfile(req.user.id, { name, email, avatar });
      const updatedAdmin = await AdminModel.findById(req.user.id);
      
      const AuditLogger = require('../services/auditLogger');
      await AuditLogger.log({
        clinicId: req.user.clinic_id,
        userId: req.user.id,
        actionType: 'PROFILE_UPDATE',
        description: `User updated profile information: Name = ${name}, Email = ${email}`,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Unknown'
      });

      return success(res, updatedAdmin, 'Profile updated successfully');
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/auth/password
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      const admin = await AdminModel.findByEmail(req.user.email);
      const isMatch = await AdminModel.comparePassword(currentPassword, admin.password);
      if (!isMatch) {
        return error(res, 'Current password is incorrect.', 400);
      }

      await AdminModel.updatePassword(req.user.id, newPassword);
      
      const AuditLogger = require('../services/auditLogger');
      await AuditLogger.log({
        clinicId: req.user.clinic_id,
        userId: req.user.id,
        actionType: 'PASSWORD_CHANGE',
        description: `User changed account password successfully.`,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Unknown'
      });

      return success(res, null, 'Password changed successfully');
    } catch (err) {
      next(err);
    }
  }
};

module.exports = AuthController;
