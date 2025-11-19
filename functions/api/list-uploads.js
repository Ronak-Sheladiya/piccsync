export async function onRequest(context) {
  const { request, env } = context;
  
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  try {
    const objects = await env.MY_BUCKET.list({ prefix: 'uploads/' });
    
    const files = objects.objects.map(obj => ({
      key: obj.key,
      size: obj.size,
      lastModified: obj.uploaded
    }));
    
    return new Response(JSON.stringify({
      ok: true,
      files
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({
      ok: false,
      error: 'Failed to list uploads'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}