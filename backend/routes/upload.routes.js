const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadImage } = require('../services/cloudinary.service');

// Use memory storage for Vercel serverless compatibility
// Files are stored in buffer, then uploaded to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
});

/**
 * POST /api/upload
 * Upload image to Cloudinary (Vercel serverless compatible)
 */
router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Upload to Cloudinary using file buffer
        const cloudinaryUrl = await uploadImage(req.file.buffer, {
            folder: 'products',
            filename: `product_${Date.now()}`
        });

        res.json({
            message: 'File uploaded successfully to Cloudinary',
            url: cloudinaryUrl,
            filename: req.file.originalname
        });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ 
            error: 'Server error during upload', 
            details: error.message 
        });
    }
});

module.exports = router;

