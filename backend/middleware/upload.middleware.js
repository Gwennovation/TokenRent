/**
 * File upload — multer with Cloudinary storage.
 * Photos go to a "tokenrent/items" folder, auto-resized to max 1200×1200.
 */
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const itemStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'tokenrent/items',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
  },
});

const evidenceStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'tokenrent/disputes',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto' }],
  },
});

const limits = { fileSize: 5 * 1024 * 1024 }; // 5 MB per file

exports.uploadItemPhotos     = multer({ storage: itemStorage,     limits }).array('photos',   6);
exports.uploadDisputeEvidence = multer({ storage: evidenceStorage, limits }).array('evidence', 6);
