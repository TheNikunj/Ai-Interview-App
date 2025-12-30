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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-blue-600 p-4 rounded-full">
            <User className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          AI Interview Platform
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Sign in with Google to start your interview journey
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center gap-2"
        >
          {loading ? "Redirecting..." : "Continue with Google"}
        </button>

        <p className="text-xs text-gray-500 text-center mt-6">
          By continuing, you agree to participate in an AI-powered interview
        </p>
      </div>
    </div>
  );
}
