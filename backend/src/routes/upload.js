const express = require('express');
const multer = require('multer');
const verifySupabaseAuth = require('../middleware/verifySupabaseAuth');
const { supabase } = require('../services/supabaseClient');
const { s3, bucket } = require('../config/r2');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const {
  uploadPhoto,
  getUserPhotos,
  getPhotoById,
  updatePhotoVisibility,
  downloadPhoto,
  deletePhoto
} = require('../controllers/uploadController');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  }
});

// Upload photo
router.post('/upload', verifySupabaseAuth, upload.single('file'), uploadPhoto);

// Get user's photos
router.get('/photos', verifySupabaseAuth, async (req, res) => {
  try {
    console.log('🔍 Fetching photos for user:', req.user.id);
    
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('user_id', req.user.id)
      .is('group_id', null)
      .order('created_at', { ascending: false });

    console.log('📊 Photos query result:', { data: data?.length, error });

    if (error) {
      console.error('❌ Photos fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch photos' });
    }

    const photosWithUrls = await Promise.all(data.map(async photo => {
      try {
        const url = await getSignedUrl(s3, new GetObjectCommand({
          Bucket: bucket,
          Key: photo.r2_key
        }), { expiresIn: 3600 });
        return { ...photo, url };
      } catch (error) {
        console.error('❌ URL generation error for photo:', photo.id, error);
        return { ...photo, url: null, error: 'Failed to load image' };
      }
    }));

    console.log('✅ Sending photos response:', photosWithUrls.length, 'photos');
    res.json(photosWithUrls);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// Get user storage info
router.get('/storage', verifySupabaseAuth, async (req, res) => {
  try {
    const { data: photos, error } = await supabase
      .from('photos')
      .select('file_size')
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch storage info' });
    }

    const used = photos.reduce((sum, photo) => sum + (photo.file_size || 0), 0);
    const limit = 1073741824; // 1GB default
    
    console.log('Storage calculation:', {
      photosCount: photos.length,
      fileSizes: photos.map(p => p.file_size),
      totalUsed: used,
      limit
    });
    
    res.json({
      used,
      limit,
      remaining: limit - used,
      percentage: Math.round((used / limit) * 100)
    });
  } catch (error) {
    console.error('Storage info error:', error);
    res.status(500).json({ error: 'Failed to get storage info' });
  }
});

// Get specific photo
router.get('/photos/:id', verifySupabaseAuth, getPhotoById);

// Update photo visibility
router.patch('/photos/:id', verifySupabaseAuth, updatePhotoVisibility);

// Download photo
router.get('/photos/:id/download', verifySupabaseAuth, downloadPhoto);

// Delete photo
router.delete('/photos/:id', verifySupabaseAuth, deletePhoto);

module.exports = router;