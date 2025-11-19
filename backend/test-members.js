require('dotenv').config();
const { supabase } = require('./src/services/supabaseClient');

async function testMembers() {
  try {
    const groupId = '1f9c8edc-e85a-4fcc-8643-753adb6cc73b'; // AMTICS group
    
    console.log('Testing group members API...');
    
    // Test members query
    const { data: members, error } = await supabase
      .from('group_members')
      .select('id, role, joined_at, user_id')
      .eq('group_id', groupId);
    
    if (error) {
      console.error('❌ Members query error:', error);
      return;
    }
    
    console.log('✅ Members found:', members.length);
    console.log('Members:', members.map(m => ({
      id: m.id,
      role: m.role,
      user_id: m.user_id.substring(0, 8) + '...',
      name: `User ${m.user_id.substring(0, 8)}`
    })));
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testMembers();