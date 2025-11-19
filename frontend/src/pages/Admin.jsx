import { useState, useEffect } from 'react';
import api from '../api/api';
import PhotoCard from '../components/PhotoCard';

function Admin({ user }) {
  const [photos, setPhotos] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('photos');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [photosRes, usersRes] = await Promise.all([
        api.get('/admin/photos'),
        api.get('/admin/users')
      ]);
      setPhotos(photosRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      if (error.response?.status === 403) {
        alert('Admin access required');
      } else {
        console.error('Failed to fetch admin data:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (photoId) => {
    setPhotos(photos.filter(p => p.id !== photoId));
  };

  const handleUpdate = (updatedPhoto) => {
    setPhotos(photos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p));
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        color: 'white',
        fontSize: '18px'
      }}>
        🔧 Loading admin data...
      </div>
    );
  }

  return (
    <div>
      <div className="dashboard-header">
        <h1>🔧 Admin Panel</h1>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
          Managing {photos.length} photos from {users.length} users
        </div>
      </div>
      
      <div className="admin-tabs">
        <button 
          onClick={() => setActiveTab('photos')}
          className={`admin-tab ${activeTab === 'photos' ? 'active' : ''}`}
        >
          🖼️ All Photos ({photos.length})
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
        >
          👥 Users ({users.length})
        </button>
      </div>

      {activeTab === 'photos' && (
        <div>
          {photos.length === 0 ? (
            <div className="card empty-state">
              <h3>🖼️ No photos found</h3>
              <p>No users have uploaded photos yet.</p>
            </div>
          ) : (
            <>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px',
                color: 'white'
              }}>
                <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
                  <span>🌍 {photos.filter(p => p.visibility === 'public').length} public</span>
                  <span>🔒 {photos.filter(p => p.visibility === 'private').length} private</span>
                </div>
              </div>
              <div className="photo-grid">
                {photos.map(photo => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          {users.length === 0 ? (
            <div className="card empty-state">
              <h3>👥 No users found</h3>
              <p>No users have registered yet.</p>
            </div>
          ) : (
            <div className="card">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>Joined</th>
                    <th>Stats</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const userPhotos = photos.filter(p => p.user_id === user.id);
                    return (
                      <tr key={user.id}>
                        <td style={{ fontWeight: '500' }}>{user.name}</td>
                        <td>{user.email}</td>
                        <td style={{ fontSize: '14px', color: '#6b7280' }}>{user.mobile}</td>
                        <td>{new Date(user.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                            <span style={{ 
                              background: '#e0f2fe', 
                              color: '#0369a1', 
                              padding: '2px 8px', 
                              borderRadius: '12px' 
                            }}>
                              {userPhotos.length} photos
                            </span>
                            {userPhotos.filter(p => p.visibility === 'public').length > 0 && (
                              <span style={{ 
                                background: '#d1fae5', 
                                color: '#065f46', 
                                padding: '2px 8px', 
                                borderRadius: '12px' 
                              }}>
                                {userPhotos.filter(p => p.visibility === 'public').length} public
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Admin;