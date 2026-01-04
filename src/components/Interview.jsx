import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, AlertTriangle, CheckCircle, Mic, MicOff, Video, VideoOff, Maximize, Minimize, MonitorPlay, Clock, ShieldAlert, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

const MAX_TAB_SWITCHES = 3;

export default function Interview({ interviewId, interviewData, onComplete }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [stream, setStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [showStartButton, setShowStartButton] = useState(true);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    generateQuestions();
    startWebcam();
    setupTabDetection();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (showFullscreenPrompt === false && generatedQuestions) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [showFullscreenPrompt, generatedQuestions]);

  const startInterview = async () => {
    try {
      setQuestions(generatedQuestions);
      await enterFullscreen();
      setShowFullscreenPrompt(false);
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
        mediaRecorderRef.current.start(1000);
      }
    } catch (err) {
      console.error('Error starting interview:', err);
      setShowFullscreenPrompt(false);
    }
  };

  const generateQuestions = async () => {
    try {
      const requestBody = {
        jobRole: interviewData.jobRole,
        skillRating: interviewData.skillRating,
      };

      console.log('Sending request to generate-questions:', requestBody);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-questions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error response:', data);
        throw new Error(data.error || `Failed to generate questions: ${response.status} ${response.statusText}`);
      }

      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error('Invalid response format: questions array not found');
      }

      setGeneratedQuestions(data.questions);

      await supabase
        .from('interviews')
        .update({ questions: data.questions })
        .eq('id', interviewId);

      setShowFullscreenPrompt(true);
      setLoading(false);
    } catch (err) {
      console.error('Error generating questions:', err);
      setError(err.message || 'Failed to generate questions. Please try again.');
      setLoading(false);
    }
  };

  const startWebcam = async () => {
    try {
      console.log('Initializing webcam...');
      
      if (stream) {
        console.log('Stopping existing stream...');
        stream.getTracks().forEach(track => track.stop());
      }

      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
      } catch (err) {
        console.error('Error accessing media devices:', err);
        setError('Could not access camera. Please ensure you have granted camera permissions.');
        return;
      }

      const videoTracks = mediaStream.getVideoTracks();
      console.log('Available video tracks:', videoTracks);
      
      if (videoTracks.length === 0) {
        throw new Error('No video tracks available');
      }

      setStream(mediaStream);

      if (videoRef.current) {
        const video = videoRef.current;
        
        video.srcObject = mediaStream;
        video.muted = true;
        video.playsInline = true;
        
        const onLoaded = () => {
          console.log('Video metadata loaded');
          video.play().catch(err => {
            console.error('Error playing video:', err);
            setError('Error playing video stream');
          });
        };
        
        if (video.readyState >= 1) {
          onLoaded();
        } else {
          video.onloadedmetadata = onLoaded;
        }
        
        video.onerror = (e) => {
          console.error('Video playback error:', e);
          console.error('Video error details:', video.error);
          setError('Error playing video stream');
        };
        
        video.onplay = () => {
          console.log('Video is now playing');
          setError('');
        };
      }
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
        } catch (e) {
          console.error('Error stopping previous tracks:', e);
        }
        mediaRecorderRef.current = null;
      }

      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm;codecs=vp8,opus',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        setIsRecording(true);
        recordedChunksRef.current = [];
      };

      mediaRecorder.onstop = () => {
        setIsRecording(false);
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        console.log('Recording complete:', blob.size);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      
    } catch (err) {
      console.error('Webcam error:', err);
      setError('Unable to access webcam. Please grant permission.');
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const toggleVideo = async () => {
    if (!stream) {
      try {
        await startWebcam();
        setIsVideoOn(true);
      } catch (err) {
        console.error('Failed to start webcam:', err);
        setError('Failed to start camera. Please try again.');
      }
      return;
    }

    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      const newState = !videoTrack.enabled;
      videoTrack.enabled = newState;
      setIsVideoOn(newState);
      
      if (!newState) {
        setShowStartButton(true);
      }
    }
  };

  const enterFullscreen = async () => {
    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (err) {
      console.error('Error attempting to enable fullscreen:', err);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
      setIsFullscreen(false);
    } catch (err) {
      console.error('Error attempting to exit fullscreen:', err);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && 
        !document.mozFullScreenElement && 
        !document.webkitFullscreenElement && 
        !document.msFullscreenElement) {
      enterFullscreen();
    } else {
      exitFullscreen();
    }
  };

  const setupTabDetection = useCallback(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          setShowWarning(true);
          
          const warningDuration = newCount >= MAX_TAB_SWITCHES ? 10000 : 5000;
          setTimeout(() => setShowWarning(false), warningDuration);
          
          if (newCount >= MAX_TAB_SWITCHES) {
            // handleSubmit();
          }
          
          return newCount;
        });
      }
    };

    const handleBlur = () => {
      if (document.visibilityState === 'visible') {
        handleVisibilityChange();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const handleNext = () => {
    setAnswers([...answers, currentAnswer]);
    setCurrentAnswer('');

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const allAnswers = [...answers, currentAnswer];

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    try {
      await supabase
        .from('interviews')
        .update({
          answers: allAnswers,
          tab_switch_count: tabSwitchCount,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', interviewId);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/grade-interview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewId,
          questions,
          answers: allAnswers,
          tabSwitchCount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to grade interview');
      }

      onComplete(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse animation-delay-2000" />
          <div className="absolute top-[40%] left-[50%] transform -translate-x-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse animation-delay-4000" />
        </div>

        {/* Loading Card */}
        <div className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center shadow-2xl ring-1 ring-white/20">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
            <div className="relative bg-gradient-to-tr from-blue-500/20 to-purple-500/20 p-6 rounded-2xl border border-white/10 inline-block">
              <MonitorPlay className="w-12 h-12 text-blue-400" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
            Preparing Your Interview
          </h2>
          <p className="text-slate-400 mb-8 max-w-xs mx-auto">
            Generating personalized questions based on your profile
          </p>
          
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  if (showFullscreenPrompt) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center p-4">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px]" />
        </div>

        {/* Prompt Card */}
        <div className="relative z-10 max-w-lg w-full">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl ring-1 ring-white/20">
            <div className="text-center mb-8">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 blur-2xl rounded-full" />
                <div className="relative bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-5 rounded-2xl border border-white/10">
                  <MonitorPlay className="w-14 h-14 text-white" />
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
                Ready to Begin
              </h2>
              <p className="text-slate-400 text-lg">
                Your personalized interview questions are ready
              </p>
            </div>

            {/* Feature List */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="bg-green-500/20 p-2 rounded-lg mr-4">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Questions Generated</h3>
                  <p className="text-slate-400 text-sm">{generatedQuestions?.length} questions tailored for you</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="bg-blue-500/20 p-2 rounded-lg mr-4">
                  <Video className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Video Recording</h3>
                  <p className="text-slate-400 text-sm">Your responses will be recorded for analysis</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="bg-purple-500/20 p-2 rounded-lg mr-4">
                  <ShieldAlert className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Proctoring Active</h3>
                  <p className="text-slate-400 text-sm">Tab switching will be monitored</p>
                </div>
              </div>
            </div>

            <button
              onClick={startInterview}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              Start Interview
            </button>
            
            <p className="text-center text-slate-500 text-sm mt-6">
              Fullscreen mode will be activated automatically
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 bg-white/5 backdrop-blur-xl border border-red-500/20 rounded-3xl p-10 max-w-md w-full shadow-2xl ring-1 ring-white/10">
          <div className="text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-red-500/30 blur-2xl rounded-full" />
              <div className="relative bg-red-500/20 p-5 rounded-2xl border border-red-500/30">
                <AlertTriangle className="w-14 h-14 text-red-400" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">Something Went Wrong</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] animate-blob animation-delay-4000" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
      </div>

      {/* Warning Toast */}
      {showWarning && (
        <div className="fixed top-6 right-6 z-50 animate-fade-in-up">
          <div className="flex items-center gap-4 bg-red-500/10 backdrop-blur-xl border border-red-500/30 px-6 py-4 rounded-2xl shadow-2xl shadow-red-500/20">
            <div className="relative">
              <span className="absolute inset-0 bg-red-500 blur-lg rounded-full opacity-50 animate-pulse" />
              <AlertTriangle className="relative w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Focus Alert</h3>
              <p className="text-red-200 text-sm">
                {tabSwitchCount >= MAX_TAB_SWITCHES 
                  ? 'Maximum warnings reached!' 
                  : `You switched tabs ${tabSwitchCount} time${tabSwitchCount > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6 shadow-xl ring-1 ring-white/10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className={`absolute inset-0 rounded-xl ${isRecording ? 'bg-red-500/30 blur-lg animate-pulse' : 'bg-slate-500/30 blur-lg'} transition-all duration-300`} />
                  <div className="relative bg-white/10 p-3 rounded-xl border border-white/20">
                    <MonitorPlay className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">AI Interview Session</h1>
                  <p className="text-slate-400 text-sm">{interviewData.jobRole} Position</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                {/* Timer */}
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-mono font-medium">{formatTime(elapsedTime)}</span>
                </div>
                
                {/* Recording Status */}
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                  <span className={`relative flex h-3 w-3`}>
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isRecording ? 'bg-red-500' : 'bg-slate-500'} opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${isRecording ? 'bg-red-500' : 'bg-slate-500'}`}></span>
                  </span>
                  <span className="text-white text-sm font-medium">{isRecording ? 'Recording' : 'Paused'}</span>
                </div>
                
                {/* Tab Switch Warning */}
                {tabSwitchCount > 0 && (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                    tabSwitchCount >= MAX_TAB_SWITCHES 
                      ? 'bg-red-500/10 border-red-500/30' 
                      : 'bg-yellow-500/10 border-yellow-500/30'
                  }`}>
                    <AlertTriangle className={`w-5 h-5 ${
                      tabSwitchCount >= MAX_TAB_SWITCHES ? 'text-red-400' : 'text-yellow-400'
                    }`} />
                    <span className={`text-sm font-medium ${
                      tabSwitchCount >= MAX_TAB_SWITCHES ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {tabSwitchCount} / {MAX_TAB_SWITCHES}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Questions Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl ring-1 ring-white/10 overflow-hidden">
                <div className="p-8">
                  {/* Question Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-2 rounded-xl border border-blue-500/30">
                        <span className="text-blue-400 font-bold text-lg">{currentQuestion + 1}</span>
                      </div>
                      <span className="text-slate-400">of</span>
                      <span className="text-white font-semibold text-lg">{questions.length}</span>
                    </div>
                    <div className="text-sm text-slate-400">
                      {Math.round(((currentQuestion + 1) / questions.length) * 100)}% Complete
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 bg-white/10 rounded-full mb-8 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-700 ease-out relative"
                      style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                    >
                      <div className="absolute inset-0 bg-white/30 animate-shimmer" />
                    </div>
                  </div>

                  {/* Question Card */}
                  <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-6 mb-8 border border-white/10">
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-500/20 p-2 rounded-lg">
                        <Sparkles className="w-5 h-5 text-blue-400" />
                      </div>
                      <p className="text-white text-lg leading-relaxed">
                        {questions[currentQuestion]}
                      </p>
                    </div>
                  </div>

                  {/* Answer Input */}
                  <div className="space-y-4">
                    <label htmlFor="answer" className="block text-sm font-medium text-slate-300">
                      Your Response
                    </label>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-0 group-focus-within:opacity-30 transition duration-300 blur" />
                      <textarea
                        id="answer"
                        rows="6"
                        className="relative w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 resize-none"
                        placeholder="Type your answer here..."
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                      />
                      <div className="absolute bottom-4 right-4 text-xs text-slate-500 bg-white/10 px-2 py-1 rounded-lg">
                        {currentAnswer.length} chars
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={handleNext}
                      disabled={!currentAnswer.trim()}
                      className={`relative group px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                        currentAnswer.trim()
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5'
                          : 'bg-white/10 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {currentQuestion === questions.length - 1 ? 'Submit Interview' : 'Next Question'}
                        <svg className={`w-5 h-5 transition-transform duration-300 ${currentAnswer.trim() ? 'group-hover:translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Webcam Section */}
            <div className="lg:col-span-1 space-y-6">
              {/* Webcam Card */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl ring-1 ring-white/10 overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-slate-800/50 to-slate-900/50 flex items-center justify-between border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-medium">Camera Feed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleMute}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-200 border border-white/10 hover:border-white/20"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={toggleVideo}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-200 border border-white/10 hover:border-white/20"
                      title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
                    >
                      {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={toggleFullscreen}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-200 border border-white/10 hover:border-white/20"
                      title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    >
                      {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="relative pt-[56.25%] bg-slate-900 rounded-b-2xl overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      transform: 'scaleX(-1)',
                      display: isVideoOn ? 'block' : 'none'
                    }}
                    onError={(e) => {
                      console.error('Video error:', e);
                      console.error('Video error details:', e.target.error);
                      setError('Failed to load video stream. Please check camera permissions.');
                      setShowStartButton(true);
                    }}
                    onCanPlay={() => {
                      console.log('Video can play');
                      videoRef.current?.play().catch(err => {
                        console.error('Play error:', err);
                        setError('Failed to play video. Please try starting the camera manually.');
                        setShowStartButton(true);
                      });
                    }}
                  />
                  
                  {/* Camera Off Overlay */}
                  {!isVideoOn && showStartButton && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                      <div className="text-center p-8">
                        <div className="relative inline-block mb-6">
                          <div className="absolute inset-0 bg-slate-500/30 blur-2xl rounded-full" />
                          <div className="relative bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
                            <VideoOff className="w-16 h-16 text-slate-500" />
                          </div>
                        </div>
                        <p className="text-slate-400 mb-6 text-lg">Camera is turned off</p>
                        <button
                          onClick={async () => {
                            setShowStartButton(false);
                            setError('');
                            try {
                              await startWebcam();
                              setIsVideoOn(true);
                            } catch (err) {
                              console.error('Failed to start webcam:', err);
                              setError('Failed to start camera. Please try again.');
                              setShowStartButton(true);
                            }
                          }}
                          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25"
                        >
                          Enable Camera
                        </button>
                        {error && (
                          <p className="mt-4 text-sm text-red-400 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">{error}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recording Indicator */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-black/50 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isRecording ? 'bg-red-500' : 'bg-slate-500'} opacity-75`}></span>
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isRecording ? 'bg-red-500' : 'bg-slate-500'}`}></span>
                    </span>
                    <span className="text-white text-sm font-medium">{isRecording ? 'Recording' : 'Paused'}</span>
                  </div>
                </div>

                {/* Tab Switch Warning */}
                {tabSwitchCount > 0 && (
                  <div className={`p-4 border-t ${
                    tabSwitchCount >= MAX_TAB_SWITCHES 
                      ? 'bg-red-500/10 border-red-500/20' 
                      : 'bg-yellow-500/10 border-yellow-500/20'
                  }`}>
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                        tabSwitchCount >= MAX_TAB_SWITCHES ? 'text-red-400' : 'text-yellow-400'
                      }`} />
                      <div>
                        <h3 className={`text-sm font-medium ${
                          tabSwitchCount >= MAX_TAB_SWITCHES ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {tabSwitchCount >= MAX_TAB_SWITCHES
                            ? 'Maximum warnings reached!'
                            : `Tab switched ${tabSwitchCount} time${tabSwitchCount > 1 ? 's' : ''}`}
                        </h3>
                        <p className={`text-xs mt-1 ${
                          tabSwitchCount >= MAX_TAB_SWITCHES ? 'text-red-300/80' : 'text-yellow-300/80'
                        }`}>
                          {tabSwitchCount >= MAX_TAB_SWITCHES
                            ? 'Interview may be flagged for review.'
                            : `Stay focused. (Max ${MAX_TAB_SWITCHES} allowed)`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Summary Card */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl ring-1 ring-white/10">
                <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                  <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
                  Progress Summary
                </h3>
                
                <div className="space-y-6">
                  {/* Questions Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-slate-400 text-sm">Questions Answered</span>
                      <span className="text-white font-semibold">{currentQuestion} / {questions.length}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${(currentQuestion / questions.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Tab Switches */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-slate-400 text-sm">Tab Switches</span>
                      <span className={`font-semibold ${
                        tabSwitchCount >= MAX_TAB_SWITCHES ? 'text-red-400' : 'text-white'
                      }`}>
                        {tabSwitchCount} / {MAX_TAB_SWITCHES}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(MAX_TAB_SWITCHES)].map((_, i) => (
                        <div
                          key={i}
                          className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                            i < tabSwitchCount 
                              ? (i >= MAX_TAB_SWITCHES - 1 
                                  ? 'bg-red-500 shadow-lg shadow-red-500/30' 
                                  : 'bg-yellow-500 shadow-lg shadow-yellow-500/30')
                              : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Answer Length */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-slate-400 text-sm">Current Answer</span>
                      <span className="text-white font-semibold">{currentAnswer.length} chars</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((currentAnswer.length / 2000) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-blob {
          animation: blob 15s infinite;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
