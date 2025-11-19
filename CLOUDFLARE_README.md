# Cloudflare Pages + Functions + R2 Deployment

## Setup Steps

### 1. Create Cloudflare Pages Project
1. Go to Cloudflare Dashboard > Pages
2. Connect your GitHub repository
3. Set build command: `cd frontend && npm ci && npm run build`
4. Set build output directory: `frontend/dist`
5. Deploy

### 2. Create R2 Bucket
1. Go to Cloudflare Dashboard > R2 Object Storage
2. Create a new bucket (note the name)
3. Update `wrangler.toml` with your bucket name

### 3. Bind R2 to Pages
1. In Pages project settings > Functions
2. Add R2 bucket binding:
   - Variable name: `MY_BUCKET`
   - R2 bucket: select your bucket

### 4. Add Environment Variables
In Pages project settings > Environment variables:
- `JWT_SECRET`: any secure random string (e.g., `your-super-secret-jwt-key-here`)

### 5. Update wrangler.toml
Replace placeholders in `wrangler.toml`:
- `<project-name>`: your Pages project name
- `<your-bucket-name>`: your R2 bucket name
- Add your account ID

## Local Development

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Run local development with R2 binding
wrangler pages dev frontend --binding MY_BUCKET=<your-bucket-name>
```

## API Testing

### Test Echo Endpoint
```bash
curl https://your-site.pages.dev/api/echo \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Test Login
```bash
curl https://your-site.pages.dev/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@local", "password": "Test@123"}'
```

### Test Token Verification
```bash
curl https://your-site.pages.dev/api/auth/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test File Upload
```bash
curl https://your-site.pages.dev/api/upload \
  -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@image.jpg"
```

### List Uploads
```bash
curl https://your-site.pages.dev/api/list-uploads
```

## Notes

- Pages Functions automatically route `functions/api/*` to `/api/*`
- R2 URLs may require public bucket settings or signed URLs for direct access
- JWT implementation is minimal - replace with production auth for real apps
- Demo credentials: `admin@local` / `Test@123`