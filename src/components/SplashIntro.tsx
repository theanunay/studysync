import React, { useEffect } from 'react';
import { motion } from 'motion/react';

export const SplashIntro: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    // End the splash screen after 4.5 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
    >
      {/* Background ambient glows */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full bg-indigo-500/20 blur-[100px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute top-1/4 -right-1/4 w-[400px] h-[400px] rounded-full bg-rose-500/20 blur-[80px]"
        animate={{
          x: [0, -100, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute bottom-1/4 -left-1/4 w-[400px] h-[400px] rounded-full bg-amber-500/20 blur-[80px]"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Main content container */}
      <div className="relative z-10 flex flex-col items-center justify-center perspective-[1000px]">
        {/* Animated Hand / Namaste Emoji */}
        <motion.div
          className="relative group"
          initial={{ scale: 0, rotateX: 60, opacity: 0 }}
          animate={{ scale: 1, rotateX: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 10,
            delay: 0.2
          }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Glowing effect right behind the hands */}
          <motion.div 
            className="absolute inset-0 bg-yellow-400/30 blur-2xl rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          
          <motion.div
            animate={{ 
              y: [0, -15, 0], 
              rotateZ: [0, 3, -3, 0] 
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
            className="text-8xl md:text-9xl filter drop-shadow-[0_0_30px_rgba(255,215,0,0.5)] cursor-default select-none"
          >
            🙏
          </motion.div>
        </motion.div>

        {/* Namaste Text */}
        <motion.div
          className="mt-12 text-center relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1 }}
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-400 to-amber-100 uppercase"
            animate={{ 
              backgroundPosition: ['0% center', '200% center'] 
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            style={{ backgroundSize: '200% auto' }}
          >
            Namaste
          </motion.h1>

          <motion.p
            className="mt-6 text-slate-400 tracking-[0.4em] uppercase text-xs md:text-sm font-light flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
          >
            <span className="w-8 h-[1px] bg-slate-400/50 block"></span>
            Welcome
            <span className="w-8 h-[1px] bg-slate-400/50 block"></span>
          </motion.p>
        </motion.div>

        {/* Floor Reflection effect using mirrored and blurred text */}
        <motion.div 
          className="absolute -bottom-[120px] left-1/2 -translate-x-1/2 w-full h-32 flex justify-center opacity-30 scale-y-[-1] pointer-events-none select-none blur-[4px] bg-gradient-to-t from-slate-950 via-transparent to-transparent blend-mode-screen z-[-1]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 1, duration: 1 }}
          style={{
            WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 100%)',
            maskImage: 'linear-gradient(to top, transparent 0%, black 100%)'
          }}
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-[0.2em] text-amber-300 uppercase">
            Namaste
          </h1>
        </motion.div>
      </div>

      {/* Decorative Grid Lines / Glass overlay */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl border-[1px] border-white/5 m-4 z-20 mix-blend-overlay"></div>
    </motion.div>
  );
}
