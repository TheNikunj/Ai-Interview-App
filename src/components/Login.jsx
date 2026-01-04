import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const persistUser = (data) => {
    localStorage.setItem("userId", data.userId);
    localStorage.setItem("userName", data.name);
    localStorage.setItem("userEmail", data.email);
    onLogin(data);
  };

  const syncUserProfile = async (user) => {
    if (!user?.email) {
      throw new Error("Google account email is missing");
    }

    const displayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Google User";

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-user`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: displayName, email: user.email }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    persistUser(data);
  };

  const handleExistingSession = async () => {
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("Session error:", sessionError);
      return;
    }
    const sessionUser = data?.session?.user;
    if (sessionUser) {
      setLoading(true);
      try {
        await syncUserProfile(sessionUser);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let subscription;

    handleExistingSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setLoading(true);
          try {
            await syncUserProfile(session.user);
          } catch (err) {
            setError(err.message);
          } finally {
            setLoading(false);
          }
        }
      }
    );

    subscription = listener?.subscription;

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    }
    // On success, Supabase will redirect; loading state will reset after redirect.
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden font-sans selection:bg-blue-500/30 text-white">
      {/* Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob" />
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md animate-fade-in-up">
          
          {/* Glassmorphism Card */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl overflow-hidden ring-1 ring-white/20">
            
            {/* Card Header */}
            <div className="flex flex-col items-center pt-12 pb-8 px-8 text-center">
              {/* Animated Icon Container */}
              <div className="relative mb-6 group cursor-default">
                <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full animate-pulse group-hover:bg-blue-400/40 transition-all duration-700" />
                <div className="relative bg-gradient-to-tr from-white/10 to-white/5 p-5 rounded-2xl border border-white/10 shadow-inner flex items-center justify-center">
                  <User className="w-10 h-10 text-white drop-shadow-lg" strokeWidth={1.5} />
                </div>
              </div>

              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-purple-200 mb-2 tracking-tight">
                AI Interview Platform
              </h1>
              <p className="text-slate-400 text-sm">
                Sign in to access your personalized dashboard
              </p>
            </div>

            {/* Card Body */}
            <div className="px-8 pb-10">
              {/* Error Alert */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-start gap-3 shadow-lg animate-shake backdrop-blur-md">
                  <svg className="w-5 h-5 shrink-0 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Google Login Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="group relative w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-4 px-6 rounded-xl transition-all duration-300 ease-out flex items-center justify-center gap-3 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:border-blue-500/30 hover:-translate-y-0.5"
              >
                {/* Hover Gradient Effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Google Icon SVG */}
                <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>

                <span className="relative z-10 tracking-wide">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Authenticating...
                    </span>
                  ) : "Continue with Google"}
                </span>
              </button>

              {/* Divider */}
              <div className="mt-8 flex items-center gap-4 opacity-30">
                 <div className="h-px w-full bg-gradient-to-r from-transparent to-white"></div>
                 <span className="text-xs uppercase tracking-widest text-slate-400">Or</span>
                 <div className="h-px w-full bg-gradient-to-l from-transparent to-white"></div>
              </div>
              
              <p className="text-center text-xs text-slate-500 mt-6">
                By continuing, you agree to our Terms of Service & Privacy Policy.
              </p>
            </div>
          </div>
          
          {/* Footer Text */}
          <div className="text-center mt-8 animate-fade-in-up animation-delay-200 text-slate-600 text-sm font-medium">
            Secure Authentication powered by Supabase
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
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-blob {
          animation: blob 12s infinite;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
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
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
}
