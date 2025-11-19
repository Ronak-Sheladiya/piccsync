import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createClient } from '@supabase/supabase-js';

const app = new Hono();

// CORS middleware
app.use('*', cors({
  origin: ['https://your-frontend.pages.dev', 'http://localhost:5173'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Initialize Supabase
const getSupabase = (env) => {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
};

// Auth middleware
const authMiddleware = async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return c.json({ error: 'No token provided' }, 401);
  }
  
  const supabase = getSupabase(c.env);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return c.json({ error: 'Invalid token' }, 401);
  }
  
  c.set('user', user);
  await next();
};

// Routes
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/upload', authMiddleware, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file');
    const visibility = formData.get('visibility') || 'private';
    const user = c.get('user');
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${user.id}/${timestamp}-${file.name}`;
    
    // Upload to R2
    await c.env.BUCKET.put(filename, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });
    
    // Save to Supabase
    const supabase = getSupabase(c.env);
    const { data, error } = await supabase
      .from('photos')
      .insert({
        user_id: user.id,
        filename: file.name,
        r2_key: filename,
        visibility,
        file_size: file.size,
        mime_type: file.type
      })
      .select()
      .single();
    
    if (error) {
      return c.json({ error: 'Failed to save photo metadata' }, 500);
    }
    
    // Generate URL
    const url = `https://your-bucket.your-account-id.r2.cloudflarestorage.com/${filename}`;
    
    return c.json({
      ...data,
      url
    });
  } catch (error) {
    return c.json({ error: 'Upload failed' }, 500);
  }
});

app.get('/api/photos', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const supabase = getSupabase(c.env);
    
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      return c.json({ error: 'Failed to fetch photos' }, 500);
    }
    
    // Add URLs to photos
    const photosWithUrls = data.map(photo => ({
      ...photo,
      url: `https://your-bucket.your-account-id.r2.cloudflarestorage.com/${photo.r2_key}`
    }));
    
    return c.json(photosWithUrls);
  } catch (error) {
    return c.json({ error: 'Failed to fetch photos' }, 500);
  }
});

export default app;