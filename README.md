# LinkedIn AutoPoster AI - Cloudflare Workers

This project has been migrated to Cloudflare Workers with D1 database for scalable deployment.

## Setup Instructions

### 1. Cloudflare Account Setup
1. Create a Cloudflare account
2. Get your Account ID from the Cloudflare dashboard
3. Create an API token with appropriate permissions

### 2. D1 Database Setup
```bash
# Create D1 database
wrangler d1 create autoposter-db

# Update wrangler.toml with the database ID returned from above command

# Run migrations
npm run db:generate
wrangler d1 migrations apply autoposter-db --local
wrangler d1 migrations apply autoposter-db --remote
```

### 3. Set Secrets
```bash
# Set your API keys as secrets
wrangler secret put GEMINI_API_KEY
wrangler secret put LINKEDIN_CLIENT_ID
wrangler secret put LINKEDIN_CLIENT_SECRET
```

### 4. Local Development
```bash
npm install
npm run dev  # Starts wrangler dev server
```

### 5. Deploy to Production
```bash
npm run deploy
```

## GitHub Actions Deployment

1. Add the following secrets to your GitHub repository:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID
   - `GEMINI_API_KEY`: Your Google Gemini API key

2. Push to main/master branch to trigger automatic deployment

## Environment Variables

Required secrets:
- `GEMINI_API_KEY`: Google Gemini API key for AI content generation
- `LINKEDIN_CLIENT_ID`: LinkedIn OAuth client ID
- `LINKEDIN_CLIENT_SECRET`: LinkedIn OAuth client secret

## Architecture Changes

- **Framework**: Express.js → Hono (Workers-compatible)
- **Database**: PostgreSQL → Cloudflare D1 (SQLite)
- **Deployment**: Traditional server → Cloudflare Workers
- **ORM**: Drizzle ORM with D1 adapter
- **Build**: Vite for client, Workers for server

## API Endpoints

All existing API endpoints remain the same:
- `/api/auth/*` - Authentication
- `/api/user/*` - User management
- `/api/posts/*` - Post management
- `/api/linkedin/*` - LinkedIn integration