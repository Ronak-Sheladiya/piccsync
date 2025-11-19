# Photo Stash

A full-stack web application for photo storage and management with user authentication, file uploads to Cloudflare R2, and admin capabilities.

## Tech Stack

- **Frontend**: React + Vite, React Router, Axios
- **Backend**: Node.js + Express, Multer, AWS SDK
- **Database/Auth**: Supabase (PostgreSQL + Auth)
- **Storage**: Cloudflare R2 (S3-compatible)

## Features

- User registration and login via Supabase Auth
- Photo upload with public/private visibility
- Photo management (view, delete, toggle visibility)
- Admin panel for managing all users and photos
- Responsive design with mobile support

## Setup Instructions

### 1. Prerequisites

- Node.js 16+ installed
- Supabase account
- Cloudflare account with R2 storage

### 2. Supabase Setup

1. Create a new Supabase project
2. Enable Email authentication in Authentication settings
3. Run this SQL in the SQL Editor to create the photos table:

```sql
create table public.photos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  filename text not null,
  r2_key text not null,
  visibility text not null check (visibility in ('public','private')),
  created_at timestamptz default now()
);

create index on public.photos (user_id);

-- Optional: Add foreign key constraint
-- alter table public.photos add constraint photos_user_id_fkey 
-- foreign key (user_id) references auth.users(id) on delete cascade;
```

4. Get your Supabase URL and keys from Project Settings > API

### 3. Cloudflare R2 Setup

1. Create an R2 bucket in Cloudflare dashboard
2. Generate R2 API tokens with read/write permissions
3. Note your account ID and bucket name
4. Configure public access if you want public photos to be directly accessible

### 4. Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd photo-stash
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### 5. Environment Configuration

#### Backend (.env)
Copy `backend/.env.example` to `backend/.env` and fill in your values:

```env
PORT=4000
CORS_ORIGIN=http://localhost:5173

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudflare R2
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY=your-access-key
R2_SECRET_KEY=your-secret-key
R2_BUCKET=your-bucket-name
R2_PUBLIC_BASE_URL=https://your-bucket.your-account-id.r2.cloudflarestorage.com

# Upload limits
MAX_FILE_SIZE_BYTES=5242880

# Admin config (comma-separated user IDs)
ADMIN_USER_IDS=user-id-1,user-id-2
```

#### Frontend (.env)
Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=http://localhost:4000/api
```

### 6. Running the Application

1. Start the backend:
```bash
cd backend
npm run dev
```

2. Start the frontend (in a new terminal):
```bash
cd frontend
npm run dev
```

3. Open http://localhost:5173 in your browser

### 7. Creating Admin Users

To make a user an admin:

1. Sign up normally through the app
2. Get the user ID from Supabase Auth dashboard
3. Add the user ID to `ADMIN_USER_IDS` in your backend `.env` file
4. Restart the backend server

## API Endpoints

### Authentication
- `POST /api/auth/refresh` - Refresh access token

### Photos
- `POST /api/upload` - Upload a photo
- `GET /api/photos` - Get user's photos
- `GET /api/photos/:id` - Get specific photo
- `PATCH /api/photos/:id` - Update photo visibility
- `DELETE /api/photos/:id` - Delete photo

### Admin (Admin only)
- `GET /api/admin/photos` - Get all photos
- `GET /api/admin/users` - Get all users

## Testing

Run backend tests:
```bash
cd backend
npm test
```

Run frontend tests:
```bash
cd frontend
npm test
```

## Deployment

### Frontend (Cloudflare Pages)

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Deploy the `dist` folder to Cloudflare Pages
3. Set environment variables in Cloudflare Pages dashboard

### Backend (Render/Railway)

1. Deploy to your preferred Node.js hosting service
2. Set all environment variables
3. Update `CORS_ORIGIN` to your frontend URL
4. Update `VITE_API_BASE_URL` in frontend to your backend URL

### Alternative: Cloudflare Workers

For backend deployment to Cloudflare Workers, you'll need to:

1. Install Wrangler CLI
2. Convert Express routes to Workers format
3. Use Cloudflare's environment variables
4. Handle file uploads differently (direct to R2)

## Example API Usage

### Upload a photo
```bash
curl -X POST http://localhost:4000/api/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@photo.jpg" \
  -F "visibility=public"
```

### Get user photos
```bash
curl -X GET http://localhost:4000/api/photos \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Security Notes

- Service role key is only used on the backend
- File type validation prevents non-image uploads
- File size limits prevent abuse
- Rate limiting protects against spam
- Admin access is controlled via environment variables
- Private photos use signed URLs with expiration

## License

MIT