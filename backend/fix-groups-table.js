require('dotenv').config();
const { supabase } = require('./src/services/supabaseClient');

async function fixGroupsTable() {
  try {
    console.log('Checking groups table structure...');
    
    // Try to select with icon_url to see if it exists
    const { data, error } = await supabase
      .from('groups')
      .select('id, name, description, icon_url')
      .limit(1);
    
    if (error) {
      if (error.message.includes('icon_url does not exist')) {
        console.log('❌ icon_url column missing from groups table');
        console.log('\nPlease run this SQL in your Supabase SQL Editor:');
        console.log('\n--- COPY AND PASTE THIS SQL ---\n');
        console.log('ALTER TABLE public.groups ADD COLUMN icon_url text;');
        console.log('\n--- END OF SQL ---\n');
      } else {
        console.error('Other error:', error);
      }
    } else {
      console.log('✓ Groups table structure is correct');
      
      // Test the full query that the API uses
      const { data: testQuery, error: testError } = await supabase
        .from('group_members')
        .select(`
          role,
          groups!inner (
            id,
            name,
            description,
            icon_url,
            created_at
          )
        `)
        .limit(1);
        
      if (testError) {
        console.error('❌ API query error:', testError);
      } else {
        console.log('✓ API query works correctly');
      }
    }
    
  } catch (error) {
    console.error('Fix failed:', error);
  }
}

fixGroupsTable();