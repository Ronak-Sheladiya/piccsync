import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import api from '../api/api';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function PhotoViewer() {
  const { photoId } = useParams();
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.access_token) {
        localStorage.setItem('supabase_token', session.access_token);
        fetchPhoto();
      } else {
        setLoading(false);
      }
    });
  }, [photoId]);

  const fetchPhoto = async () => {
    try {
      const response = await api.get(`/photos/${photoId}`);
      setPhoto(response.data);
    } catch (error) {
      setError('Photo not found or access denied');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="photo-viewer-loading">
        <div className="loading-spinner"></div>
        <p>Loading photo...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="photo-viewer-auth">
        <div className="auth-required">
          <div className="auth-icon">🔒</div>
          <h2>Login Required</h2>
          <p>You need to be logged in to view this photo.</p>
          <div className="auth-buttons">
            <Link to="/login" className="btn btn-primary">
              Sign In
            </Link>
            <Link to="/signup" className="btn btn-secondary">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error || !photo) {
    return (
      <div className="photo-viewer-error">
        <div className="error-content">
          <div className="error-icon">📷</div>
          <h2>Photo Not Found</h2>
          <p>{error || 'This photo may have been deleted or you don\'t have permission to view it.'}</p>
          <Link to="/dashboard" className="btn btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  if(photo.visibility === 'private'){
    return (
      <div className="access-denied-page">
        <div className="access-denied-container">
          <div className="access-denied-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M4.93 4.93l14.14 14.14"/>
            </svg>
          </div>
          <div className="access-denied-content">
            <h1>Access Restricted</h1>
            <p>This content is private and requires proper authorization to view. Please contact the owner if you believe you should have access.</p>
            <div className="access-denied-details">
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value">403 Forbidden</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Resource:</span>
                <span className="detail-value">Private Media</span>
              </div>
            </div>
            <div className="access-denied-actions">
              <Link to="/dashboard" className="btn btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
                Return to Dashboard
              </Link>
              <Link to="/groups" className="btn btn-secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Browse Groups
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="photo-viewer-professional">
      <div className="viewer-header">
        <div className="header-brand">
          <span className="brand-name">Photo Stash</span>
        </div>
        <Link to="/dashboard" className="header-action">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
          Dashboard
        </Link>
      </div>

      <div className="viewer-main">
        <div className="media-container">
          <div className="media-wrapper">
            {photo.filename?.endsWith('.mp4') ? (
              <video controls style={{ width: '100%', maxHeight: '70vh', borderRadius: '12px' }}>
                <source src={photo.url} type="video/mp4" />
              </video>
            ) : (
              <img src={photo.url} alt={photo.filename} className="media-image" />
            )}
          </div>
        </div>
        
        <div className="image-info">
          <div className="info-header">
            <h1 className="image-title">{photo.filename}</h1>
            <div className="image-meta">
              <span className={`status-badge ${photo.visibility}`}>
                {photo.visibility === 'public' ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M2 12h20"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    Public
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <circle cx="12" cy="16" r="1"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    Private
                  </>
                )}
              </span>
              <span className="upload-date">
                {new Date(photo.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
          
          <div className="info-details">
            <div className="detail-item">
              <span className="detail-label">Size</span>
              <span className="detail-value">{(photo.file_size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            {photo.mime_type && (
              <div className="detail-item">
                <span className="detail-label">Format</span>
                <span className="detail-value">{photo.mime_type.split('/')[1].toUpperCase()}</span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">Uploaded</span>
              <span className="detail-value">
                {new Date(photo.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="viewer-footer">
        <div className="footer-content">
          <span>Powered by Photo Stash</span>
          <div className="footer-actions">
            <button 
              onClick={() => window.open(photo.url, '_blank')}
              className="action-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/>
                <path d="M21 3l-9 9"/>
                <path d="M15 3h6v6"/>
              </svg>
              Open Original
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PhotoViewer;