import { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { X, Users } from 'lucide-react';
import { motion } from 'motion/react';

export function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const { createGroupChat } = useChat();
  const [name, setName] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createGroupChat(name, []); // Simple group with just creator for now
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 space-y-6 majestic-shadow"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">New Group Chat</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center py-4">
            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center">
              <Users className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-500">Group Name</label>
            <input 
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Project Avengers"
              className="w-full bg-slate-100 dark:bg-slate-800 py-4 px-6 rounded-2xl outline-none focus:ring-2 ring-indigo-500/20"
            />
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="w-full py-4 bg-indigo-600 disabled:opacity-40 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-indigo-500/20"
        >
          Create Group
        </button>
      </motion.div>
    </div>
  );
}
