import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Eye, Trash2 } from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, collection, query, onSnapshot, orderBy } from 'firebase/firestore';

export function StatusViewerModal({ 
  statusGroup, 
  onClose,
  formatTimestamp
}: { 
  statusGroup: any; 
  onClose: () => void;
  formatTimestamp: (ts: any) => string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [views, setViews] = useState<any[]>([]);

  const isOwner = auth.currentUser?.uid === statusGroup.userId;
  const currentStatus = statusGroup.updates[currentIndex];

  const handleDelete = async () => {
    if (!currentStatus) return;
    try {
      await deleteDoc(doc(db, 'statusUpdates', currentStatus.id));
      if (statusGroup.updates.length <= 1) {
        onClose();
      } else {
        if (currentIndex === statusGroup.updates.length - 1) {
          setCurrentIndex(currentIndex - 1);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mark as viewed
  useEffect(() => {
    if (!currentStatus || !auth.currentUser) return;
    
    if (!isOwner) {
      setDoc(
        doc(db, 'statusUpdates', currentStatus.id, 'views', auth.currentUser.uid), 
        { timestamp: serverTimestamp() }
      ).catch(console.error);
    }
  }, [currentStatus, isOwner]);

  // Fetch views if owner
  useEffect(() => {
    if (!isOwner || !currentStatus) return;

    const q = query(
      collection(db, 'statusUpdates', currentStatus.id, 'views'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const viewsList = [];
      for (const docSnap of snapshot.docs) {
        const viewerId = docSnap.id;
        try {
          const userDoc = await getDoc(doc(db, 'users', viewerId));
          viewsList.push({
            id: viewerId,
            timestamp: docSnap.data().timestamp,
            user: userDoc.exists() ? userDoc.data() : { displayName: 'Unknown' }
          });
        } catch (err) {
          console.error("Failed to fetch viewer details:", err);
        }
      }
      setViews(viewsList);
    }, (error) => {
      if (error instanceof Error && error.message.includes('permission-denied')) {
        console.warn("Views listener permission denied (status may have been deleted)");
      } else {
        console.error("Views listener error:", error);
      }
    });

    return unsubscribe;
  }, [currentStatus, isOwner]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-sm">
      <div className="absolute inset-x-0 top-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-3">
          <img src={statusGroup.user.photoURL} alt="" className="w-10 h-10 rounded-full bg-slate-800 object-cover" />
          <div className="text-white">
            <p className="font-bold text-sm tracking-wide">{statusGroup.user.displayName}</p>
            <p className="text-[10px] opacity-80 uppercase tracking-wider">{formatTimestamp(currentStatus?.timestamp)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isOwner && (
            <button onClick={handleDelete} className="p-2 text-white hover:bg-white/20 hover:text-red-400 rounded-full transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button onClick={onClose} className="p-2 text-white hover:bg-white/20 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="relative w-full max-w-md h-[100dvh] md:h-[80vh] md:rounded-3xl bg-slate-900 flex items-center justify-center overflow-hidden">
        {currentStatus?.imageUrl ? (
          <div className="relative w-full h-full flex flex-col">
             <img src={currentStatus.imageUrl} alt="Status" className="w-full flex-1 object-contain bg-black" />
             {currentStatus?.content && (
                <div className="absolute bottom-0 inset-x-0 p-8 pt-20 bg-gradient-to-t from-black via-black/80 to-transparent text-center">
                  <p className="text-white text-lg font-medium">{currentStatus.content}</p>
                </div>
             )}
          </div>
        ) : (
          <div className="p-8 text-center text-white text-3xl font-bold bg-ayodhya-gradient w-full h-full flex items-center justify-center flex-col">
            {currentStatus?.content}
          </div>
        )}

        {/* Navigation Indicators */}
        <div className="absolute top-16 inset-x-0 px-2 flex gap-1 z-20">
          {statusGroup.updates.map((_: any, i: number) => (
            <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
               <div className={`h-full bg-white transition-all duration-300 ${i === currentIndex ? 'w-full' : i < currentIndex ? 'w-full opacity-50' : 'w-0'}`} />
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        {currentIndex > 0 && (
          <button 
            onClick={() => setCurrentIndex(i => i - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/20 hover:bg-black/60 rounded-full text-white backdrop-blur-md transition-all z-20"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {currentIndex < statusGroup.updates.length - 1 && (
          <button 
            onClick={() => setCurrentIndex(i => i + 1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/20 hover:bg-black/60 rounded-full text-white backdrop-blur-md transition-all z-20"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Views Panel for Owner */}
      {isOwner && (
        <div className="absolute bottom-0 inset-x-0 md:max-w-md md:left-1/2 md:-translate-x-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-t-3xl max-h-[50vh] overflow-hidden flex flex-col z-30 border border-sandstone/30 dark:border-white/10 shadow-2xl">
          <div className="flex items-center justify-center p-3 shrink-0">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
          </div>
          <div className="px-6 pb-2 shrink-0 flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold border-b border-sandstone/30 dark:border-white/5">
            <Eye className="w-5 h-5 text-saffron" />
            <span>{views.length} views</span>
          </div>
          <div className="overflow-y-auto p-4 space-y-3 flex-1 container-scrollbar">
            {views.map(view => (
              <div key={view.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <img src={view.user.photoURL} alt="" className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 object-cover border border-sandstone/50 dark:border-white/10" />
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{view.user.displayName}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{formatTimestamp(view.timestamp)}</p>
                  </div>
                </div>
              </div>
            ))}
            {views.length === 0 && (
              <p className="text-sm text-center text-slate-500 italic py-8">No mystic visions have seen this yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
