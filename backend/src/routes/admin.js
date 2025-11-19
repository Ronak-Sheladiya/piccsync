const express = require('express');
const verifySupabaseAuth = require('../middleware/verifySupabaseAuth');
const isAdmin = require('../middleware/isAdmin');
const { supabase } = require('../services/supabaseClient');
const { s3, bucket, publicBaseUrl } = require('../config/r2');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const router = express.Router();

// Get all photos (admin only)
router.get('/photos', verifySupabaseAuth, isAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch photos' });
    }

    // Generate signed URLs for all photos in admin view
    const photosWithUrls = await Promise.all(data.map(async photo => {
      const url = await getSignedUrl(s3, new GetObjectCommand({
        Bucket: bucket,
        Key: photo.r2_key
      }), { expiresIn: 3600 });
      return { ...photo, url };
    }));

    res.json(photosWithUrls);
  } catch (error) {
    console.error('Admin fetch photos error:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// Get all users (admin only)
router.get('/users', verifySupabaseAuth, isAdmin, async (req, res) => {
  try {
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    // Get user profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*');

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    const users = authUsers.users.map(user => {
      const profile = profiles?.find(p => p.id === user.id);
      return {
        id: user.id,
        email: user.email,
        name: profile?.name || 'N/A',
        mobile: profile?.mobile || 'N/A',
        created_at: user.created_at
      };
    });

    res.json(users);
  } catch (error) {
    console.error('Admin fetch users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;