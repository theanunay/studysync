import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Image, Smile, Paperclip, MoreVertical, ShieldCheck, Check, CheckCheck, Phone, Video, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { CallOverlay } from './CallOverlay';

export function ChatView({ onToggleInfo }: { onToggleInfo: () => void }) {
  const { activeChat, setActiveChat, messages, sendMessage, typingStatus, setTyping } = useChat();
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isSelfTyping, setIsSelfTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeCall, setActiveCall] = useState<{ type: 'voice' | 'video' } | null>(null);

  const startCall = (type: 'voice' | 'video') => {
    setActiveCall({ type });
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    
    if (!isSelfTyping) {
      setIsSelfTyping(true);
      setTyping(true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsSelfTyping(false);
      setTyping(false);
    }, 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    
    const text = inputText;
    setInputText('');
    setIsSelfTyping(false);
    setTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    await sendMessage(text);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="p-4 bg-white/60 dark:bg-slate-900/80 backdrop-blur-md border-b border-sandstone dark:border-slate-800 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveChat(null)}
            className="md:hidden p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:text-saffron transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-ayodhya-gradient rounded-xl overflow-hidden flex items-center justify-center font-bold text-white shadow-lg shadow-saffron/20 border border-gold/30">
             {activeChat?.type === 'group' ? activeChat.name?.[0] : (
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChat?.id}`} alt="" />
             )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">{activeChat?.type === 'group' ? activeChat.name : 'Divine Soul Session'}</h2>
            <div className="flex items-center gap-1.5 h-3">
              {Object.entries(typingStatus).filter(([uid, isTyping]) => isTyping && uid !== user?.uid).length > 0 ? (
                <div className="flex items-center gap-1 text-[9px] text-saffron font-bold uppercase tracking-widest animate-pulse">
                  <div className="w-1 h-1 bg-saffron rounded-full"></div>
                  Presence is forming...
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[9px] text-saffron font-bold uppercase tracking-widest opacity-70">
                  <div className="w-1.5 h-1.5 bg-saffron rounded-full shadow-[0_0_8px_rgba(255,153,51,0.6)]"></div>
                  Sacred E2EE
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button className="p-2 hover:bg-saffron/10 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-saffron transition-colors">
            <Phone className="w-5 h-5" onClick={() => startCall('voice')} />
          </button>
           <button className="p-2 hover:bg-saffron/10 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-saffron transition-colors">
            <Video className="w-5 h-5" onClick={() => startCall('video')} />
          </button>
           <div className="w-px h-6 bg-sandstone dark:bg-slate-800 mx-1"></div>
           <button className="p-2 hover:bg-saffron/10 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-saffron transition-colors">
            <MoreVertical className="w-5 h-5" onClick={onToggleInfo} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-temple-white/30 dark:bg-slate-900 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
        <div className="flex justify-center mb-8">
          <span className="px-4 py-1.5 bg-white/80 dark:bg-slate-800/80 rounded-full text-[9px] text-saffron uppercase font-bold tracking-[0.2em] border border-sandstone dark:border-white/5 backdrop-blur-sm shadow-sm divine-glow">Divine Communication Channel</span>
        </div>
        
        {messages.map((msg, i) => (
          <MessageItem 
            key={msg.id} 
            message={msg} 
            isMe={msg.senderId === user?.uid} 
            showAvatar={i === 0 || messages[i-1].senderId !== msg.senderId}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <footer className="p-4 bg-white/40 dark:bg-slate-900 border-t border-sandstone dark:border-slate-800 backdrop-blur-md">
        <div className="max-w-4xl mx-auto">
          <form 
            onSubmit={handleSend}
            className="bg-white/80 dark:bg-slate-800/40 border border-sandstone dark:border-slate-700/50 rounded-2xl p-1.5 flex items-center gap-2 backdrop-blur-sm shadow-lg ring-1 ring-black/5"
          >
            <button type="button" className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-sandstone/30 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <button type="button" className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-sandstone/30 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 transition-colors">
              <Smile className="w-5 h-5" />
            </button>
            <input 
              autoFocus
              value={inputText}
              onChange={handleTyping}
              placeholder="Write a sacred message..."
              className="flex-1 bg-transparent px-2 py-3 outline-none text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            />
            <button 
              type="submit"
              disabled={!inputText.trim()}
              className="w-10 h-10 bg-ayodhya-gradient disabled:opacity-30 flex items-center justify-center rounded-xl text-white shadow-lg shadow-saffron/20 transition-all active:scale-95 hover:scale-105"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </footer>

      <AnimatePresence>
        {activeCall && activeChat && (
          <CallOverlay 
            chatId={activeChat.id} 
            type={activeCall.type} 
            onClose={() => setActiveCall(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MessageItem({ message, isMe, showAvatar }: { message: any, isMe: boolean, showAvatar: boolean, key?: any }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className={`w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-sandstone dark:border-slate-800 shadow-sm ${!showAvatar && 'opacity-0'}`}>
        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${message.senderId}`} alt="" />
      </div>
      
      <div className={`max-w-[80%] space-y-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isMe && showAvatar && (
          <span className="text-[10px] font-bold text-saffron ml-1 uppercase tracking-wider">Soul Seekers</span>
        )}
        <div className={`p-4 rounded-2xl shadow-md relative group border ${isMe ? 'bg-ayodhya-gradient text-white rounded-tr-none shadow-saffron/20 border-white/20' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-sandstone dark:border-white/5 rounded-tl-none'}`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          <div className={`flex items-center gap-1.5 mt-2 justify-end ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
            <span className="text-[9px] font-bold uppercase tracking-tighter">
               {message.timestamp ? format(message.timestamp.toMillis ? message.timestamp.toMillis() : message.timestamp, 'HH:mm') : '--:--'}
            </span>
            {isMe && (
              <div className="flex">
                {message.status === 'read' ? <CheckCheck className="w-3 h-3 text-white" /> : <Check className="w-3 h-3 opacity-60 text-white" />}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
