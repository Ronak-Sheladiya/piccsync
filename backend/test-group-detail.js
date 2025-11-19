require('dotenv').config();
const { supabase } = require('./src/services/supabaseClient');

async function testGroupDetail() {
  try {
    const groupId = '1f9c8edc-e85a-4fcc-8643-753adb6cc73b'; // AMTICS group
    const userId = '737030f8-ede3-4ec2-8a31-50f01ae4496c';
    
    console.log('Testing group detail API...');
    
    // Test membership check
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();
    
    console.log('Membership:', membership);
    
    // Test group query
    const { data: group, error } = await supabase
      .from('groups')
      .select('id, name, description, created_by, created_at')
      .eq('id', groupId)
      .single();
    
    if (error) {
      console.error('❌ Group query error:', error);
      return;
    }
    
    console.log('✓ Group found:', group);
    
    // Test member count
    const { data: memberCount } = await supabase
      .from('group_members')
      .select('id', { count: 'exact' })
      .eq('group_id', groupId);
    
    console.log('✓ Member count:', memberCount?.length || 0);
    
    // Test photos query
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    
    if (photosError) {
      console.error('Photos query error:', photosError);
    } else {
      console.log('✓ Photos found:', photos?.length || 0);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testGroupDetail();