/**
 * Cloudinary Image Upload Service
 * 
 * Service untuk upload images ke Cloudinary cloud storage
 * Compatible dengan Vercel serverless (no local filesystem)
 */

const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary with credentials from .env
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload image to Cloudinary from buffer (memory)
 * 
 * @param {Buffer} fileBuffer - File buffer from multer memoryStorage
 * @param {Object} options - Upload options
 * @param {string} options.folder - Cloudinary folder name (default: 'products')
 * @param {string} options.filename - Original filename (optional)
 * @returns {Promise<string>} - Cloudinary secure URL
 */
const uploadImage = async (fileBuffer, options = {}) => {
    try {
        const {
            folder = 'products',
            filename = `product_${Date.now()}`
        } = options;

        // Validate credentials
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
            throw new Error('Cloudinary credentials not configured. Check .env file.');
        }

        // Upload to Cloudinary using stream
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: folder,
                    public_id: filename,
                    transformation: [
                        { width: 1000, height: 1000, crop: 'limit' }, // Max 1000x1000
                        { quality: 'auto' }, // Auto optimize quality
                        { fetch_format: 'auto' } // Auto format (webp for modern browsers)
                    ],
                    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        reject(error);
                    } else {
                        console.log('✅ Image uploaded to Cloudinary:', result.secure_url);
                        resolve(result.secure_url);
                    }
                }
            );

            // Convert buffer to stream and pipe to Cloudinary
            streamifier.createReadStream(fileBuffer).pipe(uploadStream);
        });

    } catch (error) {
        console.error('Upload Image Error:', error.message);
        throw new Error(`Failed to upload image: ${error.message}`);
    }
};

/**
 * Delete image from Cloudinary
 * 
 * @param {string} imageUrl - Full Cloudinary URL
 * @returns {Promise<boolean>} - Success status
 */
const deleteImage = async (imageUrl) => {
    try {
        // Extract public_id from Cloudinary URL
        // Example: https://res.cloudinary.com/cloud/image/upload/v123/products/image.jpg
        // Public ID: products/image
        
        const urlParts = imageUrl.split('/');
        const uploadIndex = urlParts.indexOf('upload');
        
        if (uploadIndex === -1) {
            throw new Error('Invalid Cloudinary URL');
        }

        // Get path after 'upload/v123/' or 'upload/'
        let publicId = urlParts.slice(uploadIndex + 2).join('/');
        
        // Remove file extension
        publicId = publicId.replace(/\.[^/.]+$/, '');

        const result = await cloudinary.uploader.destroy(publicId);
        
        if (result.result === 'ok') {
            console.log('✅ Image deleted from Cloudinary:', publicId);
            return true;
        } else {
            console.warn('⚠️ Failed to delete image:', result);
            return false;
        }

    } catch (error) {
        console.error('Delete Image Error:', error.message);
        return false; // Don't throw error, just log
    }
};

/**
 * Get Cloudinary upload stats (for monitoring)
 */
const getUploadStats = async () => {
    try {
        const stats = await cloudinary.api.usage();
        return {
            credits: stats.credits,
            used_percent: stats.used_percent,
            limit: stats.limit
        };
    } catch (error) {
        console.error('Get Stats Error:', error.message);
        return null;
    }
};

module.exports = {
    uploadImage,
    deleteImage,
    getUploadStats
};
