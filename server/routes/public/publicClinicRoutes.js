const router = require('express').Router();
const PublicClinicController = require('../../controllers/public/publicClinicController');

router.get('/:identifier', PublicClinicController.getPublicSiteData);
router.get('/', PublicClinicController.getPublicSiteData);

module.exports = router;
