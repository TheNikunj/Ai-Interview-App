# Quick Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Google Gemini API key
- Supabase account (already configured)

## Step-by-Step Setup

### 1. Get Your Gemini API Key

1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Configure Environment Variables

Open the `.env` file and replace the placeholder:

```env
VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 3. Add Gemini Key to Supabase

**IMPORTANT**: The Edge Functions need access to your Gemini API key.

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Edge Functions** in the sidebar
4. Click on **Settings** or **Secrets**
5. Add a new secret:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Your Gemini API key (same as above)
6. Save the secret

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Application

The application will start automatically. If you need to build:

```bash
npm run build
```

## Testing the Application

### 1. Login
- Enter any name and email
- Click "Continue to Interview"

### 2. Upload Resume
- Prepare a PDF resume
- Click to upload
- Enter a job role (e.g., "Full Stack Developer")
- Set your skill level using the slider
- Click "Generate Interview Questions"

### 3. Take the Interview
- Allow camera/microphone access when prompted
- Answer each question in the text area
- Don't switch tabs (it's being monitored!)
- Click "Next Question" to proceed
- Click "Submit Interview" on the last question

### 4. View Results
- See your score and grade
- Read the AI feedback
- Check if any suspicious behavior was detected
- Take another interview or logout

## Troubleshooting

### Camera Not Working
- Grant browser permission for camera/microphone
- Check if another app is using the camera
- Try a different browser

### Questions Not Generating
- Verify Gemini API key is correct in both places
- Check browser console for errors
- Ensure API key has no extra spaces

### Resume Upload Failing
- Ensure file is PDF format
- File size should be under 10MB
- Check Supabase storage bucket is configured

### Build Errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Ensure Node.js version is 18 or higher

## Features to Test

- [ ] Login with name and email
- [ ] Upload a PDF resume
- [ ] Select a job role
- [ ] Adjust skill rating slider
- [ ] See webcam feed during interview
- [ ] Tab switch warning (try switching tabs!)
- [ ] Answer all 5 questions
- [ ] Submit and see results
- [ ] View score, feedback, and behavior analysis

## API Endpoints for Testing

If you want to test the API directly:

### Authentication
```bash
curl -X POST https://your-project.supabase.co/functions/v1/auth-user \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com"}'
```

### Generate Questions
```bash
curl -X POST https://your-project.supabase.co/functions/v1/generate-questions \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "resumeText":"Sample resume content with skills...",
    "jobRole":"Software Engineer",
    "skillRating":7
  }'
```

## Security Notes

- Never commit `.env` file to git
- Keep your Gemini API key private
- Supabase keys are already in `.env` (safe for frontend use)
- Service role key is only used in Edge Functions

## Need Help?

1. Check browser console for errors (F12)
2. Review Edge Functions logs in Supabase Dashboard
3. Verify all environment variables are set
4. Ensure Gemini API key is valid and has credits

## Architecture Overview

```
Frontend (React + Vite)
    ↓
Supabase Edge Functions (Serverless Backend)
    ↓
├── Supabase Postgres (Database)
├── Supabase Storage (Resume PDFs)
└── Google Gemini API (AI)
```

## Database Already Configured

The following are already set up:
- Users table with RLS policies
- Interviews table with RLS policies
- Storage bucket for resumes
- Storage access policies

## Edge Functions Already Deployed

- `auth-user`: User authentication
- `parse-resume`: PDF text extraction
- `generate-questions`: AI question generation
- `grade-interview`: AI answer grading

Everything is ready to go! Just add your Gemini API key and start using the app.
