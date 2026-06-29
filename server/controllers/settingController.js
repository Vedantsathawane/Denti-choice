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
      return success(res, settings, 'Settings updated successfully');
    } catch (err) { next(err); }
  }
};

module.exports = SettingController;
