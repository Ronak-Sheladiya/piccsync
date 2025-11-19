import { verify } from '../../lib/jwt.js';

export async function onRequest(context) {
  const { request, env } = context;
  
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'Missing or invalid authorization header'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const token = authHeader.substring(7);
    const payload = await verify(token, env.JWT_SECRET);
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'Token expired'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      ok: true,
      user: payload
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({
      ok: false,
      error: 'Invalid token'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}