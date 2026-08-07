const SettingModel = require('../models/settingModel');
const { success, error } = require('../utils/apiResponse');

const SettingController = {
  async getAll(req, res, next) {
    try {
      const settings = await SettingModel.getAll();
      return success(res, settings);
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      await SettingModel.updateBulk(req.body);
      const settings = await SettingModel.getAll();
      
      const AuditLogger = require('../services/auditLogger');
      const clinicId = req.user?.clinic_id || req.clinicId || 1;
      await AuditLogger.log({
        clinicId,
        userId: req.user?.id || null,
        actionType: 'SETTINGS_UPDATE',
        description: `Clinic updated settings: ${JSON.stringify(req.body).substring(0, 500)}`,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Unknown'
      });

      return success(res, settings, 'Settings updated successfully');
    } catch (err) { next(err); }
  }
};

module.exports = SettingController;
