import { useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Award, RefreshCw, LogOut, Sparkles, Target, Shield, Brain, Send, Calendar, Clock, User, Phone, Mail, Code, Database, Cpu, Brain as BrainIcon } from 'lucide-react';

export default function Results({ results }) {
  const { score, feedback, is_suspicious, tab_switch_count } = results;
  const [showJobForm, setShowJobForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    role: '',
    daysPerWeek: '',
    dailyTimingFrom: '',
    dailyTimingTo: '',
    weeklyHours: '',
    duration: '',
    joiningDate: '',
    course: '',
    selfRatingReact: 5,
    selfRatingDB: 5,
    selfRatingGenAI: 5,
    selfRatingML: 5,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const getScoreColor = (score) => {
    if (score >= 80) return 'from-green-400 to-emerald-500';
    if (score >= 60) return 'from-blue-400 to-cyan-500';
    if (score >= 40) return 'from-yellow-400 to-orange-500';
    return 'from-red-400 to-pink-500';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-500/10 border-green-500/20 text-green-400';
    if (score >= 60) return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    if (score >= 40) return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
    return 'bg-red-500/10 border-red-500/20 text-red-400';
  };

  const getGrade = (score) => {
    if (score >= 90) return { grade: 'A+', label: 'Outstanding!', color: 'text-green-400' };
    if (score >= 80) return { grade: 'A', label: 'Excellent!', color: 'text-green-400' };
    if (score >= 70) return { grade: 'B', label: 'Good Job!', color: 'text-blue-400' };
    if (score >= 60) return { grade: 'C', label: 'Satisfactory', color: 'text-blue-400' };
    if (score >= 50) return { grade: 'D', label: 'Needs Work', color: 'text-yellow-400' };
    return { grade: 'F', label: 'Keep Trying!', color: 'text-red-400' };
  };

  const gradeInfo = getGrade(score);
  const isPassed = score >= 60;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRatingChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseInt(value)
    }));
  };

  const handleSubmitJobForm = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setFormSubmitting(false);
    setFormSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden font-sans selection:bg-blue-500/30 text-white">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] animate-blob" />
        <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] animate-blob animation-delay-4000" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
        
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-500/30 rounded-full animate-float" />
        <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-purple-500/20 rounded-full animate-float animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-indigo-500/30 rounded-full animate-float animation-delay-4000" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-6 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10 animate-fade-in-up">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${
              isPassed 
                ? 'bg-green-500/10 border border-green-500/20' 
                : 'bg-red-500/10 border border-red-500/20'
            }`}>
              {isPassed ? (
                <>
                  <Sparkles className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm font-medium">Interview Complete</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm font-medium">Interview Incomplete</span>
                </>
              )}
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-white to-purple-400 bg-clip-text text-transparent mb-3 tracking-tight">
              {isPassed ? 'Congratulations! You Passed!' : 'Your Results Are In!'}
            </h1>
            <p className="text-slate-400 text-lg">
              {isPassed 
                ? 'Great job! Now let\'s get you started on your journey.'
                : 'Here\'s how you performed in your AI-powered interview'}
            </p>
          </div>

          {/* Results Card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden ring-1 ring-white/20 animate-fade-in-up animation-delay-200">
            
            {/* Score Section */}
            <div className="relative p-8 text-center border-b border-white/10">
              {/* Animated gradient background behind score */}
              <div className={`absolute inset-0 bg-gradient-to-br ${getScoreColor(score)}/5`} />
              
              {/* Score Circle Animation */}
              <div className="relative inline-block mb-6">
                {/* Outer glow */}
                <div className={`absolute inset-0 bg-gradient-to-r ${getScoreColor(score)} blur-2xl rounded-full opacity-50 animate-pulse`} />
                
                {/* Circle container */}
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="8"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke={`url(#gradient-${score})`}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${score * 2.83} 283`}
                      className="transition-all duration-1000 ease-out"
                      style={{
                        strokeDashoffset: 283 - (score * 2.83),
                      }}
                    />
                    {/* Gradient definition */}
                    <defs>
                      <linearGradient id={`gradient-${score}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Score content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className={`text-5xl font-bold bg-gradient-to-r ${getScoreColor(score)} bg-clip-text text-transparent`}>
                      {score}%
                    </div>
                    <div className={`text-xl font-semibold mt-1 ${gradeInfo.color}`}>
                      Grade: {gradeInfo.grade}
                    </div>
                  </div>
                </div>
              </div>

              {/* Label */}
              <div className="relative">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getScoreBg(score)}`}>
                  {isPassed ? (
                    <Award className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                  <span className="font-medium">{gradeInfo.label}</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Performance Card */}
                <div className="group relative bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-blue-500/30 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-blue-500/20 p-2 rounded-xl">
                        <Brain className="w-5 h-5 text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Performance</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                        <span className="text-slate-400">Overall Score</span>
                        <span className={`font-bold text-lg bg-gradient-to-r ${getScoreColor(score)} bg-clip-text text-transparent`}>
                          {score}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                        <span className="text-slate-400">Grade</span>
                        <span className={`font-bold text-lg ${gradeInfo.color}`}>
                          {gradeInfo.grade}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Behavior Card */}
                <div className={`group relative rounded-2xl p-6 border transition-all duration-300 ${
                  is_suspicious
                    ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                    : 'bg-green-500/5 border-green-500/20 hover:border-green-500/40'
                }`}>
                  <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    is_suspicious ? 'bg-red-500/5' : 'bg-green-500/5'
                  }`} />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`p-2 rounded-xl ${
                        is_suspicious ? 'bg-red-500/20' : 'bg-green-500/20'
                      }`}>
                        {is_suspicious ? (
                          <Shield className="w-5 h-5 text-red-400" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-white">Proctoring</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                        <span className="text-slate-400">Tab Switches</span>
                        <span className={`font-bold text-lg ${
                          tab_switch_count > 3 ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {tab_switch_count}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                        <span className="text-slate-400">Status</span>
                        <span className={`font-semibold px-3 py-1 rounded-full text-sm ${
                          is_suspicious
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {is_suspicious ? 'Flagged' : 'Clean'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Suspicious Warning */}
              {is_suspicious && (
                <div className="mt-6 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl animate-fade-in">
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 bg-red-500 blur-lg rounded-full opacity-50 animate-pulse" />
                      <AlertTriangle className="relative w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h4 className="text-red-400 font-semibold mb-2">Activity Flagged</h4>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        Multiple tab switches were detected during your interview. In a real interview setting, 
                        this behavior could result in disqualification. Consider retaking the interview with 
                        proper focus and environment setup.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Feedback */}
              <div className="mt-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-purple-500/20 p-2 rounded-xl">
                    <BrainIcon className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">AI Feedback</h3>
                </div>
                <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-6 border border-white/10">
                  <div className="relative">
                    <div className="absolute -top-3 -left-2 text-purple-500/30 text-6xl font-serif">"</div>
                    <p className="text-slate-300 leading-relaxed whitespace-pre-line relative z-10 pl-4">
                      {feedback}
                    </p>
                    <div className="absolute -bottom-8 right-0 text-purple-500/30 text-6xl font-serif">"</div>
                  </div>
                </div>
              </div>

              {/* Job Application Form Button (for passed users) */}
              {isPassed && !formSubmitted && (
                <div className="mt-8 p-6 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-2xl border border-green-500/20 animate-fade-in">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-green-500/20 p-3 rounded-xl">
                        <CheckCircle className="w-8 h-8 text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-lg">Ready to Start Your Career?</h3>
                        <p className="text-slate-400 text-sm">Fill out the job application form to proceed</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowJobForm(true)}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-500 hover:to-emerald-500 transition-all duration-300 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:-translate-y-0.5 flex items-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                      Fill Application
                    </button>
                  </div>
                </div>
              )}

              {/* Job Application Form */}
              {showJobForm && isPassed && (
                <div className="mt-8 animate-fade-in">
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-xl">
                        <Send className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">Job Application Form</h3>
                    </div>

                    <form onSubmit={handleSubmitJobForm} className="space-y-6">
                      {/* Personal Information */}
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                            <User className="w-4 h-4 text-blue-400" />
                            Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                            placeholder="Your full name"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                            <Phone className="w-4 h-4 text-green-400" />
                            Phone
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200"
                            placeholder="+91 98765 43210"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                            <Mail className="w-4 h-4 text-purple-400" />
                            Email
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                            placeholder="your@email.com"
                          />
                        </div>
                      </div>

                      {/* Role Selection */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                          <Code className="w-4 h-4 text-yellow-400" />
                          Role
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {['Frontend', 'Backend', 'FullStack', 'AI', 'Figma'].map((role) => (
                            <button
                              key={role}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, role }))}
                              className={`px-4 py-2 rounded-xl border transition-all duration-200 ${
                                formData.role === role
                                  ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Availability */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            Days available/week
                          </label>
                          <input
                            type="number"
                            name="daysPerWeek"
                            value={formData.daysPerWeek}
                            onChange={handleInputChange}
                            min="1"
                            max="7"
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                            placeholder="e.g., 5"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                            <Clock className="w-4 h-4 text-green-400" />
                            Daily timing (from – to)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              name="dailyTimingFrom"
                              value={formData.dailyTimingFrom}
                              onChange={handleInputChange}
                              required
                              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all duration-200"
                            />
                            <span className="text-slate-500">–</span>
                            <input
                              type="time"
                              name="dailyTimingTo"
                              value={formData.dailyTimingTo}
                              onChange={handleInputChange}
                              required
                              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all duration-200"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Hours and Duration */}
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                            <Clock className="w-4 h-4 text-purple-400" />
                            Weekly hours
                          </label>
                          <select
                            name="weeklyHours"
                            value={formData.weeklyHours}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 appearance-none cursor-pointer"
                          >
                            <option value="" className="bg-slate-900">Select hours</option>
                            <option value="15" className="bg-slate-900">15 hours</option>
                            <option value="30" className="bg-slate-900">30 hours</option>
                            <option value="40" className="bg-slate-900">40 hours</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                            <Calendar className="w-4 h-4 text-pink-400" />
                            Duration
                          </label>
                          <select
                            name="duration"
                            value={formData.duration}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all duration-200 appearance-none cursor-pointer"
                          >
                            <option value="" className="bg-slate-900">Select duration</option>
                            <option value="2 months" className="bg-slate-900">2 months</option>
                            <option value="3 months" className="bg-slate-900">3 months</option>
                            <option value="4 months" className="bg-slate-900">4 months</option>
                            <option value="5 months" className="bg-slate-900">5 months</option>
                            <option value="6 months" className="bg-slate-900">6 months</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                            <Calendar className="w-4 h-4 text-cyan-400" />
                            Earliest joining date
                          </label>
                          <input
                            type="date"
                            name="joiningDate"
                            value={formData.joiningDate}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-200"
                          />
                        </div>
                      </div>

                      {/* Course */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                          <Code className="w-4 h-4 text-orange-400" />
                          Course
                        </label>
                        <input
                          type="text"
                          name="course"
                          value={formData.course}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200"
                          placeholder="e.g., Full Stack Development Bootcamp"
                        />
                      </div>

                      {/* Self Ratings */}
                      <div className="space-y-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                          <BrainIcon className="w-4 h-4 text-indigo-400" />
                          How do you rate yourself in each skill (out of 10)?
                        </label>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {[
                            { field: 'selfRatingReact', label: 'React', icon: Code, color: 'blue' },
                            { field: 'selfRatingDB', label: 'Database', icon: Database, color: 'green' },
                            { field: 'selfRatingGenAI', label: 'GenAI', icon: Cpu, color: 'purple' },
                            { field: 'selfRatingML', label: 'ML', icon: BrainIcon, color: 'pink' },
                          ].map((skill) => (
                            <div key={skill.field} className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="flex items-center gap-2 mb-3">
                                <skill.icon className={`w-5 h-5 text-${skill.color}-400`} />
                                <span className="text-white font-medium">{skill.label}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <input
                                  type="range"
                                  min="0"
                                  max="10"
                                  value={formData[skill.field]}
                                  onChange={(e) => handleRatingChange(skill.field, e.target.value)}
                                  className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
                                  style={{
                                    background: `linear-gradient(to right, #3b82f6 ${formData[skill.field] * 10}%, #1e293b ${formData[skill.field] * 10}%)`
                                  }}
                                />
                                <span className={`text-lg font-bold text-${skill.color}-400 w-8 text-center`}>
                                  {formData[skill.field]}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="flex gap-4 pt-4">
                        <button
                          type="submit"
                          disabled={formSubmitting}
                          className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                            formSubmitting
                              ? 'bg-white/10 text-slate-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:-translate-y-0.5'
                          }`}
                        >
                          <span className="flex items-center justify-center gap-2">
                            {formSubmitting ? (
                              <>
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Submitting...
                              </>
                            ) : (
                              <>
                                <Send className="w-5 h-5" />
                                Submit Application
                              </>
                            )}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowJobForm(false)}
                          className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl border border-white/10 transition-all duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {formSubmitted && (
                <div className="mt-8 p-6 bg-green-500/10 border border-green-500/20 rounded-2xl animate-fade-in">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-500 blur-lg rounded-full opacity-50 animate-pulse" />
                      <CheckCircle className="relative w-12 h-12 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-green-400 font-semibold text-xl mb-1">Application Submitted!</h3>
                      <p className="text-slate-300">We'll review your application and get back to you soon.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="group relative w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                      Take Another Interview
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      localStorage.clear();
                      window.location.reload();
                    }}
                    className="group relative w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                      Logout
                    </span>
                  </button>
                </div>
              </div>

              {/* Tips Section */}
              {!showJobForm && (
                <div className="mt-8 p-5 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-5 h-5 text-blue-400" />
                    <h4 className="text-white font-medium">Tips for Next Time</h4>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3 text-sm text-slate-400">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                      <span>Find a quiet, distraction-free environment</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                      <span>Ensure stable internet connection</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                      <span>Keep your camera and microphone on</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                      <span>Stay focused on the interview window</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-slate-500 text-sm animate-fade-in-up animation-delay-400">
            Thank you for using AI Interview Platform
          </div>
        </div>
      </div>

      {/* Custom CSS Animations */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-10px) translateX(-5px); }
          75% { transform: translateY(-15px) translateX(5px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-blob {
          animation: blob 15s infinite;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .animate-float {
          animation: float 8s infinite ease-in-out;
        }
        .animate-pulse {
          animation: pulse 3s infinite;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        /* Custom Range Input Styling */
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.6);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
        }
        
        /* Select dropdown styling */
        select option {
          background: #0f172a;
          color: white;
        }
        
        /* Smooth scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
