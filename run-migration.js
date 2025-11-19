require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Adding icon_url column to groups table...');
    const { error: iconError } = await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS icon_url text;' 
    });
    if (iconError) console.error('Icon column error:', iconError);
    else console.log('✓ Icon column added');

    console.log('Adding mime_type column to photos table...');
    const { error: mimeError } = await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS mime_type text;' 
    });
    if (mimeError) console.error('Mime type column error:', mimeError);
    else console.log('✓ Mime type column added');

    console.log('Adding file_type column to photos table...');
    const { error: typeError } = await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS file_type text CHECK (file_type IN (\'image\', \'video\'));' 
    });
    if (typeError) console.error('File type column error:', typeError);
    else console.log('✓ File type column added');

    console.log('Updating existing photos to have file_type as image...');
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