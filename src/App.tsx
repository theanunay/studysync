/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { Login } from './components/auth/Login';
import { Main } from './components/Main';
import { NewsLanding } from './components/NewsLanding';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SplashIntro } from './components/SplashIntro';

function AppContent() {
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // If the secret hasn't been triggered, always show the landing page
  if (!showSecret) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <NewsLanding 
          onSecretTrigger={() => setShowSecret(true)} 
          isDarkMode={isDarkMode} 
          onToggleTheme={() => setIsDarkMode(!isDarkMode)} 
        />
      </motion.div>
    );
  }

  // If secret is triggered and user is NOT logged in, show login
  if (!user) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`min-h-screen bg-sandstone dark:bg-slate-950 text-slate-900 dark:text-slate-100`}
      >
        <Login onBack={() => setShowSecret(false)} />
      </motion.div>
    );
  }

  // If secret is triggered and user is logged in, show chat app
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen bg-sandstone dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500`}
    >
      <Main onToggleTheme={() => setIsDarkMode(!isDarkMode)} isDarkMode={isDarkMode} />
    </motion.div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <AuthProvider>
      <ChatProvider>
        <AnimatePresence mode="wait">
          {showSplash ? (
            <SplashIntro key="splash" onComplete={() => setShowSplash(false)} />
          ) : (
            <AppContent key="content" />
          )}
        </AnimatePresence>
      </ChatProvider>
    </AuthProvider>
  );
}
