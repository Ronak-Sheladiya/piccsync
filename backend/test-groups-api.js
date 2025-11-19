require('dotenv').config();
const { supabase } = require('./src/services/supabaseClient');

async function testGroupsAPI() {
  try {
    console.log('Testing groups API...');
    
    // Get a test user (first user in the system)
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError || !users || users.length === 0) {
      console.log('❌ No users found. Please create a user account first.');
      return;
    }
    
    const testUser = users[0];
    console.log(`Using test user: ${testUser.email} (${testUser.id})`);
    
    // Test direct database query for groups
    const { data: groups, error: groupsError } = await supabase
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
      .eq('user_id', testUser.id);
    
    if (groupsError) {
      console.error('❌ Database query error:', groupsError);
      return;
    }
    
    console.log(`✓ Found ${groups.length} groups for user`);
    
    if (groups.length > 0) {
      console.log('Groups:', groups.map(g => ({
        name: g.groups.name,
        role: g.role,
        id: g.groups.id
      })));
    } else {
      console.log('No groups found for this user. This is why the frontend shows empty.');
      
      // Check if there are any groups at all
      const { data: allGroups } = await supabase
        .from('groups')
        .select('*');
        
      console.log(`Total groups in database: ${allGroups?.length || 0}`);
      
      if (allGroups && allGroups.length > 0) {
        console.log('Available groups:', allGroups.map(g => ({ name: g.name, id: g.id, created_by: g.created_by })));
        
        // Check group members
        const { data: allMembers } = await supabase
          .from('group_members')
          .select('*');
          
        console.log(`Total group members: ${allMembers?.length || 0}`);
        if (allMembers && allMembers.length > 0) {
          console.log('Group members:', allMembers);
        }
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testGroupsAPI();