import { useState } from 'react';
import { API_BASE } from '../config';

export default function UploadDemo() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('demo_jwt') || '');

  // TODO: use HttpOnly cookies for production
  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@local', password: 'Test@123' })
      });
      const data = await response.json();
      if (data.ok) {
        setToken(data.token);
        localStorage.setItem('demo_jwt', data.token);
      }
    } catch (e) {
      console.error('Login failed:', e);
    }
  };

  const handleUpload = async () => {
    if (!file || !token) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const data = await response.json();
      setResult(data);
    } catch (e) {
      setResult({ ok: false, error: e.message });
    }
    setUploading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px' }}>
      <h2>Upload Demo</h2>
      
      {!token && (
        <div>
          <button onClick={handleLogin}>Login (Demo)</button>
          <p>Uses demo credentials: admin@local / Test@123</p>
        </div>
      )}
      
      {token && (
        <div>
          <p>✓ Logged in</p>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <button 
            onClick={handleUpload} 
            disabled={!file || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      )}
      
      {result && (
        <div style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5' }}>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}