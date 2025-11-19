require('dotenv').config();
const { supabase } = require('./src/services/supabaseClient');

console.log('Starting migration...');

async function runMigration() {
  try {
    // Add icon_url column if it doesn't exist
    const { error: iconError } = await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS icon_url text;' 
    });
    if (iconError) console.error('Icon column error:', iconError);
    else console.log('✓ Icon column ready');

    // Add file_type column if it doesn't exist
    const { error: typeError } = await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS file_type text DEFAULT \'image\' CHECK (file_type IN (\'image\', \'video\'));' 
    });
    if (typeError) console.error('File type column error:', typeError);
    else console.log('✓ File type column ready');

    // Update existing photos to have file_type as image
    const { error: updateError } = await supabase.rpc('exec_sql', { 
      sql: 'UPDATE public.photos SET file_type = \'image\' WHERE file_type IS NULL;' 
    });
    if (updateError) console.error('Update error:', updateError);
    else console.log('✓ Existing photos updated');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();