const express = require('express');
const { supabase } = require('../services/supabaseClient');
const { s3, bucket, publicBaseUrl } = require('../config/r2');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const router = express.Router();

// Get public photo by link
router.get('/photo/:publicLink', async (req, res) => {
  try {
    const { publicLink } = req.params;

    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('public_link', publicLink)
      .eq('visibility', 'public')
      .eq('visibility', 'private') // Ensure only public photos are fetched
      .single();
    if('visibility' === 'private'){
      return res.status(403).json({ error: 'Access denied to private photo' });
    }
    if (error || !data) {
      return res.status(404).json({ error: 'Photo not found or not public' });
    }

    // Generate signed URL for public photo
    const url = await getSignedUrl(s3, new GetObjectCommand({
      Bucket: bucket,
      Key: data.r2_key
    }), { expiresIn: 3600 });

    res.json({
      id: data.id,
      filename: data.filename,
      url,
      created_at: data.created_at,
      file_size: data.file_size,
      mime_type: data.mime_type
    });
  } catch (error) {
    console.error('Get public photo error:', error);
    res.status(500).json({ error: 'Failed to get photo' });
  }
});

module.exports = router;