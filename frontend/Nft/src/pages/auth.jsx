
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error("Google authentication error:", error.message);
      alert(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            Nimiq
          </h1>

          <p className="text-gray-400 mt-2">
            {isLogin
              ? "Welcome back to Nimiq"
              : "Create your Nimiq account"}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8">

          <h2 className="text-2xl font-semibold mb-2">
            {isLogin ? "Log in" : "Sign up"}
          </h2>

          <p className="text-sm text-gray-400 mb-6">
            {isLogin
              ? "Continue with your Google account to access Nimiq."
              : "Create your account using your Google account."}
          </p>

          {/* Google Button */}
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3
                       bg-white text-black font-medium
                       py-3 px-4 rounded-xl
                       hover:bg-gray-200 transition
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Google icon */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21.805 12.23c0-.79-.065-1.55-.2-2.28H12v4.315h5.495a4.7 4.7 0 0 1-2.04 3.09v2.57h3.3c1.93-1.78 3.05-4.4 3.05-7.695Z"
                fill="#4285F4"
              />
              <path
                d="M12 22c2.76 0 5.075-.915 6.765-2.475l-3.3-2.57c-.915.615-2.08.98-3.465.98-2.665 0-4.92-1.8-5.73-4.22H2.86v2.65A10.22 10.22 0 0 0 12 22Z"
                fill="#34A853"
              />
              <path
                d="M6.27 13.715A6.14 6.14 0 0 1 5.95 12c0-.595.105-1.175.32-1.715V7.635H2.86A10.23 10.23 0 0 0 1.78 12c0 1.57.375 3.055 1.08 4.365l3.41-2.65Z"
                fill="#FBBC05"
              />
              <path
                d="M12 6.065c1.5 0 2.845.515 3.905 1.525l2.925-2.925C17.07 2.985 14.755 2 12 2a10.22 10.22 0 0 0-9.14 5.635l3.41 2.65C7.08 7.865 9.335 6.065 12 6.065Z"
                fill="#EA4335"
              />
            </svg>

            {loading
              ? "Connecting..."
              : "Continue with Google"}
          </button>

          {/* Switch Login / Signup */}
          <div className="text-center mt-6 text-sm text-gray-400">
            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}

            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-white font-medium hover:underline"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </div>
        </div>

        {/* Terms */}
        <p className="text-center text-xs text-gray-500 mt-6">
          By continuing, you agree to Nimiq's Terms of Service
          and Privacy Policy.
        </p>

      </div>
    </div>
  );
}
