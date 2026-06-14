import { useState } from "react";
import { isFirebaseConfigured, auth, googleProvider } from "@/src/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { 
  Key, 
  Sparkles, 
  HelpCircle, 
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Volume2,
  Mic,
  Image as ImageIcon
} from "lucide-react";
import { motion } from "motion/react";

interface AuthScreenProps {
  onLoginSuccess: (userId: string, email: string, displayName: string, isGuest: boolean) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [errorOnLogin, setErrorOnLogin] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfigHelp, setShowConfigHelp] = useState(false);

  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured) {
      setErrorOnLogin("Firebase is in local sandbox mode. Please click 'Explore in Guest Sandbox' to begin instantly!");
      return;
    }

    setIsLoading(true);
    setErrorOnLogin(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (user) {
        onLoginSuccess(
          user.uid, 
          user.email || "user@domain.com", 
          user.displayName || "Google Explorer", 
          false
        );
      }
    } catch (err: any) {
      console.error("Login popup failed:", err);
      // Fallback hint for standard iframe popup blocks
      setErrorOnLogin(
        err.message || 
        "Popup requested but blocked. Please check that browser popup permissions are enabled or try using Guest Mode."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = () => {
    setIsLoading(true);
    setTimeout(() => {
      // Setup a random ID and display attributes for guest session
      const randomId = "guest_" + Math.random().toString(36).substring(2, 9);
      onLoginSuccess(randomId, "guest@local.sandbox", "Guest Explorer", true);
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 font-sans transition-colors duration-300">
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setShowConfigHelp(!showConfigHelp)}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full cursor-pointer shadow-sm transition-all"
          title="Setup credentials guide"
        >
          <HelpCircle size={18} />
        </button>
      </div>

      <div className="w-full max-w-md relative">
        {/* Glow Effects */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-2xl animate-pulse" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-2xl animate-pulse" />

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xl overflow-hidden p-8 z-10 relative">
          
          {/* Header Branding */}
          <div className="text-center mb-8">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex p-3.5 bg-gradient-to-tr from-indigo-550 to-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-550/20 mb-4"
              style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)" }}
            >
              <Sparkles size={28} className="animate-pulse" />
            </motion.div>
            
            <h1 className="text-2xl font-sans font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Nimma Mitra
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
              Real-time sentiment-aware dialogue translation powered by Indian voice synthesis
            </p>
          </div>

          {/* Highlights Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="flex items-center space-x-2 p-2.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50 rounded-xl text-xs text-slate-600 dark:text-slate-350">
              <TrendingUp className="text-indigo-500 shrink-0" size={14} />
              <span>Sentiment Metrics</span>
            </div>
            <div className="flex items-center space-x-2 p-2.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50 rounded-xl text-xs text-slate-600 dark:text-slate-350">
              <Mic className="text-emerald-500 shrink-0" size={14} />
              <span>Sarvam Voice STT</span>
            </div>
            <div className="flex items-center space-x-2 p-2.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50 rounded-xl text-xs text-slate-600 dark:text-slate-350">
              <Volume2 className="text-blue-500 shrink-0" size={14} />
              <span>Bulbul TTS Voice</span>
            </div>
            <div className="flex items-center space-x-2 p-2.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50 rounded-xl text-xs text-slate-600 dark:text-slate-350">
              <ImageIcon className="text-indigo-400 shrink-0" size={14} />
              <span>Imagen 3 Graphics</span>
            </div>
          </div>

          {/* Setup Alerts Disclaimer */}
          {(!isFirebaseConfigured || showConfigHelp) && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="mb-6 p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-850 dark:text-amber-300 rounded-xl text-xs space-y-1.5 leading-relaxed"
            >
              <div className="flex items-center space-x-1.5 font-medium">
                <AlertCircle size={14} />
                <span>Sandbox Mode Active</span>
              </div>
              <p>
                Firebase is not configured yet. The application is running in local checkout sandbox mode.
              </p>
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                👉 Click the button "Explore in Guest Sandbox" to enter immediately!
              </p>
            </motion.div>
          )}

          {/* Action Logins */}
          <div className="space-y-3.5">
            {isFirebaseConfigured && (
              <button
                disabled={isLoading}
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center space-x-2.5 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-semibold text-sm rounded-xl transition duration-150 shadow-md cursor-pointer disabled:opacity-55"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isLoading ? "Authenticating..." : "Sign in with Google"}</span>
              </button>
            )}

            <button
              disabled={isLoading}
              onClick={handleGuestMode}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-semibold text-sm rounded-xl border border-slate-200 dark:border-slate-700/60 cursor-pointer shadow-sm transition duration-150"
            >
              <Key size={15} />
              <span>Explore in Guest Sandbox</span>
            </button>
          </div>

          {/* Form Error Message */}
          {errorOnLogin && (
            <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex space-x-2 items-start border border-rose-100 dark:border-rose-900/30">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{errorOnLogin}</span>
            </div>
          )}

          {/* Footer Guidelines */}
          <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800/60 text-center">
            <span className="text-[10px] font-mono tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              Secure Auth & Sync Powered by Firebase
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
