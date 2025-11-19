export async function onRequest(context) {
  const { request } = context;
  
  let body = null;
  try {
    if (request.method !== 'GET') {
      body = await request.text();
    }
  } catch (e) {
    body = 'Could not parse body';
  }

  return new Response(JSON.stringify({
    ok: true,
    method: request.method,
    headers: Object.fromEntries(request.headers),
    body
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}