import { useState } from 'react';
import api from '../api/api';

function PhotoCard({ photo, onDelete, onUpdate, viewMode = 'grid', isGroupPhoto = false, groupRole = null, currentUserId = null }) {
  const [loading, setLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };
  

  
  const sharePhoto = async (e) => {
    e.stopPropagation();
    if (photo.visibility === 'public') {
      const shareUrl = `${window.location.origin}/photo/${photo.id}`;
      try {
        if (navigator.share) {
          await navigator.share({
            title: photo.filename,
            url: shareUrl
          });
        } else {
          await navigator.clipboard.writeText(shareUrl);
          alert('Photo link copied! Viewers will need to login to see it.');
        }
      } catch (error) {
        await navigator.clipboard.writeText(shareUrl);
        alert('Photo link copied! Viewers will need to login to see it.');
      }
    }
  };

  const downloadPhoto = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = photo.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download photo');
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/photos/${photo.id}`);
      onDelete(photo.id);
      setShowDeleteModal(false);
    } catch (error) {
      alert('Failed to delete photo');
    } finally {
      setLoading(false);
    }
  };

  // Check if user can delete this photo
  const canDelete = () => {
    if (isGroupPhoto) {
      // In groups: owner can delete their photos, admins can delete any photo
      return groupRole === 'admin' || photo.user_id === getCurrentUserId();
    }
    return true; // In personal dashboard, user can delete their own photos
  };

  // Get current user ID
  const getCurrentUserId = () => {
    return currentUserId;
  };

  const handleVisibilityToggle = async (e) => {
    e.stopPropagation();
    const newVisibility = photo.visibility === 'public' ? 'private' : 'public';
    setLoading(true);
    try {
      await api.patch(`/photos/${photo.id}`, { visibility: newVisibility });
      onUpdate({ ...photo, visibility: newVisibility });
    } catch (error) {
      alert('Failed to update photo');
    } finally {
      setLoading(false);
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editFilename, setEditFilename] = useState(photo.filename);

  const handleRename = async () => {
    if (!editFilename.trim() || editFilename.trim() === photo.filename) {
      setIsEditing(false);
      setEditFilename(photo.filename);
      return;
    }
    setLoading(true);
    try {
      await api.patch(`/photos/${photo.id}`, { filename: editFilename.trim() });
      onUpdate({ ...photo, filename: editFilename.trim() });
      setIsEditing(false);
    } catch (error) {
      alert('Failed to rename photo');
      setEditFilename(photo.filename);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditFilename(photo.filename);
    }
  };

  if (viewMode === 'list') {
    return (
      <>
        <div className="photo-card-list">
          <div className="photo-thumbnail" onClick={() => setShowImageModal(true)} style={{ cursor: 'pointer' }}>
            {photo.filename?.endsWith('.mp4') ? (
              <video>
                <source src={photo.url} type="video/mp4" />
              </video>
            ) : (
              <img src={photo.url} alt={photo.filename} />
            )}
          </div>
          <div className="photo-details">
            <div className="photo-main-info">
              {isEditing ? (
                <input 
                  type="text"
                  value={editFilename}
                  onChange={(e) => setEditFilename(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={handleKeyPress}
                  className="filename-edit"
                  autoFocus
                />
              ) : (
                <h4 
                  onDoubleClick={() => { setIsEditing(true); setEditFilename(photo.filename); }}
                  className="filename-display"
                >
                  {photo.filename}
                </h4>
              )}
              <div className="photo-meta">
                <span className={`visibility-badge visibility-${photo.visibility}`}>
                  {photo.visibility === 'public' ? (
                    <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M2 12h20"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg> Public</>
                  ) : (
                    <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <circle cx="12" cy="16" r="1"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg> Private</>
                  )}
                </span>
                <span className="photo-date">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {new Date(photo.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
                <span className="photo-size">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                  {formatFileSize(photo.file_size)}
                </span>
              </div>
            </div>
            <div className="photo-actions">
              <button 
                onClick={(e) => downloadPhoto(e)}
                className="btn btn-ghost btn-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download
              </button>
              {photo.visibility === 'public' && (
                <button 
                  onClick={(e) => sharePhoto(e)}
                  className="btn btn-ghost btn-sm"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3"/>
                    <circle cx="6" cy="12" r="3"/>
                    <circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                  Share
                </button>
              )}
              <button 
                onClick={handleVisibilityToggle}
                disabled={loading}
                className="btn btn-ghost btn-sm"
              >
                {photo.visibility === 'public' ? (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <circle cx="12" cy="16" r="1"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg> Make Private</>
                ) : (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M2 12h20"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg> Make Public</>
                )}
              </button>
              {canDelete() && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowDeleteModal(true); }}
                  disabled={loading}
                  className="btn btn-ghost btn-sm btn-danger-ghost"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                  </svg>
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="modal" onClick={() => setShowDeleteModal(false)}>
            <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
              <div className="delete-modal-header">
                <h2>Delete Photo</h2>
                <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
              </div>
              <div className="delete-modal-body">
                <div className="delete-preview">
                  <img src={photo.url} alt={photo.filename} />
                </div>
                <div className="delete-info">
                  <p><strong>{photo.filename}</strong></p>
                  <p>Are you sure you want to delete this photo? This action cannot be undone.</p>
                </div>
              </div>
              <div className="delete-modal-actions">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={loading}
                  className="btn btn-danger"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}



        {/* Image Modal */}
        {showImageModal && (
          <div className="image-modal" onClick={() => setShowImageModal(false)}>
            <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="image-modal-header">
                <h3 className="image-modal-title">{photo.filename}</h3>
                <button className="image-modal-close" onClick={() => setShowImageModal(false)}>×</button>
              </div>
              <img src={photo.url} alt={photo.filename} />
              <div className="image-modal-info">
                <div className="image-modal-meta">
                  <span className={`visibility-badge visibility-${photo.visibility}`}>
                    {photo.visibility === 'public' ? 'Public' : 'Private'}
                  </span>
                  <span>{formatFileSize(photo.file_size)}</span>
                  <span>{photo.mime_type}</span>
                  <span>{new Date(photo.created_at).toLocaleDateString()}</span>
                </div>

              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="photo-card">
        <div className="photo-image" onClick={() => setShowImageModal(true)} style={{ cursor: 'pointer' }}>
          {photo.filename?.endsWith('.mp4') ? (
            <video controls>
              <source src={photo.url} type="video/mp4" />
            </video>
          ) : (
            <img src={photo.url} alt={photo.filename} />
          )}
          <div className="photo-overlay">
            <button 
              onClick={(e) => downloadPhoto(e)}
              className="btn btn-secondary btn-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
            {photo.visibility === 'public' && (
              <button 
                onClick={(e) => sharePhoto(e)}
                className="btn btn-secondary btn-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3"/>
                  <circle cx="6" cy="12" r="3"/>
                  <circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              </button>
            )}
            <button 
              onClick={handleVisibilityToggle}
              disabled={loading}
              className="btn btn-secondary btn-sm"
            >
              {photo.visibility === 'public' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <circle cx="12" cy="16" r="1"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M2 12h20"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              )}
            </button>
            {canDelete() && (
              <button 
                onClick={(e) => { e.stopPropagation(); setShowDeleteModal(true); }}
                disabled={loading}
                className="btn btn-danger btn-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3,6 5,6 21,6"/>
                  <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="photo-info">
          {isEditing ? (
            <input 
              type="text"
              value={editFilename}
              onChange={(e) => setEditFilename(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyPress}
              className="filename-edit"
              autoFocus
            />
          ) : (
            <h4 
              onDoubleClick={() => { setIsEditing(true); setEditFilename(photo.filename); }}
              className="filename-display"
            >
              {photo.filename}
            </h4>
          )}
          <div className="photo-meta">
            <span className={`visibility-badge visibility-${photo.visibility}`}>
              {photo.visibility === 'public' ? (
                <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M2 12h20"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg> Public</>
              ) : (
                <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <circle cx="12" cy="16" r="1"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg> Private</>
              )}
            </span>
            <span className="photo-date">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {new Date(photo.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
            <span className="photo-size">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
              {formatFileSize(photo.file_size)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-header">
              <h2>Delete Photo</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="delete-modal-body">
              <div className="delete-preview">
                {photo.filename?.endsWith('.mp4') ? (
                  <video style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
                    <source src={photo.url} type="video/mp4" />
                  </video>
                ) : (
                  <img src={photo.url} alt={photo.filename} />
                )}
              </div>
              <div className="delete-info">
                <p><strong>{photo.filename}</strong></p>
                <p>Are you sure you want to delete this photo? This action cannot be undone.</p>
              </div>
            </div>
            <div className="delete-modal-actions">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={loading}
                className="btn btn-danger"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Image Modal */}
      {showImageModal && (
        <div className="image-modal" onClick={() => setShowImageModal(false)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="image-modal-header">
              <h3 className="image-modal-title">{photo.filename}</h3>
              <button className="image-modal-close" onClick={() => setShowImageModal(false)}>×</button>
            </div>
            {photo.filename?.endsWith('.mp4') ? (
              <video controls style={{ maxWidth: '90vw', maxHeight: '80vh', width: 'auto', height: 'auto' }}>
                <source src={photo.url} type="video/mp4" />
              </video>
            ) : (
              <img src={photo.url} alt={photo.filename} />
            )}
            <div className="image-modal-info">
              <div className="image-modal-meta">
                <span className={`visibility-badge visibility-${photo.visibility}`}>
                  {photo.visibility === 'public' ? 'Public' : 'Private'}
                </span>
                <span>{formatFileSize(photo.file_size)}</span>
                <span>{photo.mime_type}</span>
                <span>{new Date(photo.created_at).toLocaleDateString()}</span>
                {isGroupPhoto && photo.uploader_name && (
                  <span>Uploaded by {photo.uploader_name}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PhotoCard;