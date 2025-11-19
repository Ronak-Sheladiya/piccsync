import { sign } from '../../lib/jwt.js';

export async function onRequest(context) {
  const { request, env } = context;
  
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  try {
    const { email, password } = await request.json();
    
    // TODO: Replace with real user database lookup
    if (email === 'admin@local' && password === 'Test@123') {
      const payload = {
        email,
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
      };
      
      const token = await sign(payload, env.JWT_SECRET);
      
      return new Response(JSON.stringify({
        ok: true,
        token,
        user: { email }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      ok: false,
      error: 'Invalid credentials'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({
      ok: false,
      error: 'Invalid request'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}