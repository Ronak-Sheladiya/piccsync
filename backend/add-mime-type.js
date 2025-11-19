require('dotenv').config();
const { supabase } = require('./src/services/supabaseClient');

async function addMimeTypeColumn() {
  try {
    console.log('Adding mime_type column to photos table...');
    
    // Add mime_type column if it doesn't exist
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'photos' AND column_name = 'mime_type'
          ) THEN
            ALTER TABLE photos ADD COLUMN mime_type TEXT;
          END IF;
        END $$;
      `
    });

    if (error) {
      console.error('Error adding column:', error);
      // Try alternative approach
      console.log('Trying alternative approach...');
      const { error: altError } = await supabase
        .from('photos')
        .select('mime_type')
        .limit(1);
      
      if (altError && altError.message.includes('column "mime_type" does not exist')) {
        console.log('Column does not exist. Please run this SQL in Supabase SQL Editor:');
        console.log('ALTER TABLE photos ADD COLUMN mime_type TEXT;');
      }
    } else {
      console.log('✅ mime_type column added successfully');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

addMimeTypeColumn();