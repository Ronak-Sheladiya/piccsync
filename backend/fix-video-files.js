require('dotenv').config();
const { supabase } = require('./src/services/supabaseClient');

async function fixVideoFiles() {
  try {
    console.log('Fixing video files in database...');
    
    // Get all photos
    const { data: photos, error: fetchError } = await supabase
      .from('photos')
      .select('*');
    
    if (fetchError) {
      console.error('Error fetching photos:', fetchError);
      return;
    }
    
    console.log(`Found ${photos.length} photos to check`);
    
    for (const photo of photos) {
      const filename = photo.filename.toLowerCase();
      let mimeType = photo.mime_type;
      
      // Detect video files and set proper mime type
      if (filename.endsWith('.mp4')) {
        mimeType = 'video/mp4';
      } else if (filename.endsWith('.webm')) {
        mimeType = 'video/webm';
      } else if (filename.endsWith('.mov')) {
        mimeType = 'video/quicktime';
      } else if (filename.endsWith('.avi')) {
        mimeType = 'video/x-msvideo';
      } else if (filename.endsWith('.wmv')) {
        mimeType = 'video/x-ms-wmv';
      } else if (filename.endsWith('.flv')) {
        mimeType = 'video/x-flv';
      } else if (filename.endsWith('.mkv')) {
        mimeType = 'video/x-matroska';
      }
      
      // Update if mime_type is different or null
      if (mimeType !== photo.mime_type) {
        const { error: updateError } = await supabase
          .from('photos')
          .update({ mime_type: mimeType })
          .eq('id', photo.id);
        
        if (updateError) {
          console.error(`Error updating photo ${photo.id}:`, updateError);
        } else {
          console.log(`Updated ${photo.filename} with mime_type: ${mimeType}`);
        }
      }
    }
    
    console.log('✅ Video files fixed successfully');
  } catch (error) {
    console.error('Fix failed:', error);
  }
}

fixVideoFiles();