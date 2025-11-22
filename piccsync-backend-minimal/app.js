const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.set('trust proxy', true);
const PORT = process.env.PORT || 5000;

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// R2 client
const s3 = new S3Client({
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
  region: 'auto'
});

const bucket = process.env.R2_BUCKET;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Auth middleware
const verifyAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Auth failed' });
  }
};

// Multer config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'PiccSync API', status: 'OK' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Upload photo
app.post('/api/upload', verifyAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    
    const { visibility = 'private' } = req.body;
    const userId = req.user.id;
    const timestamp = Date.now();
    const r2Key = `uploads/${userId}/${timestamp}-${req.file.originalname}`;
    
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: r2Key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    }));
    
    const { data, error } = await supabase
      .from('photos')
      .insert({
        user_id: userId,
        filename: req.file.originalname,
        r2_key: r2Key,
        visibility,
        file_size: req.file.size,
        mime_type: req.file.mimetype
      })
      .select()
      .single();
    
    if (error) return res.status(500).json({ error: 'DB error' });
    
    const url = await getSignedUrl(s3, new GetObjectCommand({
      Bucket: bucket,
      Key: r2Key
    }), { expiresIn: 3600 });
    
    res.json({ ...data, url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get photos
app.get('/api/photos', verifyAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    
    if (error) return res.status(500).json({ error: 'DB error' });
    
    const photosWithUrls = await Promise.all(data.map(async photo => {
      try {
        const url = await getSignedUrl(s3, new GetObjectCommand({
          Bucket: bucket,
          Key: photo.r2_key
        }), { expiresIn: 3600 });
        return { ...photo, url };
      } catch {
        return { ...photo, url: null };
      }
    }));
    
    res.json(photosWithUrls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download photo
app.get('/api/photos/:id/download', verifyAuth, async (req, res) => {
  try {
    const { data: photo, error } = await supabase
      .from('photos')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error || !photo) return res.status(404).json({ error: 'Not found' });
    if (photo.user_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    
    const response = await s3.send(new GetObjectCommand({
      Bucket: bucket,
      Key: photo.r2_key
    }));
    
    res.setHeader('Content-Type', photo.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${photo.filename}"`);
    response.Body.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete photo
app.delete('/api/photos/:id', verifyAuth, async (req, res) => {
  try {
    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (fetchError || !photo) return res.status(404).json({ error: 'Not found' });
    if (photo.user_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    
    await s3.send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: photo.r2_key
    }));
    
    const { error } = await supabase
      .from('photos')
      .delete()
      .eq('id', req.params.id);
    
    if (error) return res.status(500).json({ error: 'DB error' });
    
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update photo
app.patch('/api/photos/:id', verifyAuth, async (req, res) => {
  try {
    const { visibility, filename } = req.body;
    
    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (fetchError || !photo) return res.status(404).json({ error: 'Not found' });
    if (photo.user_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    
    const updateData = {};
    if (visibility) updateData.visibility = visibility;
    if (filename) updateData.filename = filename.trim();
    
    const { data, error } = await supabase
      .from('photos')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) return res.status(500).json({ error: 'DB error' });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});