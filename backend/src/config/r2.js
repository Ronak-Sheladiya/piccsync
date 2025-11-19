const { S3Client, HeadBucketCommand } = require('@aws-sdk/client-s3');

// Configure S3 client for Cloudflare R2
const s3 = new S3Client({
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
  region: 'auto',
  forcePathStyle: true
});

const bucket = process.env.R2_BUCKET;
const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL;

console.log('R2 Configuration:');
console.log('- Endpoint:', process.env.R2_ENDPOINT);
console.log('- Bucket:', bucket);
console.log('- Access Key:', process.env.R2_ACCESS_KEY ? 'Set' : 'Missing');
console.log('- Secret Key:', process.env.R2_SECRET_KEY ? 'Set' : 'Missing');
console.log('R2 configured - bucket will be created on first upload if needed');

module.exports = { s3, bucket, publicBaseUrl };