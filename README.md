# AI Interview Platform

A modern, full-stack AI-powered interview application where students can upload their resume, select a job role, and take an AI-generated technical interview with real-time proctoring.

## Features

- **Simple Authentication**: Name and email-based login system
- **Resume Upload**: Upload PDF resumes with automatic text extraction
- **Role Selection**: Specify target job role for tailored questions
- **Skill Calibration**: Self-assessment slider to calibrate question difficulty
- **AI Question Generation**: Google Gemini API generates 5 personalized technical interview questions
- **Live Proctoring**:
  - Webcam recording during interview
  - Tab switch detection with warnings
  - Suspicious activity tracking
- **AI Grading**: Automatic evaluation of answers with detailed feedback
- **Results Dashboard**: Comprehensive results with score, feedback, and behavior analysis

## Tech Stack

### Frontend
- React 18 with Vite
- JavaScript (No TypeScript)
- Tailwind CSS for styling
- Lucide React for icons

### Backend
- Supabase Edge Functions (serverless Node.js runtime)
- Supabase Postgres Database
- Supabase Storage for resume PDFs

### AI
- Google Gemini API for question generation and grading

## Project Structure

```
src/
├── components/
│   ├── Login.jsx           # Authentication form
│   ├── ResumeUpload.jsx    # Resume upload and configuration
│   ├── Interview.jsx       # Interview interface with webcam
│   └── Results.jsx         # Results display
├── lib/
│   └── supabase.js         # Supabase client configuration
├── App.jsx                 # Main application with view routing
└── main.jsx               # Application entry point

supabase/functions/
├── auth-user/             # User authentication endpoint
├── parse-resume/          # PDF text extraction
├── generate-questions/    # AI question generation
└── grade-interview/       # AI grading system
```

## Setup Instructions

### 1. Environment Variables

The `.env` file is already configured with Supabase credentials. You need to add your Gemini API key:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**Get a Gemini API Key:**
1. Visit https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key and replace `your_gemini_api_key_here` in `.env`

### 2. Configure Gemini API Key in Supabase

The Gemini API key needs to be set as a secret in Supabase Edge Functions:

1. Go to your Supabase Dashboard
2. Navigate to Edge Functions > Settings
3. Add a new secret:
   - Name: `GEMINI_API_KEY`
   - Value: Your Gemini API key

### 3. Install Dependencies

```bash
npm install
```

### 4. Build the Project

```bash
npm run build
```

## Database Schema

### Users Table
- `id`: Unique user identifier
- `name`: User's full name
- `email`: User's email address
- `created_at`: Account creation timestamp

### Interviews Table
- `id`: Interview identifier
- `user_id`: Foreign key to users
- `resume_text`: Extracted resume content
- `resume_url`: Storage URL for PDF
- `job_role`: Target job position
- `skill_rating`: Self-assessment (1-10)
- `questions`: Array of generated questions
- `answers`: Array of user responses
- `tab_switch_count`: Proctoring metric
- `score`: Final grade (0-100)
- `feedback`: AI-generated feedback
- `is_suspicious`: Behavior flag
- `status`: Interview state (in_progress/completed/graded)

## API Endpoints (Edge Functions)

### POST /auth-user
Authenticate or create a user.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "userId": "uuid",
  "name": "John Doe",
  "email": "john@example.com"
}
```

### POST /parse-resume
Extract text from uploaded PDF resume.

**Request:**
```json
{
  "resumeUrl": "storage-url",
  "fileName": "filename.pdf"
}
```

**Response:**
```json
{
  "resumeText": "extracted text content"
}
```

### POST /generate-questions
Generate interview questions using Gemini AI.

**Request:**
```json
{
  "resumeText": "resume content",
  "jobRole": "Full Stack Developer",
  "skillRating": 7
}
```

**Response:**
```json
{
  "questions": [
    "Question 1?",
    "Question 2?",
    "Question 3?",
    "Question 4?",
    "Question 5?"
  ]
}
```

### POST /grade-interview
Grade interview answers using Gemini AI.

**Request:**
```json
{
  "interviewId": "uuid",
  "questions": ["Q1", "Q2", ...],
  "answers": ["A1", "A2", ...],
  "tabSwitchCount": 2
}
```

**Response:**
```json
{
  "score": 85,
  "feedback": "Detailed feedback...",
  "is_suspicious": false,
  "tab_switch_count": 2
}
```

## How It Works

### 1. Login Flow
- User enters name and email
- System checks if user exists in database
- If new, creates user record
- Stores userId in localStorage for session management

### 2. Resume Upload Flow
- User uploads PDF resume
- File is stored in Supabase Storage
- Edge Function extracts text using pdf-parse
- User selects job role and rates their skills
- Interview record is created in database

### 3. Interview Flow
- Gemini API generates 5 personalized questions based on:
  - Resume content
  - Target job role
  - Self-assessed skill level
- Webcam starts recording (MediaRecorder API)
- Tab switch detection monitors focus
- User answers questions one by one
- Recording stops when complete

### 4. Grading Flow
- Answers and questions sent to Gemini API
- AI evaluates technical accuracy and depth
- Considers tab switch count for suspicious behavior
- Returns score (0-100), feedback, and behavior flag
- Results saved to database and displayed to user

## Security Features

- Row Level Security (RLS) on all database tables
- Users can only access their own data
- Storage policies for resume uploads
- Tab switch detection for proctoring
- Video recording for verification
- API keys secured in environment variables

## Development

```bash
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```

## Important Notes

1. **Gemini API Key**: Must be configured in both `.env` (for frontend display if needed) and Supabase Edge Functions secrets
2. **Webcam Permission**: Browser will request camera/microphone access
3. **Tab Switching**: Switching tabs during interview triggers warnings and affects scoring
4. **Video Recording**: Currently logs to console; extend to upload to storage if needed
5. **PDF Format**: Only PDF resumes are supported for text extraction

## Future Enhancements

- Video upload to Supabase Storage for review
- Email notifications with results
- Interview history and analytics
- Practice mode without proctoring
- Multi-language support
- Custom question pools by industry

## License

MIT

## Support

For issues or questions, please refer to the documentation or create an issue in the repository.
