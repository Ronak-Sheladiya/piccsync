export async function onRequest(context) {
  const { request, env } = context;
  
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'No file provided'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validate file type
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'Only PNG and JPEG images allowed'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'File too large (max 10MB)'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const timestamp = Date.now();
    const key = `uploads/${timestamp}-${file.name}`;
    
    // Upload to R2
    await env.MY_BUCKET.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type
      }
    });
    
    // Note: URL may require Worker or public bucket settings for direct access
    // For signed URLs, use: await env.MY_BUCKET.get(key, { onlyIf: { uploadedBefore: new Date() } })
    const url = `https://your-bucket.your-account.r2.cloudflarestorage.com/${key}`;
    
    return new Response(JSON.stringify({
      ok: true,
      key,
      url
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({
      ok: false,
      error: 'Upload failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}