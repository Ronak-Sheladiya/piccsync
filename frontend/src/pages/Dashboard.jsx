import { useState, useEffect } from 'react';
import api from '../api/api';
import PhotoCard from '../components/PhotoCard';
import UploadForm from '../components/UploadForm';

function Dashboard({ user }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [storageInfo, setStorageInfo] = useState({ used: 0, limit: 1073741824 });

  useEffect(() => {
    fetchPhotos();
    fetchStorageInfo();
  }, []);

  const fetchPhotos = async () => {
    try {
      const response = await api.get('/photos');
      setPhotos(response.data);
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStorageInfo = async () => {
    try {
      const response = await api.get('/storage');
      console.log('Storage response:', response.data);
      setStorageInfo(response.data);
    } catch (error) {
      console.error('Failed to fetch storage info:', error);
    }
  };

  const handleUpload = (newPhoto) => {
    setPhotos([newPhoto, ...photos]);
    fetchStorageInfo(); // Refresh storage info after upload
  };

  const handleDelete = (photoId) => {
    setPhotos(photos.filter(p => p.id !== photoId));
    fetchStorageInfo(); // Refresh storage info after delete
  };

  const handleUpdate = (updatedPhoto) => {
    setPhotos(photos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p));
  };

  const publicPhotos = photos.filter(p => p.visibility === 'public');
  const privatePhotos = photos.filter(p => p.visibility === 'private');
  
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your photos...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Photo Dashboard</h1>
            <p>Manage and organize your photo collection</p>
          </div>
          <button onClick={() => setShowUpload(true)} className="btn btn-primary btn-upload">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,5 17,10"/>
              <line x1="12" y1="5" x2="12" y2="15"/>
            </svg>
            Upload Photo
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-total">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>{photos.length}</h3>
            <p>Total Photos</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon stat-icon-public">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>{publicPhotos.length}</h3>
            <p>Public Photos</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon stat-icon-private">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <circle cx="12" cy="16" r="1"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>{privatePhotos.length}</h3>
            <p>Private Photos</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon stat-icon-storage">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>{formatFileSize(storageInfo.used)}</h3>
            <p>Storage Used ({storageInfo.percentage || 0}%)</p>
          </div>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
          </div>
          <h3>No photos yet</h3>
          <p>Start building your photo collection by uploading your first image</p>
          <button 
            onClick={() => setShowUpload(true)} 
            className="btn btn-primary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,5 17,10"/>
              <line x1="12" y1="5" x2="12" y2="15"/>
            </svg>
            Upload Your First Photo
          </button>
        </div>
      ) : (
        <>
          {/* Controls Bar */}
          <div className="controls-bar">
            <div className="view-controls">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
                Grid
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                List
              </button>
            </div>
            <div className="photo-count">
              {photos.length} photo{photos.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Photos Grid/List */}
          <div className={`photos-container ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
            {photos.map(photo => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                viewMode={viewMode}
              />
            ))}
          </div>
        </>
      )}

      {showUpload && (
        <UploadForm
          onUpload={handleUpload}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
}

export default Dashboard;