import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, AlertTriangle, CheckCircle, Mic, MicOff, Video, VideoOff, Maximize, Minimize } from 'lucide-react';
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

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  useEffect(() => {
    generateQuestions();
    startWebcam();
    setupTabDetection();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState(null);

  const startInterview = async () => {
    try {
      // First set the questions
      setQuestions(generatedQuestions);
      
      // Then try to enter fullscreen
      await enterFullscreen();
      
      // Hide the fullscreen prompt
      setShowFullscreenPrompt(false);
      
      // Start the interview
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
        mediaRecorderRef.current.start(1000);
      }
    } catch (err) {
      console.error('Error starting interview:', err);
      // If fullscreen fails, still continue with the interview
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

      // Show fullscreen prompt instead of automatically entering fullscreen
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
      
      // Stop any existing stream
      if (stream) {
        console.log('Stopping existing stream...');
        stream.getTracks().forEach(track => track.stop());
      }

      // Try to get user media with basic constraints
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

      // Verify we have video tracks
      const videoTracks = mediaStream.getVideoTracks();
      console.log('Available video tracks:', videoTracks);
      
      if (videoTracks.length === 0) {
        throw new Error('No video tracks available');
      }

      // Set the stream in state
      setStream(mediaStream);

      // Setup video element
      if (videoRef.current) {
        const video = videoRef.current;
        
        // Set the source
        video.srcObject = mediaStream;
        video.muted = true;
        video.playsInline = true;
        
        // When metadata is loaded, play the video
        const onLoaded = () => {
          console.log('Video metadata loaded');
          video.play().catch(err => {
            console.error('Error playing video:', err);
            setError('Error playing video stream');
          });
        };
        
        // If already has metadata, play immediately
        if (video.readyState >= 1) { // HAVE_CURRENT_DATA
          onLoaded();
        } else {
          video.onloadedmetadata = onLoaded;
        }
        
        // Handle any playback errors
        video.onerror = (e) => {
          console.error('Video playback error:', e);
          console.error('Video error details:', video.error);
          setError('Error playing video stream');
        };
        
        // Log when video starts playing
        video.onplay = () => {
          console.log('Video is now playing');
          setError('');
        };
      }
      
      // Clean up existing media recorder if any
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
      mediaRecorder.start(1000); // Request data every second
      
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
        // Show the start button when turning off the camera
        setShowStartButton(true);
      }
    }
  };

  const enterFullscreen = async () => {
    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.mozRequestFullScreen) { /* Firefox */
        await element.mozRequestFullScreen();
      } else if (element.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
        await element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) { /* IE/Edge */
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
      } else if (document.mozCancelFullScreen) { /* Firefox */
        await document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { /* IE/Edge */
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
          
          // Show warning for longer if approaching or exceeding limit
          const warningDuration = newCount >= MAX_TAB_SWITCHES ? 10000 : 5000;
          setTimeout(() => setShowWarning(false), warningDuration);
          
          // If max tab switches reached, show persistent warning
          if (newCount >= MAX_TAB_SWITCHES) {
            // Optionally take action like ending the interview
            // handleSubmit();
          }
          
          return newCount;
        });
      }
    };

    // Add additional event listeners for better detection
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">Generating your interview questions...</p>
        </div>
      </div>
    );
  }

  if (showFullscreenPrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Ready to Start Your Interview</h2>
          <p className="text-gray-600 mb-8">
            Your interview questions are ready. Click the button below to begin.
          </p>
          <button
            onClick={startInterview}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Start Interview
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="text-red-600 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4">
      {showWarning && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-bounce z-50">
          <AlertTriangle className="w-6 h-6" />
          <span className="font-semibold">Focus on the screen!</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="bg-blue-600 text-white px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-semibold">Interview Session</h1>
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-white">
                  <span className="w-2.5 h-2.5 rounded-full mr-2 bg-red-500 animate-pulse"></span>
                  <span>{isRecording ? 'Recording' : 'Paused'}</span>
                </div>
                {tabSwitchCount > 0 && (
                  <div className="flex items-center text-sm px-3 py-1 bg-red-100 text-red-800 rounded-full">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Tab Switches: {tabSwitchCount}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Questions Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">
                    Question {currentQuestion + 1} of {questions.length}
                  </h2>
                  <span className="text-sm font-medium text-blue-600">
                    {Math.round(((currentQuestion + 1) / questions.length) * 100)}% Complete
                  </span>
                </div>

                <div className="h-2 bg-gray-200 rounded-full mb-6">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <p className="text-lg text-gray-800 leading-relaxed">
                    {questions[currentQuestion]}
                  </p>
                </div>

                <div className="space-y-4">
                  <label htmlFor="answer" className="block text-sm font-medium text-gray-700">
                    Your Answer
                  </label>
                  <div className="relative">
                    <textarea
                      id="answer"
                      rows="6"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                      placeholder="Type your answer here..."
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                      {currentAnswer.length} characters
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={handleNext}
                    disabled={!currentAnswer.trim()}
                    className={`px-6 py-2.5 font-medium text-sm leading-tight rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out ${
                      currentAnswer.trim()
                        ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg active:bg-blue-800'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {currentQuestion === questions.length - 1 ? 'Submit Interview' : 'Next Question'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Webcam Section */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-4 bg-gray-800 text-white flex justify-between items-center">
                <h3 className="font-medium flex items-center">
                  <Camera className="w-5 h-5 mr-2" />
                  Webcam
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleMute}
                    className="p-1.5 rounded-full hover:bg-gray-700 transition-colors"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={toggleVideo}
                    className="p-1.5 rounded-full hover:bg-gray-700 transition-colors"
                    title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
                  >
                    {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className="p-1.5 rounded-full hover:bg-gray-700 transition-colors"
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="relative pt-[56.25%] bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    transform: 'scaleX(-1)',
                    backgroundColor: 'black',
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
                {!isVideoOn && showStartButton && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 text-white">
                    <div className="text-center p-6 bg-gray-800 rounded-xl">
                      <VideoOff className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="mb-4 text-lg">Camera is turned off</p>
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
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                      >
                        Start Camera
                      </button>
                      {error && (
                        <p className="mt-3 text-sm text-red-400">{error}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Recording Indicator */}
                <div className="absolute bottom-4 left-4 flex items-center">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                  </span>
                  <span className="ml-2 text-sm font-medium text-white bg-black/50 px-2 py-0.5 rounded-full">
                    {isRecording ? 'Recording' : 'Paused'}
                  </span>
                </div>
              </div>

              {/* Tab Switch Warning */}
              {tabSwitchCount > 0 && (
                <div className="p-3 bg-yellow-50 border-t border-yellow-200">
                  <div className="flex items-start">
                    <AlertTriangle className="flex-shrink-0 h-5 w-5 text-yellow-500 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        {tabSwitchCount >= MAX_TAB_SWITCHES
                          ? 'Warning: Maximum tab switches reached!'
                          : `Tab switched ${tabSwitchCount} time${tabSwitchCount > 1 ? 's' : ''}`}
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        {tabSwitchCount >= MAX_TAB_SWITCHES
                          ? 'Further tab switches may result in interview termination.'
                          : `Please stay on this tab. (Max ${MAX_TAB_SWITCHES} allowed)`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Progress Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <h3 className="font-medium text-gray-800 mb-3">Interview Progress</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Questions Completed</span>
                  <span className="font-medium">{currentQuestion} of {questions.length}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all duration-500" 
                    style={{ width: `${(currentQuestion / questions.length) * 100}%` }}
                  />
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tab Switches</span>
                    <span className={`text-sm font-medium ${
                      tabSwitchCount >= MAX_TAB_SWITCHES ? 'text-red-600' : 'text-gray-800'
                    }`}>
                      {tabSwitchCount} / {MAX_TAB_SWITCHES}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
