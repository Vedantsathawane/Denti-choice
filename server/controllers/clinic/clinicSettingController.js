const ClinicSettingModel = require('../../models/clinic/clinicSettingModel');
const { success, error } = require('../../utils/apiResponse');

const ClinicSettingController = {
  async getSettings(req, res, next) {
    try {
      const clinicId = req.clinicId || 1;
      const settings = await ClinicSettingModel.getSettings(clinicId);
      return success(res, settings);
    } catch (err) { next(err); }
  },

  async updateSettings(req, res, next) {
    try {
      const clinicId = req.clinicId || 1;
      const settings = req.body;
      if (!settings || typeof settings !== 'object') {
        return error(res, 'Invalid settings payload.', 400);
      }

      await ClinicSettingModel.updateSettings(clinicId, settings);
      const updated = await ClinicSettingModel.getSettings(clinicId);
      return success(res, updated, 'Settings updated successfully');
    } catch (err) { next(err); }
  }
};

module.exports = ClinicSettingController;
