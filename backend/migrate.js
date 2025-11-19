require('dotenv').config();
const { supabase } = require('./src/services/supabaseClient');

async function runMigration() {
  try {
    console.log('Running migration to fix image URLs...');
    
    // Clear all stored URLs so they get generated fresh
    const { data: photos, error: fetchError } = await supabase
      .from('photos')
      .select('id, r2_key, url');
    
    if (fetchError) {
      console.error('Error fetching photos:', fetchError);
      return;
    }
    
    console.log(`Found ${photos.length} photos`);
    console.log('Clearing stored URLs to force fresh generation...');
    
    // Clear all URLs so they get generated dynamically
    const { error: clearError } = await supabase
      .from('photos')
      .update({ url: null })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all
    
    if (clearError) {
      console.error('Error clearing URLs:', clearError);
    } else {
      console.log('✅ Cleared all stored URLs');
      console.log('URLs will now be generated fresh on each request');
    }
    
    console.log('Migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();