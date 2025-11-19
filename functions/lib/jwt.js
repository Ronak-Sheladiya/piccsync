// TODO: Replace with production-grade auth and secure secret storage.

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64UrlEncode(data) {
  return btoa(String.fromCharCode(...new Uint8Array(data)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return new Uint8Array(Array.from(atob(str), c => c.charCodeAt(0)));
}

export async function sign(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${headerB64}.${payloadB64}`)
  );
  
  const signatureB64 = base64UrlEncode(signature);
  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

export async function verify(token, secret) {
  const [headerB64, payloadB64, signatureB64] = token.split('.');
  if (!headerB64 || !payloadB64 || !signatureB64) {
    throw new Error('Invalid token format');
  }
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  
  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlDecode(signatureB64),
    encoder.encode(`${headerB64}.${payloadB64}`)
  );
  
  if (!isValid) {
    throw new Error('Invalid signature');
  }
  
  return JSON.parse(decoder.decode(base64UrlDecode(payloadB64)));
}