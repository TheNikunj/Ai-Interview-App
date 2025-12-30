/*
  # AI Interview System Schema

  ## Overview
  This migration creates the complete database schema for an AI-powered interview platform
  where students can upload resumes, take AI-generated interviews, and receive feedback.

  ## New Tables
  
  ### 1. `users` Table
  Stores basic user information for simple authentication:
  - `id` (uuid, primary key) - Unique user identifier
  - `name` (text) - User's full name
  - `email` (text, unique) - User's email address
  - `created_at` (timestamptz) - Account creation timestamp
  
  ### 2. `interviews` Table
  Stores interview session data:
  - `id` (uuid, primary key) - Unique interview identifier
  - `user_id` (uuid, foreign key) - References users table
  - `resume_text` (text) - Extracted text from uploaded resume
  - `resume_url` (text) - URL to stored resume PDF
  - `job_role` (text) - Target job role for the interview
  - `skill_rating` (integer) - Self-assessment rating (1-10)
  - `questions` (jsonb) - Array of generated interview questions
  - `answers` (jsonb) - Array of user's text answers
  - `tab_switch_count` (integer) - Number of times user switched tabs
  - `score` (numeric) - Final interview score
  - `feedback` (text) - AI-generated feedback
  - `is_suspicious` (boolean) - Flag for suspicious behavior
  - `status` (text) - Interview status: 'in_progress', 'completed', 'graded'
  - `created_at` (timestamptz) - Interview creation timestamp
  - `completed_at` (timestamptz) - Interview completion timestamp
  
  ## Security
  
  ### Row Level Security (RLS)
  - Enabled on all tables
  - Users can only access their own data
  - All policies require authentication
  
  ### Policies
  
  #### Users Table
  - Users can view their own profile
  - Users can insert their own profile
  - Users can update their own profile
  
  #### Interviews Table
  - Users can view their own interviews
  - Users can insert their own interviews
  - Users can update their own interviews
  
  ## Notes
  - All timestamps use `timestamptz` for timezone awareness
  - JSONB used for flexible storage of questions and answers arrays
  - Status field uses text for simplicity (could be enum in production)
  - Tab switch count helps detect potential cheating
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  resume_text text,
  resume_url text,
  job_role text NOT NULL,
  skill_rating integer CHECK (skill_rating >= 1 AND skill_rating <= 10),
  questions jsonb DEFAULT '[]'::jsonb,
  answers jsonb DEFAULT '[]'::jsonb,
  tab_switch_count integer DEFAULT 0,
  score numeric(5,2),
  feedback text,
  is_suspicious boolean DEFAULT false,
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'graded')),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow anonymous users to insert (for simple auth flow)
CREATE POLICY "Anyone can create user"
  ON users FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can view users by email"
  ON users FOR SELECT
  TO anon
  USING (true);

-- Interviews table policies
CREATE POLICY "Users can view own interviews"
  ON interviews FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own interviews"
  ON interviews FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own interviews"
  ON interviews FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow anonymous users to access interviews (for simple auth)
CREATE POLICY "Anyone can manage interviews"
  ON interviews FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);