import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { Search, X, UserPlus, Shield } from 'lucide-react';
import { motion } from 'motion/react';

export function SearchModal({ onClose }: { onClose: () => void }) {
  const { user: currentUser } = useAuth();
  const { createPrivateChat, addContact } = useChat();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const performSearch = async () => {
      if (!searchTerm || searchTerm.length < 3) {
        setResults([]);
        return;
      }

      setSearching(true);
      try {
        const q = query(
          collection(db, 'users'),
          where('displayName', '>=', searchTerm),
          where('displayName', '<=', searchTerm + '\uf8ff'),
          limit(5)
        );
        const snap = await getDocs(q);
        const users = snap.docs
          .map(doc => doc.data())
          .filter(u => u.uid !== currentUser?.uid);
        setResults(users);
      } catch (e) {
        console.error(e);
      } finally {
        setSearching(false);
      }
    };

    const timeout = setTimeout(performSearch, 500);
    return () => clearTimeout(timeout);
  }, [searchTerm, currentUser]);

  const handleStartChat = async (user: any) => {
    await addContact(user);
    await createPrivateChat(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden majestic-shadow"
      >
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">New Secure Chat</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name..."
              className="w-full bg-slate-100 dark:bg-slate-800 py-4 pl-12 pr-4 rounded-2xl outline-none focus:ring-2 ring-indigo-500/20"
            />
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {searching ? (
              <div className="p-12 text-center text-slate-400 text-sm">Searching...</div>
            ) : results.length > 0 ? (
              results.map((u) => (
                <button
                  key={u.uid}
                  onClick={() => handleStartChat(u)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <img src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`} className="w-10 h-10 rounded-xl" alt="" />
                    <div className="text-left">
                      <p className="font-semibold">{u.displayName}</p>
                      <div className="flex items-center gap-1 text-[10px] text-indigo-500 font-bold uppercase tracking-wider">
                         <Shield className="w-3 h-3" />
                         E2EE Verified
                      </div>
                    </div>
                  </div>
                  <UserPlus className="w-5 h-5 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))
            ) : searchTerm.length >= 3 ? (
              <div className="p-12 text-center text-slate-400 text-sm">No users found</div>
            ) : (
              <div className="p-12 text-center text-slate-400 text-sm italic">
                Enter at least 3 characters to search
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
