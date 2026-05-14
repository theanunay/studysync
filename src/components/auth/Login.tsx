import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Lock, Zap, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export function Login({ onBack }: { onBack?: () => void }) {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signIn();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to sign in. Please check if popups are blocked.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-temple-white relative overflow-hidden">
      {onBack && (
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 p-3 rounded-full bg-white dark:bg-slate-900 shadow-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors z-20"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      <div className="absolute inset-0 temple-pattern pointer-events-none opacity-10"></div>
      
      {/* Decorative Ornaments */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-4 border-t-4 border-saffron/20 rounded-tl-3xl m-8"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-4 border-b-4 border-saffron/20 rounded-br-3xl m-8"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl border border-sandstone dark:border-slate-800 text-center space-y-10 relative divine-glow"
      >
        <div className="space-y-4">
          <div className="w-24 h-24 bg-ayodhya-gradient rounded-[2rem] mx-auto flex items-center justify-center shadow-xl shadow-saffron/30 relative transform rotate-3 hover:rotate-0 transition-transform">
            <Shield className="text-white w-12 h-12" />
            <div className="absolute inset-0 border-2 border-white/20 rounded-[2rem] scale-90"></div>
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-saffron text-shadow-saffron">Sanctuary</h1>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">Divine Secure Messaging</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-vermillion/5 border border-vermillion/10 text-vermillion text-xs font-bold rounded-2xl animate-shake">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 text-left">
          <div className="flex items-start gap-4 p-4 bg-sandstone/10 dark:bg-slate-800/50 rounded-3xl border border-sandstone/30">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm text-saffron">
               <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">E2E Shield</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Your messages are sacred and mathematically protected.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 bg-sandstone/10 dark:bg-slate-800/50 rounded-3xl border border-sandstone/30">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm text-saffron">
               <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Instant Soul</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Real-time presence with zero server-side storage.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full py-5 px-6 bg-ayodhya-gradient hover:scale-[1.02] text-white font-bold rounded-2xl shadow-xl shadow-saffron/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              "Enter the Sanctuary"
            )}
          </button>
          
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-8">
            By entering, you accept our divine protocol for data sovereignty and sacred privacy.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
