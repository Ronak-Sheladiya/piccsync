const { s3, bucket, publicBaseUrl } = require('../config/r2');
const { supabase } = require('../services/supabaseClient');
const { HeadBucketCommand, CreateBucketCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');

const uploadPhoto = async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('File:', req.file);
    console.log('Body:', req.body);
    console.log('User:', req.user);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { visibility = 'private', groupId } = req.body;
    const userId = req.user.id;

    // If uploading to group, verify membership
    if (groupId) {
      const { data: membership } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single();

      if (!membership) {
        return res.status(403).json({ error: 'Not a member of this group' });
      }
    }

    // Check storage quota
    const { data: photos, error: storageError } = await supabase
      .from('photos')
      .select('file_size')
      .eq('user_id', userId);

    if (storageError) {
      return res.status(500).json({ error: 'Failed to check storage' });
    }

    const currentStorage = photos.reduce((sum, photo) => sum + (photo.file_size || 0), 0);
    const storageLimit = 1073741824; // 1GB default
    
    if (currentStorage + req.file.size > storageLimit) {
      const remainingMB = Math.round((storageLimit - currentStorage) / 1024 / 1024);
      return res.status(413).json({ 
        error: `Storage quota exceeded. You have ${remainingMB}MB remaining.` 
      });
    }
    const timestamp = Date.now();
    const r2Key = `uploads/${userId}/${timestamp}-${req.file.originalname}`;
    const publicLink = visibility === 'public' ? `photo-${timestamp}-${Math.random().toString(36).substr(2, 9)}` : null;

    console.log('R2 Config:', { bucket, endpoint: process.env.R2_ENDPOINT });

    // Upload to R2
    const uploadParams = {
      Bucket: bucket,
      Key: r2Key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    };

    console.log('Uploading to R2...');
    
    // Try to upload, create bucket if it doesn't exist
    console.log('Attempting upload to R2...');
    
    try {
      await s3.send(new PutObjectCommand(uploadParams));
    } catch (uploadError) {
      if (uploadError.name === 'NoSuchBucket') {
        console.log('Bucket does not exist, creating...');
        await s3.send(new CreateBucketCommand({ Bucket: bucket }));
        console.log('Bucket created, retrying upload...');
        await s3.send(new PutObjectCommand(uploadParams));
      } else {
        throw uploadError;
      }
    }
    console.log('R2 upload successful');

    console.log('Saving to database...');
    // Determine file type and ensure proper mime type
    const filename = req.file.originalname.toLowerCase();
    let mimeType = req.file.mimetype;
    
    // Fix common mime type issues
    if (filename.endsWith('.mp4') && !mimeType.includes('video')) {
      mimeType = 'video/mp4';
    } else if (filename.endsWith('.mov') && !mimeType.includes('video')) {
      mimeType = 'video/quicktime';
    } else if (filename.endsWith('.avi') && !mimeType.includes('video')) {
      mimeType = 'video/x-msvideo';
    } else if (filename.endsWith('.webm') && !mimeType.includes('video')) {
      mimeType = 'video/webm';
    }
    
    // Save metadata to Supabase
    const { data, error } = await supabase
      .from('photos')
      .insert({
        user_id: userId,
        filename: req.file.originalname,
        r2_key: r2Key,
        visibility,
        group_id: groupId || null,
        public_link: publicLink,
        file_size: req.file.size,
        mime_type: mimeType
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to save photo metadata' });
    }

    // Generate signed URL (works for all photos)
    const url = await getSignedUrl(s3, new GetObjectCommand({
      Bucket: bucket,
      Key: r2Key
    }), { expiresIn: 3600 });

    console.log('Upload completed successfully');
    res.json({
      id: data.id,
      filename: data.filename,
      visibility: data.visibility,
      url,
      created_at: data.created_at,
      public_link: data.public_link,
      file_size: data.file_size,
      mime_type: data.mime_type
    });

  } catch (error) {
    console.error('Upload error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode,
      requestId: error.$metadata?.requestId
    });
    res.status(500).json({ error: `Upload failed: ${error.message}` });
  }
};

const getUserPhotos = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch photos' });
    }

    // Generate signed URLs with error handling
    const photosWithUrls = await Promise.all(data.map(async photo => {
      try {
        const url = await getSignedUrl(s3, new GetObjectCommand({
          Bucket: bucket,
          Key: photo.r2_key
        }), { expiresIn: 3600 });
        return { ...photo, url };
      } catch (error) {
        console.error(`Failed to generate URL for photo ${photo.id}:`, error.message);
        // Return photo with placeholder or null URL
        return { ...photo, url: null, error: 'Failed to load image' };
      }
    }));

    res.json(photosWithUrls);
  } catch (error) {
    console.error('Fetch photos error:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
};

const getPhotoById = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUserIds = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) || [];
    const isAdmin = adminUserIds.includes(req.user.id);

    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Check permissions
    if (data.user_id !== req.user.id && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Generate signed URL with error handling
    let url;
    try {
      url = await getSignedUrl(s3, new GetObjectCommand({
        Bucket: bucket,
        Key: data.r2_key
      }), { expiresIn: 3600 });
    } catch (error) {
      console.error(`Failed to generate URL for photo ${data.id}:`, error.message);
      return res.status(500).json({ error: 'Failed to generate image URL' });
    }

    res.json({ ...data, url });
  } catch (error) {
    console.error('Get photo error:', error);
    res.status(500).json({ error: 'Failed to get photo' });
  }
};

const updatePhotoVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { visibility, filename } = req.body;
    const adminUserIds = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) || [];
    const isAdmin = adminUserIds.includes(req.user.id);

    if (visibility && !['public', 'private'].includes(visibility)) {
      return res.status(400).json({ error: 'Invalid visibility value' });
    }

    // Check ownership
    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    if (photo.user_id !== req.user.id && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Prepare update data
    const updateData = {};
    
    if (visibility) {
      updateData.visibility = visibility;
      updateData.public_link = visibility === 'public' 
        ? (photo.public_link || `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
        : null;
    }
    
    if (filename) {
      updateData.filename = filename.trim();
    }

    const { data, error } = await supabase
      .from('photos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update photo' });
    }

    res.json(data);
  } catch (error) {
    console.error('Update photo error:', error);
    res.status(500).json({ error: 'Failed to update photo' });
  }
};

const downloadPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUserIds = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) || [];
    const isAdmin = adminUserIds.includes(req.user.id);

    const { data: photo, error } = await supabase
      .from('photos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Check permissions
    if (photo.user_id !== req.user.id && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get file from R2
    const getObjectResponse = await s3.send(new GetObjectCommand({
      Bucket: bucket,
      Key: photo.r2_key
    }));

    // Set appropriate headers
    res.setHeader('Content-Type', photo.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${photo.filename}"`);
    res.setHeader('Content-Length', getObjectResponse.ContentLength);

    // Stream the file
    getObjectResponse.Body.pipe(res);
  } catch (error) {
    console.error('Download photo error:', error);
    res.status(500).json({ error: 'Failed to download photo' });
  }
};

const deletePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUserIds = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) || [];
    const isAdmin = adminUserIds.includes(req.user.id);

    // Get photo details
    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    if (photo.user_id !== req.user.id && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete from R2
    await s3.send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: photo.r2_key
    }));

    // Delete from database
    const { error } = await supabase
      .from('photos')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete photo metadata' });
    }

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
};

module.exports = {
  uploadPhoto,
  getUserPhotos,
  getPhotoById,
  updatePhotoVisibility,
  downloadPhoto,
  deletePhoto
};