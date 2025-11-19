import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/api';
import PhotoCard from '../components/PhotoCard';
import UploadForm from '../components/UploadForm';

function GroupDetail() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [tempDescription, setTempDescription] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchGroupData();
    
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      const [groupRes, photosRes] = await Promise.all([
        api.get(`/groups/${groupId}`),
        api.get(`/groups/${groupId}/photos`)
      ]);
      setGroup(groupRes.data);
      setPhotos(photosRes.data);
    } catch (error) {
      setError('Failed to load group data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = (newPhoto) => {
    setPhotos([newPhoto, ...photos]);
    setShowUpload(false);
  };

  const handleDelete = (photoId) => {
    setPhotos(photos.filter(p => p.id !== photoId));
  };

  const handleUpdate = (updatedPhoto) => {
    setPhotos(photos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p));
  };

  const handleTitleEdit = () => {
    if (group.user_role !== 'admin') return;
    setTempTitle(group.name);
    setEditingTitle(true);
  };

  const handleDescriptionEdit = () => {
    if (group.user_role !== 'admin') return;
    setTempDescription(group.description || '');
    setEditingDescription(true);
  };

  const saveTitle = async () => {
    try {
      await api.patch(`/groups/${groupId}`, { name: tempTitle });
      setGroup({ ...group, name: tempTitle });
      setEditingTitle(false);
    } catch (error) {
      setError('Failed to update group name');
    }
  };

  const saveDescription = async () => {
    try {
      await api.patch(`/groups/${groupId}`, { description: tempDescription });
      setGroup({ ...group, description: tempDescription });
      setEditingDescription(false);
    } catch (error) {
      setError('Failed to update group description');
    }
  };

  const handleIconRightClick = (e) => {
    if (group.user_role !== 'admin') return;
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleUploadIcon = () => {
    setContextMenu(null);
    fileInputRef.current.click();
    fileInputRef.current.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const formData = new FormData();
      formData.append('icon', file);
      
      try {
        const response = await api.post(`/groups/${groupId}/icon`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setGroup({ ...group, icon_url: response.data.icon_url });
      } catch (error) {
        setError('Failed to upload icon');
      }
    };
  };

  const fetchMembers = async () => {
    try {
      const response = await api.get(`/groups/${groupId}/members`);
      setMembers(response.data);
    } catch (error) {
      setError('Failed to load members');
    }
  };

  const handleShowMembers = () => {
    setShowMembers(true);
    fetchMembers();
  };

  const addMember = async () => {
    if (!newMemberEmail.trim()) return;
    setAddingMember(true);
    try {
      await api.post(`/groups/${groupId}/members`, {
        memberEmails: [newMemberEmail.trim()]
      });
      setNewMemberEmail('');
      fetchMembers();
      fetchGroupData();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const removeMember = async (memberId) => {
    try {
      await api.delete(`/groups/${groupId}/members/${memberId}`);
      fetchMembers();
      fetchGroupData();
    } catch (error) {
      setError('Failed to remove member');
    }
  };

  const deleteGroup = async () => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;
    try {
      await api.delete(`/groups/${groupId}`);
      window.location.href = '/groups';
    } catch (error) {
      setError('Failed to delete group');
    }
  };

  if (loading) return <div className="group-detail-loading"><div className="loading-spinner"></div><p>Loading group...</p></div>;
  if (error) return <div className="group-detail-error"><div className="error-icon">⚠️</div><h2>Error</h2><p>{error}</p></div>;
  if (!group) return <div className="group-detail-error"><div className="error-icon">❌</div><h2>Group not found</h2></div>;

  return (
    <div className="group-detail-container">
      <div className="group-detail-header">
        <div className="header-nav">
          <Link to="/groups" className="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5m7-7l-7 7 7 7"/>
            </svg>
            Back to Groups
          </Link>
        </div>
        
        <div className="group-header-content">
          <div className="group-info">
            <div 
              className="group-icon-large" 
              onContextMenu={handleIconRightClick}
            >
              {(group.icon_url) ? (
                <img src={group.icon_url} alt={group.name} />
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              )}
            </div>
            
            <div className="group-details">
              {editingTitle ? (
                <input
                  className="edit-input"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && saveTitle()}
                  onBlur={saveTitle}
                  autoFocus
                />
              ) : (
                <h1 
                  className={group.user_role === 'admin' ? 'editable-title' : ''}
                  onDoubleClick={handleTitleEdit}
                >
                  {group.name}
                </h1>
              )}
              
              {editingDescription ? (
                <textarea
                  className="edit-input"
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && saveDescription()}
                  onBlur={saveDescription}
                  autoFocus
                  rows="2"
                />
              ) : (
                <p 
                  className={group.user_role === 'admin' ? 'editable-description' : ''}
                  onDoubleClick={handleDescriptionEdit}
                >
                  {group.description || 'No description'}
                </p>
              )}
              
              <div className="group-stats">
                <div className="stat">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  {group.member_count} members
                </div>
                <div className="stat">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21,15 16,10 5,21"/>
                  </svg>
                  {photos.length} files
                </div>
              </div>
            </div>
          </div>
          
          <div className="upload-section">
            <button onClick={() => setShowUpload(true)} className="btn btn-primary btn-upload">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,5 17,10"/>
                <line x1="12" y1="5" x2="12" y2="15"/>
              </svg>
              Upload
            </button>
            <button onClick={handleShowMembers} className="btn btn-secondary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Manage Members
            </button>
          </div>
        </div>
      </div>

      <div className="group-content">
        {photos.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-state-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
              </svg>
            </div>
            <h3>No files yet</h3>
            <p>Start sharing by uploading your first image or video</p>
            <button onClick={() => setShowUpload(true)} className="btn btn-primary">
              Upload First File
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
                {photos.length} file{photos.length !== 1 ? 's' : ''}
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
                  isGroupPhoto={true}
                  groupRole={group.user_role}
                  currentUserId={group.current_user_id}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {showUpload && (
        <UploadForm
          onUpload={handleUpload}
          onClose={() => setShowUpload(false)}
          groupId={groupId}
        />
      )}

      {showMembers && (
        <div className="popup-overlay" onClick={() => setShowMembers(false)}>
          <div className="popup-modal members-modal" onClick={e => e.stopPropagation()}>
            <div className="popup-header">
              <h2>Manage Members</h2>
              <button className="popup-close" onClick={() => setShowMembers(false)}>×</button>
            </div>
            
            <div className="popup-content">
              {group.user_role === 'admin' && (
                <div className="add-member-section">
                  <h3>Add Member</h3>
                  <div className="add-member-form">
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addMember()}
                    />
                    <button onClick={addMember} disabled={addingMember} className="btn btn-primary">
                      {addingMember ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                </div>
              )}
              
              <div className="members-list">
                <h3>Members ({members.length})</h3>
                {members.map(member => (
                  <div key={member.id} className="member-item">
                    <div className="member-info">
                      <div className="member-avatar">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="member-details">
                        <div className="member-name">{member.name}</div>
                        <div className="member-email">{member.email || 'No email provided'}</div>
                      </div>
                    </div>
                    <div className="member-actions">
                      <span className={`role-badge role-${member.role}`}>
                        {member.role === 'admin' ? 'Admin' : 'Member'}
                      </span>
                      {group.user_role === 'admin' && member.role !== 'admin' && (
                        <button 
                          onClick={() => removeMember(member.id)}
                          className="btn btn-danger btn-small"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {group.user_role === 'admin' && (
                <div className="danger-zone">
                  <h3>Danger Zone</h3>
                  <button onClick={deleteGroup} className="btn btn-danger">
                    Delete Group
                  </button>
                  <small>This action cannot be undone</small>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {contextMenu && (
        <div 
          className="context-menu" 
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="context-menu-item" 
            onClick={handleUploadIcon}
          >
            Upload Group Icon
          </div>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
      />
    </div>
  );
}

export default GroupDetail;