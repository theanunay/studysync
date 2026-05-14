import React, { useState, useRef } from 'react';
import { X, Camera, Type, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, storage } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export function StatusModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'start' | 'text' | 'photo'>('start');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setMode('photo');
    }
  };

  const handleSubmit = async () => {
    if (!auth.currentUser) return;
    if (mode === 'text' && !content.trim()) return;
    if (mode === 'photo' && !file) return;

    setLoading(true);
    try {
      let imageUrl = null;

      if (file) {
        const storageRef = ref(storage, `status_images/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        imageUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'statusUpdates'), {
        userId: auth.currentUser.uid,
        content: content.trim() || null,
        imageUrl: imageUrl,
        timestamp: serverTimestamp(),
      });

      onClose();
    } catch (error) {
      console.error('Error adding status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 majestic-shadow overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-xl font-bold">New Status</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0 container-scrollbar">
          <AnimatePresence mode="wait">
            {mode === 'start' && (
              <motion.div 
                key="start"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-3 p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border border-transparent hover:border-indigo-500/30"
                  >
                    <Camera className="w-8 h-8 text-indigo-500" />
                    <span className="font-medium">Photo</span>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                  />
                  <button 
                    onClick={() => setMode('text')}
                    className="flex flex-col items-center gap-3 p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border border-transparent hover:border-indigo-500/30"
                  >
                    <Type className="w-8 h-8 text-indigo-500" />
                    <span className="font-medium">Text</span>
                  </button>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl">
                  <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed">
                    Status updates are ephemeral and disappear after 24 hours. They are currently visible to all authenticated users.
                  </p>
                </div>
              </motion.div>
            )}

            {mode === 'text' && (
              <motion.div 
                key="text"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full space-y-4"
              >
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type a status..."
                  className="w-full h-40 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none focus:ring-2 focus:ring-saffron resize-none"
                  autoFocus
                />
                <button 
                  onClick={handleSubmit} 
                  disabled={loading || !content.trim()}
                  className="w-full bg-ayodhya-gradient text-white py-3 rounded-xl font-bold flex items-center justify-center disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Post Status"}
                </button>
              </motion.div>
            )}

            {mode === 'photo' && (
              <motion.div 
                key="photo"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col space-y-4"
              >
                {previewUrl && (
                  <div className="relative w-full aspect-[3/4] bg-black rounded-xl overflow-hidden max-h-[50vh]">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                )}
                <input
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Add a caption..."
                  className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none focus:ring-2 focus:ring-saffron"
                />
                <button 
                  onClick={handleSubmit} 
                  disabled={loading || !file}
                  className="w-full bg-ayodhya-gradient text-white py-3 rounded-xl font-bold flex items-center justify-center disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Post Status"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
