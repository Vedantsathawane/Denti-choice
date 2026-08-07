const router = require('express').Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const { tenantMiddleware } = require('../../middlewares/tenantMiddleware');
const upload = require('../../middlewares/uploadMiddleware');
const { pool } = require('../../config/db');
const fs = require('fs');
const path = require('path');

const { tenantIsolationGuard } = require('../../middlewares/tenantSecurity');
router.use(authMiddleware, tenantMiddleware, tenantIsolationGuard);

/**
 * Upload single image to dynamic clinic storage path
 */
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    const clinicId = req.clinicId || 1;
    const file = req.file;
    const { category } = req.body;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Relative web URL
    const relativePath = `/uploads/clinic_${clinicId}/${file.filename}`;

    const [result] = await pool.query(
      `INSERT INTO tenant_media (clinic_id, filename, file_path, file_size, mime_type, category) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [clinicId, file.filename, relativePath, file.size, file.mimetype, category || 'general']
    );

    return res.status(200).json({
      success: true,
      message: 'File uploaded and logged successfully',
      data: {
        id: result.insertId,
        filename: file.filename,
        filePath: relativePath,
        category: category || 'general'
      }
    });

  } catch (err) { next(err); }
});

/**
 * List all uploaded media files for current clinic
 */
router.get('/', async (req, res, next) => {
  try {
    const clinicId = req.clinicId || 1;
    const [rows] = await pool.query(
      'SELECT * FROM tenant_media WHERE clinic_id = ? ORDER BY id DESC',
      [clinicId]
    );

    return res.status(200).json({
      success: true,
      data: rows
    });
  } catch (err) { next(err); }
});

/**
 * Delete a media file and remove it from physical disk
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const clinicId = req.clinicId || 1;

    // Fetch details to ensure ownership
    const [rows] = await pool.query(
      'SELECT * FROM tenant_media WHERE id = ? AND clinic_id = ?',
      [id, clinicId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Media asset not found or access forbidden' });
    }

    const fileMeta = rows[0];

    // Remove from DB
    await pool.query('DELETE FROM tenant_media WHERE id = ?', [id]);

    // Remove from physical disk
    const diskPath = path.join(__dirname, '..', '..', fileMeta.file_path);
    if (fs.existsSync(diskPath)) {
      fs.unlinkSync(diskPath);
    }

    return res.status(200).json({
      success: true,
      message: 'Media deleted successfully'
    });

  } catch (err) { next(err); }
});

module.exports = router;
