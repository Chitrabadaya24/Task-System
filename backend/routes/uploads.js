const express = require('express');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

router.use(protect);

// POST /api/uploads  (multipart field: files)
router.post('/', (req, res) => {
  upload.array('files', 5)(req, res, (err) => {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'File too large (max 10MB)'
        : err.message || 'Upload failed';
      return res.status(400).json({ message, code: 'UPLOAD_ERROR' });
    }

    if (!req.files?.length) {
      return res.status(400).json({ message: 'No files uploaded', code: 'UPLOAD_ERROR' });
    }

    const files = req.files.map(f => ({
      originalName: f.originalname,
      filename: f.filename,
      mimeType: f.mimetype,
      size: f.size,
      url: `/uploads/${f.filename}`,
    }));

    res.status(201).json({ files });
  });
});

module.exports = router;
