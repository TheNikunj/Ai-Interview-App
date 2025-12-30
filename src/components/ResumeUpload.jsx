import { useState } from 'react';
import { Upload, FileText, Briefcase } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ResumeUpload({ userId, onNext }) {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobRole, setJobRole] = useState('');
  const [skillRating, setSkillRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setResumeFile(file);
      setError('');
    } else {
      setError('Please upload a PDF file');
      setResumeFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      // Optional: upload resume just for storage; parsing is no longer required.
      let resumeUrl = null;
      if (resumeFile) {
        setUploadProgress('Uploading resume (optional)...');

        const fileName = `${userId}-${Date.now()}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(fileName, resumeFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('resumes')
          .getPublicUrl(fileName);

        resumeUrl = urlData.publicUrl;
      }

      setUploadProgress('Creating interview session...');

      const { data: interview, error: dbError } = await supabase
        .from('interviews')
        .insert({
          user_id: userId,
          resume_text: null,
          resume_url: resumeUrl,
          job_role: jobRole,
          skill_rating: skillRating,
          status: 'in_progress',
        })
        .select()
        .single();

      if (dbError) throw dbError;

      onNext({
        interviewId: interview.id,
        resumeText: null,
        jobRole,
        skillRating,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Prepare Your Interview</h2>
        <p className="text-gray-600 mb-8">Upload your resume and tell us about the role</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Upload Resume (PDF)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="resume-upload"
              />
              <label htmlFor="resume-upload" className="cursor-pointer">
                {resumeFile ? (
                  <div className="flex items-center justify-center gap-3 text-green-600">
                    <FileText className="w-8 h-8" />
                    <span className="font-medium">{resumeFile.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="w-12 h-12 text-gray-400" />
                    <span className="text-gray-600">Click to upload your resume</span>
                    <span className="text-sm text-gray-400">PDF format only</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="jobRole" className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                <span>Target Job Role</span>
              </div>
            </label>
            <input
              id="jobRole"
              type="text"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="e.g., Full Stack Developer, Data Scientist"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How well do you know the skills listed in your resume?
            </label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 w-16">Beginner</span>
              <input
                type="range"
                min="1"
                max="10"
                value={skillRating}
                onChange={(e) => setSkillRating(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-gray-600 w-16">Expert</span>
            </div>
            <div className="text-center mt-3">
              <span className="inline-block bg-blue-100 text-blue-800 font-bold px-4 py-2 rounded-full text-lg">
                {skillRating}/10
              </span>
            </div>
          </div>

          {uploadProgress && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
              {uploadProgress}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            {loading ? 'Processing...' : 'Generate Interview Questions'}
          </button>
        </form>
      </div>
    </div>
  );
}
