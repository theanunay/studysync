import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Maximize2 } from 'lucide-react';
import Peer from 'simple-peer';
import { collection, addDoc, onSnapshot, query, where, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface CallOverlayProps {
  chatId: string;
  type: 'voice' | 'video';
  isIncoming?: boolean;
  onClose: () => void;
  incomingSignal?: any;
}

export function CallOverlay({ chatId, type, isIncoming, onClose, incomingSignal }: CallOverlayProps) {
  const { user } = useAuth();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peer, setPeer] = useState<Peer.Instance | null>(null);
  const [callStatus, setCallStatus] = useState<'requesting' | 'ringing' | 'connected' | 'ended'>('requesting');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(type === 'voice');

  const myVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const startMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: type === 'video',
          audio: true
        });
        setStream(mediaStream);
        if (myVideoRef.current) myVideoRef.current.srcObject = mediaStream;

        if (isIncoming && incomingSignal) {
          acceptCall(mediaStream);
        } else {
          initiateCall(mediaStream);
        }
      } catch (err) {
        console.error('Failed to get media', err);
        onClose();
      }
    };

    startMedia();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
      peer?.destroy();
    };
  }, []);

  const initiateCall = (localStream: MediaStream) => {
    const newPeer = new Peer({
      initiator: true,
      trickle: false,
      stream: localStream
    });

    newPeer.on('signal', async (data) => {
      await addDoc(collection(db, 'chats', chatId, 'calls'), {
        callerId: user?.uid,
        type: 'offer',
        signal: JSON.stringify(data),
        timestamp: new Date()
      });
    });

    newPeer.on('stream', (remoteStream) => {
      setRemoteStream(remoteStream);
      setCallStatus('connected');
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    });

    // Listen for answer
    const q = query(collection(db, 'chats', chatId, 'calls'), where('type', '==', 'answer'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          newPeer.signal(JSON.parse(data.signal));
        }
      });
    });

    setPeer(newPeer);
    return unsubscribe;
  };

  const acceptCall = (localStream: MediaStream) => {
    const newPeer = new Peer({
      initiator: false,
      trickle: false,
      stream: localStream
    });

    newPeer.on('signal', async (data) => {
      await addDoc(collection(db, 'chats', chatId, 'calls'), {
        callerId: user?.uid,
        type: 'answer',
        signal: JSON.stringify(data),
        timestamp: new Date()
      });
    });

    newPeer.on('stream', (remoteStream) => {
      setRemoteStream(remoteStream);
      setCallStatus('connected');
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    });

    newPeer.signal(incomingSignal);
    setPeer(newPeer);
    setCallStatus('connected');
  };

  const handleHangup = async () => {
    stream?.getTracks().forEach(track => track.stop());
    peer?.destroy();
    // Cleanup calls collection
    // (In a real app, you'd be more precise)
    onClose();
  };

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (stream && type === 'video') {
      stream.getVideoTracks()[0].enabled = isVideoOff;
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl"
    >
      <div className="relative w-full max-w-4xl aspect-video bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/5 flex flex-col majestic-shadow">
        {/* Main Video Area */}
        <div className="flex-1 relative bg-black flex items-center justify-center">
          {type === 'video' ? (
            <>
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 w-48 aspect-video bg-slate-800 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                <video 
                  ref={myVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover mirror"
                />
              </div>
            </>
          ) : (
             <div className="flex flex-col items-center gap-6">
                <div className="w-32 h-32 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30 animate-pulse">
                   <Phone className="w-12 h-12 text-blue-400" />
                </div>
                <div className="text-center space-y-2">
                   <h2 className="text-2xl font-bold">Calling...</h2>
                   <p className="text-slate-500 text-sm uppercase tracking-widest font-bold">Encrypted Audio Session</p>
                </div>
             </div>
          )}

          {callStatus === 'requesting' && type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md">
               <div className="text-center space-y-4">
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="font-bold text-blue-400 uppercase tracking-widest">Establishing Peer Connection</p>
               </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-8 bg-slate-900/50 backdrop-blur-md border-t border-white/5 flex items-center justify-center gap-6">
          <button 
            onClick={toggleMute}
            className={`p-4 rounded-2xl transition-all ${isMuted ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          
          {type === 'video' && (
            <button 
              onClick={toggleVideo}
              className={`p-4 rounded-2xl transition-all ${isVideoOff ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>
          )}

          <button 
            onClick={handleHangup}
            className="p-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-600/30 transition-all active:scale-95"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
