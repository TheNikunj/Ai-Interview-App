# Code Structure Guide

This document explains the organization and key files in the AI Interview Platform.

## Directory Structure

```
project/
├── src/
│   ├── components/          # React components
│   │   ├── Login.jsx
│   │   ├── ResumeUpload.jsx
│   │   ├── Interview.jsx
│   │   └── Results.jsx
│   ├── lib/
│   │   └── supabase.js      # Supabase client configuration
│   ├── App.jsx              # Main app with routing logic
│   ├── main.jsx             # React entry point
│   └── index.css            # Tailwind CSS
├── supabase/
│   └── functions/           # Edge Functions (Backend API)
│       ├── auth-user/
│       ├── parse-resume/
│       ├── generate-questions/
│       └── grade-interview/
├── index.html
├── package.json
├── .env                     # Environment variables
└── vite.config.js
```

## Frontend Components

### src/App.jsx
**Purpose**: Main application component with view routing logic

**Key Features**:
- Manages application state (user, interview data, results)
- Handles view transitions (login → upload → interview → results)
- Persists user session in localStorage
- Routes between different components based on current view

**State Variables**:
```javascript
currentView    // 'login', 'upload', 'interview', 'results'
userData       // { userId, name, email }
interviewData  // { interviewId, resumeText, jobRole, skillRating }
results        // { score, feedback, is_suspicious, tab_switch_count }
```

### src/components/Login.jsx
**Purpose**: User authentication interface

**Features**:
- Simple name + email form
- Calls `/auth-user` Edge Function
- Stores userId in localStorage
- Handles loading and error states

**Key Functions**:
```javascript
handleSubmit()  // Submits login form, calls API, stores session
```

### src/components/ResumeUpload.jsx
**Purpose**: Resume upload and interview configuration

**Features**:
- PDF file upload with validation
- Job role text input
- Skill rating slider (1-10)
- Uploads resume to Supabase Storage
- Calls `/parse-resume` to extract text
- Creates interview record in database

**Key Functions**:
```javascript
handleFileChange()  // Validates PDF file
handleSubmit()     // Uploads resume, extracts text, creates interview
```

**Flow**:
1. User selects PDF → validates format
2. User enters job role and skill rating
3. On submit → uploads to Storage
4. Calls parse-resume Edge Function
5. Creates interview record with extracted text
6. Transitions to interview view

### src/components/Interview.jsx
**Purpose**: Main interview interface with proctoring

**Features**:
- Generates questions via Gemini API
- Displays questions one at a time
- Webcam video feed with recording
- Tab switch detection and warnings
- Answer collection
- Submit to grading API

**Key State**:
```javascript
questions           // Array of 5 questions from Gemini
currentQuestion     // Current question index (0-4)
answers            // Array of user answers
currentAnswer      // Current answer text
tabSwitchCount     // Number of tab switches
stream             // MediaStream from webcam
```

**Key Functions**:
```javascript
generateQuestions()      // Calls /generate-questions Edge Function
startWebcam()           // Initializes camera and recording
setupTabDetection()     // Monitors tab switches
handleNext()            // Saves answer, moves to next question
handleSubmit()          // Submits all answers for grading
```

**Proctoring Features**:
- MediaRecorder captures video during interview
- visibilitychange event detects tab switches
- Warning displayed when user leaves tab
- Tab switch count sent to grading API

### src/components/Results.jsx
**Purpose**: Display interview results and feedback

**Features**:
- Score display with color coding
- Grade calculation (A+ to F)
- AI feedback presentation
- Behavior analysis (tab switches)
- Suspicious activity warning
- Options to retake or logout

**Grade Scale**:
```javascript
90-100: A+
80-89:  A
70-79:  B
60-69:  C
50-59:  D
0-49:   F
```

### src/lib/supabase.js
**Purpose**: Supabase client singleton

**Usage**:
```javascript
import { supabase } from '../lib/supabase';

const { data, error } = await supabase
  .from('interviews')
  .select('*')
  .eq('id', interviewId);
```

## Backend (Edge Functions)

All Edge Functions follow the same structure:
1. CORS headers for browser access
2. OPTIONS request handling
3. Request validation
4. Business logic
5. Response with proper headers

### auth-user/index.ts
**Purpose**: User authentication and creation

**Logic**:
```javascript
1. Receive { name, email }
2. Check if user exists with email
3. If exists → return existing user
4. If new → create user record
5. Return { userId, name, email }
```

**Database**:
```sql
SELECT * FROM users WHERE email = ?
-- or --
INSERT INTO users (name, email) VALUES (?, ?)
```

### parse-resume/index.ts
**Purpose**: Extract text from PDF resume

**Dependencies**:
- `pdf-parse`: NPM package for PDF text extraction

**Logic**:
```javascript
1. Receive { resumeUrl, fileName }
2. Download file from Supabase Storage
3. Convert to buffer
4. Extract text using pdf-parse
5. Return { resumeText }
```

**Key APIs**:
```javascript
supabase.storage.from('resumes').download(fileName)
pdfParse(buffer)  // Returns { text, numpages, info }
```

### generate-questions/index.ts
**Purpose**: Generate interview questions using Gemini AI

**Gemini Prompt Strategy**:
```
- Include resume content (first 2000 chars)
- Specify job role and skill level
- Request exactly 5 questions
- Ask for JSON array format
- Calibrate difficulty to skill rating
```

**Logic**:
```javascript
1. Receive { resumeText, jobRole, skillRating }
2. Build prompt with context
3. Call Gemini API
4. Parse JSON response
5. Validate 5 questions returned
6. Fallback to default questions if parsing fails
7. Return { questions: [] }
```

**Error Handling**:
- Tries to extract JSON from response text
- Falls back to generic questions if AI fails
- Ensures exactly 5 questions always returned

### grade-interview/index.ts
**Purpose**: Grade interview answers using Gemini AI

**Gemini Prompt Strategy**:
```
- Provide all Q&A pairs
- Include tab switch count
- Request score (0-100)
- Request detailed feedback
- Request suspicious behavior flag
```

**Logic**:
```javascript
1. Receive { interviewId, questions, answers, tabSwitchCount }
2. Format Q&A pairs for prompt
3. Call Gemini API with grading instructions
4. Parse JSON response { score, feedback, is_suspicious }
5. Update interview record in database
6. Return grading results
```

**Grading Factors**:
- Technical accuracy of answers
- Depth and detail of responses
- Tab switch count (3+ is suspicious)
- Overall understanding demonstrated

**Database Update**:
```sql
UPDATE interviews SET
  score = ?,
  feedback = ?,
  is_suspicious = ?,
  status = 'graded'
WHERE id = ?
```

## Database Schema

### users
```sql
id           uuid PRIMARY KEY
name         text NOT NULL
email        text UNIQUE NOT NULL
created_at   timestamptz DEFAULT now()
```

### interviews
```sql
id                uuid PRIMARY KEY
user_id           uuid REFERENCES users(id)
resume_text       text
resume_url        text
job_role          text NOT NULL
skill_rating      integer CHECK (1-10)
questions         jsonb DEFAULT '[]'
answers           jsonb DEFAULT '[]'
tab_switch_count  integer DEFAULT 0
score             numeric(5,2)
feedback          text
is_suspicious     boolean DEFAULT false
status            text CHECK ('in_progress', 'completed', 'graded')
created_at        timestamptz DEFAULT now()
completed_at      timestamptz
```

## Data Flow

### 1. Login Flow
```
User Input → Login.jsx
    ↓
POST /auth-user
    ↓
Supabase: users table
    ↓
Response → localStorage
    ↓
App.jsx → setCurrentView('upload')
```

### 2. Resume Upload Flow
```
PDF File → ResumeUpload.jsx
    ↓
Supabase Storage: resumes bucket
    ↓
POST /parse-resume
    ↓
pdf-parse library
    ↓
Create interview record
    ↓
App.jsx → setCurrentView('interview')
```

### 3. Question Generation Flow
```
Interview.jsx → useEffect
    ↓
POST /generate-questions
    ↓
Gemini API
    ↓
Parse JSON response
    ↓
Update interviews.questions
    ↓
Display questions
```

### 4. Interview Flow
```
User answers → Interview.jsx state
Webcam → MediaRecorder → recording
Tab switches → visibilitychange listener
    ↓
Submit button → handleSubmit()
    ↓
POST /grade-interview
    ↓
Gemini API evaluation
    ↓
Update interviews table
    ↓
App.jsx → setCurrentView('results')
```

## Key Design Patterns

### 1. Serverless Architecture
- No Express server needed
- Edge Functions auto-scale
- Database handled by Supabase

### 2. State Management
- React useState for component state
- localStorage for session persistence
- Prop drilling for data flow (simple enough)

### 3. API Integration
- Fetch API for Edge Functions
- Supabase client for database
- Direct Gemini API calls from Edge Functions

### 4. Error Handling
```javascript
try {
  // API call
} catch (err) {
  setError(err.message);
  // Display to user
}
```

### 5. Loading States
```javascript
const [loading, setLoading] = useState(false);

setLoading(true);
await apiCall();
setLoading(false);
```

## Environment Variables

```env
VITE_SUPABASE_URL           # Supabase project URL
VITE_SUPABASE_ANON_KEY      # Public anon key (safe for frontend)
VITE_GEMINI_API_KEY         # Gemini API key (optional in frontend)
```

**Edge Functions Environment** (Auto-configured):
```env
SUPABASE_URL                # Auto-available in Edge Functions
SUPABASE_SERVICE_ROLE_KEY   # Auto-available in Edge Functions
GEMINI_API_KEY              # Must be set manually in Supabase Dashboard
```

## Security Considerations

### Frontend
- Anon key is safe to expose (RLS protects data)
- User session in localStorage (simple auth)
- Client-side validation for UX

### Backend
- Service role key never exposed to frontend
- RLS policies enforce data access
- Edge Functions validate all inputs
- CORS headers configured properly

### Database
- Row Level Security on all tables
- Users can only access own data
- Foreign key constraints
- Check constraints on ratings

## Extending the Application

### Add New Question Types
Edit `generate-questions/index.ts`:
```javascript
// Add to prompt
"Include X type of questions..."
```

### Change Grading Criteria
Edit `grade-interview/index.ts`:
```javascript
// Modify prompt
"Focus on X when grading..."
```

### Add More User Fields
1. Update `users` table schema
2. Update Login.jsx form
3. Update auth-user Edge Function

### Store Video Recordings
1. Upload blob to Supabase Storage in Interview.jsx
2. Store URL in interviews table
3. Display in Results or admin panel

## Common Modifications

### Change Number of Questions
Search for `5` and update to desired number in:
- generate-questions/index.ts (prompt and validation)
- Interview.jsx (question loop logic)

### Adjust Skill Rating Range
Update in:
- ResumeUpload.jsx (slider min/max)
- Database schema (CHECK constraint)
- generate-questions/index.ts (prompt)

### Customize Styling
All components use Tailwind CSS:
```javascript
className="bg-blue-600 text-white px-4 py-2 rounded-lg"
```

## Testing Tips

1. **Test with different resumes**: Upload various PDFs to test parsing
2. **Test tab switching**: Verify warning shows and count increases
3. **Test with different skill ratings**: See if question difficulty adapts
4. **Test error cases**: Try without internet, invalid PDFs, etc.
5. **Check Edge Functions logs**: Supabase Dashboard → Edge Functions → Logs

## Performance Considerations

- Resume parsing can take 5-10 seconds for large PDFs
- Gemini API calls take 2-5 seconds each
- Video recording uses browser memory (may impact long interviews)
- Consider pagination for interview history (not yet implemented)

---

This structure provides a clear separation of concerns and makes the codebase easy to understand and extend.
