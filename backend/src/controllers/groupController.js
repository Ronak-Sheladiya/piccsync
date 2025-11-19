const { supabase } = require('../services/supabaseClient');
const { s3, bucket } = require('../config/r2');
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const createGroup = async (req, res) => {
  try {
    const { name, description, memberEmails } = req.body;
    const userId = req.user.id;

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        name,
        description,
        created_by: userId
      })
      .select()
      .single();

    if (groupError) {
      return res.status(500).json({ error: 'Failed to create group' });
    }

    // Add creator as admin
    await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: userId,
        role: 'admin'
      });

    // Add members by email
    if (memberEmails && memberEmails.length > 0) {
      const { data: users } = await supabase.auth.admin.listUsers();
      const userMap = new Map(users.users.map(u => [u.email, u.id]));
      
      const membersToAdd = memberEmails
        .filter(email => userMap.has(email))
        .map(email => ({
          group_id: group.id,
          user_id: userMap.get(email),
          role: 'member',
          invited_by: userId
        }));

      if (membersToAdd.length > 0) {
        await supabase.from('group_members').insert(membersToAdd);
      }
    }

    res.json(group);
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
};

const getUserGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('group_members')
      .select(`
        role,
        groups!inner (
          id,
          name,
          description,
          created_at
        )
      `)
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch groups' });
    }

    const groupsWithCounts = await Promise.all(
      data.map(async (item) => {
        const { data: memberCount } = await supabase
          .from('group_members')
          .select('id', { count: 'exact' })
          .eq('group_id', item.groups.id);

        return {
          ...item.groups,
          user_role: item.role,
          member_count: memberCount?.length || 0
        };
      })
    );

    res.json(groupsWithCounts);
  } catch (error) {
    console.error('Get user groups error:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
};

const getGroupPhotos = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Check if user is member of the group
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch group photos' });
    }

    const photosWithUrls = await Promise.all(data.map(async photo => {
      try {
        const url = await getSignedUrl(s3, new GetObjectCommand({
          Bucket: bucket,
          Key: photo.r2_key
        }), { expiresIn: 3600 });
        return { 
          ...photo, 
          url,
          uploader_name: 'User'
        };
      } catch (error) {
        console.error(`Failed to generate URL for photo ${photo.id}:`, error.message);
        return { ...photo, url: null, error: 'Failed to load image' };
      }
    }));

    res.json(photosWithUrls);
  } catch (error) {
    console.error('Get group photos error:', error);
    res.status(500).json({ error: 'Failed to fetch group photos' });
  }
};

const getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Check if user is member of the group
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    const { data, error } = await supabase
      .from('group_members')
      .select('id, role, joined_at, user_id')
      .eq('group_id', groupId);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch group members' });
    }

    res.json(data.map(member => ({
      ...member,
      name: `User ${member.user_id.substring(0, 8)}`
    })));
  } catch (error) {
    console.error('Get group members error:', error);
    res.status(500).json({ error: 'Failed to fetch group members' });
  }
};

const addMemberByEmail = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberEmails } = req.body;
    const userId = req.user.id;

    // Check if user is admin of the group
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Only group admins can add members' });
    }

    const { data: users } = await supabase.auth.admin.listUsers();
    const userMap = new Map(users.users.map(u => [u.email, u.id]));
    
    const membersToAdd = memberEmails
      .filter(email => userMap.has(email))
      .map(email => ({
        group_id: groupId,
        user_id: userMap.get(email),
        role: 'member',
        invited_by: userId
      }));

    if (membersToAdd.length === 0) {
      return res.status(400).json({ error: 'No valid users found with provided emails' });
    }

    const { error } = await supabase
      .from('group_members')
      .insert(membersToAdd);

    if (error) {
      return res.status(500).json({ error: 'Failed to add members' });
    }

    res.json({ message: `Added ${membersToAdd.length} members` });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add members' });
  }
};

const addGroupMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId: targetUserId } = req.body;
    const userId = req.user.id;

    // Check if user is admin of the group
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Only group admins can add members' });
    }

    const { error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: targetUserId,
        role: 'member',
        invited_by: userId
      });

    if (error) {
      return res.status(500).json({ error: 'Failed to add member' });
    }

    res.json({ message: 'Member added successfully' });
  } catch (error) {
    console.error('Add group member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
};

const removeGroupMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user.id;

    // Check if user is admin of the group
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Only group admins can remove members' });
    }

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      return res.status(500).json({ error: 'Failed to remove member' });
    }

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove group member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Check if user is admin of the group
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Only group admins can delete groups' });
    }

    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete group' });
    }

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
};

const getGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Check if user is member of the group
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    const { data: group, error } = await supabase
      .from('groups')
      .select('id, name, description, created_by, created_at')
      .eq('id', groupId)
      .single();

    if (error || !group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Get member count
    const { data: memberCount } = await supabase
      .from('group_members')
      .select('id', { count: 'exact' })
      .eq('group_id', groupId);

    res.json({
      ...group,
      user_role: membership.role,
      member_count: memberCount?.length || 0
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
};

const debugGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { data: groups } = await supabase
      .from('groups')
      .select('*');
    
    const { data: members } = await supabase
      .from('group_members')
      .select('*');
    
    res.json({ groups, members, userId });
  } catch (error) {
    console.error('Debug groups error:', error);
    res.status(500).json({ error: 'Debug failed' });
  }
};

const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description } = req.body;
    const userId = req.user.id;

    // Check if user is admin of the group
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Only group admins can update group details' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const { data, error } = await supabase
      .from('groups')
      .update(updateData)
      .eq('id', groupId)
      .select('id, name, description, created_by, created_at')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update group' });
    }

    res.json(data);
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ error: 'Failed to update group' });
  }
};

const uploadGroupIcon = async (req, res) => {
  // Temporarily disabled until icon_url column is added to groups table
  res.status(501).json({ error: 'Icon upload temporarily disabled. Please add icon_url column to groups table.' });
};

module.exports = {
  createGroup,
  getUserGroups,
  getGroup,
  getGroupPhotos,
  addGroupMember,
  addMemberByEmail,
  getGroupMembers,
  removeGroupMember,
  deleteGroup,
  debugGroups,
  updateGroup,
  uploadGroupIcon
};