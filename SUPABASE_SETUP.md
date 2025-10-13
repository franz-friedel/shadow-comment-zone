# Supabase Setup Instructions

## Environment Variables Required

Create a `.env.local` file in the project root with:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## How to Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Go to Settings → API
4. Copy the following values:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

## For Vercel Deployment

Add these environment variables in Vercel:
1. Go to your project settings in Vercel
2. Navigate to Environment Variables
3. Add:
   - `VITE_SUPABASE_URL` = your project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key

## Example .env.local

```bash
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NzI5NzYwMCwiZXhwIjoxOTYyODczNjAwfQ.example-signature
```

## Troubleshooting

- **"Missing env variables" error**: Make sure `.env.local` exists and has the correct variables
- **"Invalid API key" error**: Verify your anon key is correct and not expired
- **CORS errors**: Make sure your Supabase project allows your domain in the CORS settings
