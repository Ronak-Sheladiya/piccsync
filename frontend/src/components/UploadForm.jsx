import { useState } from 'react';
import api from '../api/api';

function UploadForm({ onUpload, onClose, groupId }) {
  const [file, setFile] = useState(null);
  const [visibility, setVisibility] = useState('private');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    // No file size limit

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('visibility', visibility);
    if (groupId) formData.append('groupId', groupId);

    try {
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUpload(response.data);
      onClose();
    } catch (error) {
      if (error.response?.status === 413) {
        alert(error.response.data.error || 'Storage quota exceeded');
      } else {
        alert(error.response?.data?.error || 'Upload failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type.startsWith('image/') || droppedFile.type.startsWith('video/'))) {
      setFile(droppedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Upload Photo
          </h2>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Share your memories with the world</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
              </svg>
              Select Photo
            </label>
            <div 
              style={{
                border: `2px dashed ${dragOver ? '#667eea' : '#d1d5db'}`,
                borderRadius: '12px',
                padding: '40px 20px',
                textAlign: 'center',
                background: dragOver ? '#f8faff' : '#f9fafb',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById('file-input').click()}
            >
              {file ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#10b981' }}>
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                    <p style={{ color: '#667eea', fontWeight: '600', margin: 0 }}>{file.name}</p>
                  </div>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>Click to change</p>
                </div>
              ) : (
                <div>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 0 16px 0', color: '#9ca3af' }}>
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  <p style={{ color: '#374151', fontWeight: '600' }}>Drop your photo here</p>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>or click to browse</p>
                  <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>Images and Videos supported</p>
                </div>
              )}
            </div>
            <input
              id="file-input"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/webm,video/ogg"
              onChange={(e) => setFile(e.target.files[0])}
              style={{ display: 'none' }}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              Visibility
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '12px 16px',
                border: `2px solid ${visibility === 'private' ? '#667eea' : '#e5e7eb'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                flex: 1,
                background: visibility === 'private' ? '#f0f4ff' : 'white'
              }}>
                <input
                  type="radio"
                  value="private"
                  checked={visibility === 'private'}
                  onChange={(e) => setVisibility(e.target.value)}
                  style={{ margin: 0 }}
                />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <circle cx="12" cy="16" r="1"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>Private</span>
              </label>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '12px 16px',
                border: `2px solid ${visibility === 'public' ? '#667eea' : '#e5e7eb'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                flex: 1,
                background: visibility === 'public' ? '#f0f4ff' : 'white'
              }}>
                <input
                  type="radio"
                  value="public"
                  checked={visibility === 'public'}
                  onChange={(e) => setVisibility(e.target.value)}
                  style={{ margin: 0 }}
                />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M2 12h20"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <span>Public</span>
              </label>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '30px' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Cancel
            </button>
            <button type="submit" disabled={loading || !file} className="btn btn-primary">
              {loading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,5 17,10"/>
                    <line x1="12" y1="5" x2="12" y2="15"/>
                  </svg>
                  Upload Photo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UploadForm;