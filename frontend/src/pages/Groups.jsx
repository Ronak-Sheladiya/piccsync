import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';

function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    memberEmails: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchGroups();
    
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchGroups = async () => {
    try {
      console.log('Fetching groups...');
      const response = await api.get('/groups');
      console.log('Groups response:', response.data);
      setGroups(response.data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    
    try {
      const memberEmails = formData.memberEmails
        .split(',')
        .map(email => email.trim())
        .filter(email => email);

      await api.post('/groups', {
        name: formData.name,
        description: formData.description,
        memberEmails
      });

      setFormData({ name: '', description: '', memberEmails: '' });
      setShowCreateForm(false);
      setSuccess('Group created successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchGroups();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleIconRightClick = (e, groupId) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      groupId
    });
  };

  const handleUploadIcon = (groupId) => {
    setContextMenu(null);
    fileInputRef.current.click();
    fileInputRef.current.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const formData = new FormData();
      formData.append('icon', file);
      
      try {
        await api.post(`/groups/${groupId}/icon`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        fetchGroups();
        setSuccess('Group icon updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError(error.response?.data?.error || 'Failed to upload icon');
      }
    };
  };

  if (loading) {
    return (
      <div className="groups-loading">
        <div className="loading-spinner"></div>
        <p>Loading your groups...</p>
      </div>
    );
  }

  return (
    <div className="groups-container">
      <div className="groups-header">
        <div className="header-content">
          <div className="header-text">
            <h1>My Groups</h1>
            <p>Create and manage shared photo collections</p>
          </div>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary btn-create-group"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14m-7-7h14"/>
            </svg>
            Create Group
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="popup-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="popup-modal" onClick={e => e.stopPropagation()}>
            <div className="popup-header">
              <h2>Create New Group</h2>
              <button 
                className="popup-close"
                onClick={() => setShowCreateForm(false)}
              >
                ×
              </button>
            </div>
            
            <div className="popup-content">
              <div className="popup-info">
                Create a shared space where you and your team can upload and view photos together.
              </div>
              
              <form onSubmit={handleCreateGroup} className="popup-form">
                <div className="form-field">
                  <label>Group Name</label>
                  <input
                    type="text"
                    placeholder="Enter group name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    disabled={creating}
                  />
                </div>
                
                <div className="form-field">
                  <label>Description</label>
                  <textarea
                    placeholder="What's this group for? (optional)"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="2"
                    disabled={creating}
                  />
                </div>
                
                <div className="form-field">
                  <label>Member Emails</label>
                  <textarea
                    placeholder="Enter email addresses separated by commas (e.g., user1@example.com, user2@example.com)"
                    value={formData.memberEmails}
                    onChange={(e) => setFormData({...formData, memberEmails: e.target.value})}
                    rows="2"
                    disabled={creating}
                  />
                  <small>Only users who have accounts will be added to the group</small>
                </div>

                {error && (
                  <div className="popup-error">
                    {error}
                  </div>
                )}
                
                <div className="popup-actions">
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => setShowCreateForm(false)}
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-create"
                    disabled={creating}
                  >
                    {creating ? 'Creating...' : 'Create Group'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {groups.length > 0 ? (
        <div className="groups-modern-grid">
          {groups.map(group => (
            <Link key={group.id} to={`/groups/${group.id}`} className="group-folder-card">
              <div className="folder-header">
                <div 
                  className="folder-icon" 
                  onContextMenu={(e) => handleIconRightClick(e, group.id)}
                >
                  {group.icon_url ? (
                    <img src={group.icon_url} alt={group.name} />
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                  )}
                </div>
                <div className="folder-actions">
                  <span className={`role-indicator ${group.user_role}`}>
                    {group.user_role === 'admin' ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 1l3 6 6 3-6 3-3 6-3-6-6-3 6-3z"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    )}
                  </span>
                </div>
              </div>
              
              <div className="folder-content">
                <h3 className="folder-name">{group.name}</h3>
                <p className="folder-description">{group.description || 'No description provided'}</p>
                
                <div className="folder-stats">
                  <div className="stat-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <span>{group.member_count} {group.member_count === 1 ? 'member' : 'members'}</span>
                  </div>
                  <div className="stat-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21,15 16,10 5,21"/>
                    </svg>
                    <span>{group.photo_count || 0} photos</span>
                  </div>
                </div>
              </div>
              
              <div className="folder-hover-overlay">
                <div className="overlay-content">
                  <span className="open-text">Open Folder</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 17l9.2-9.2M17 17V7H7"/>
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-folders-state">
          <div className="empty-folders-illustration">
            <div className="folder-stack">
              <div className="folder-item folder-1">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div className="folder-item folder-2">
                <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div className="folder-item folder-3">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
            </div>
          </div>
          <div className="empty-folders-content">
            <h3>No Shared Folders Yet</h3>
            <p>Create your first shared folder to organize and collaborate on photos with your team. Each folder acts as a private workspace where members can upload, view, and manage photos together.</p>
            <button 
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary btn-create-first"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                <path d="M12 11v6m-3-3h6"/>
              </svg>
              Create Your First Folder
            </button>
          </div>
        </div>
      )}
      {success && (
        <div className="success-popup">
          <div className="success-content">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
            {success}
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
            onClick={() => handleUploadIcon(contextMenu.groupId)}
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

export default Groups;