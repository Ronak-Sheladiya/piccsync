require('dotenv').config();
const { supabase } = require('./src/services/supabaseClient');
const { s3, bucket } = require('./src/config/r2');
const { HeadObjectCommand } = require('@aws-sdk/client-s3');

async function checkPhotos() {
  try {
    console.log('Checking photo integrity...');
    
    const { data: photos, error } = await supabase
      .from('photos')
      .select('id, filename, r2_key');
    
    if (error) {
      console.error('Error fetching photos:', error);
      return;
    }
    
    console.log(`Checking ${photos.length} photos...`);
    
    const brokenPhotos = [];
    
    for (const photo of photos) {
      try {
        await s3.send(new HeadObjectCommand({
          Bucket: bucket,
          Key: photo.r2_key
        }));
        console.log(`✅ ${photo.filename} - OK`);
      } catch (error) {
        console.log(`❌ ${photo.filename} - BROKEN (${error.name})`);
        brokenPhotos.push(photo);
      }
    }
    
    if (brokenPhotos.length > 0) {
      console.log(`\nFound ${brokenPhotos.length} broken photos:`);
      brokenPhotos.forEach(photo => {
        console.log(`- ${photo.filename} (ID: ${photo.id})`);
      });
      
      console.log('\nTo remove broken photos, run: node remove-broken-photos.js');
    } else {
      console.log('\n✅ All photos are intact!');
    }
    
  } catch (error) {
    console.error('Check failed:', error);
  }
}

checkPhotos();