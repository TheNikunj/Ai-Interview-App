import { useState, useEffect } from 'react';
import Login from './components/Login';
import ResumeUpload from './components/ResumeUpload';
import Interview from './components/Interview';
import Results from './components/Results';

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [userData, setUserData] = useState(null);
  const [interviewData, setInterviewData] = useState(null);
  const [results, setResults] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');

    if (userId && userName && userEmail) {
      setUserData({ userId, name: userName, email: userEmail });
      setCurrentView('upload');
    }
  }, []);

  const handleLogin = (data) => {
    setUserData(data);
    setCurrentView('upload');
  };

  const handleResumeUpload = (data) => {
    setInterviewData(data);
    setCurrentView('interview');
  };

  const handleInterviewComplete = (data) => {
    setResults(data);
    setCurrentView('results');
  };

  return (
    <>
      {currentView === 'login' && <Login onLogin={handleLogin} />}
      {currentView === 'upload' && userData && (
        <ResumeUpload userId={userData.userId} onNext={handleResumeUpload} />
      )}
      {currentView === 'interview' && interviewData && (
        <Interview
          interviewId={interviewData.interviewId}
          interviewData={interviewData}
          onComplete={handleInterviewComplete}
        />
      )}
      {currentView === 'results' && results && <Results results={results} />}
    </>
  );
}

export default App;
