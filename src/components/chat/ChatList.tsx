import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'motion/react';
import { Check, CheckCheck } from 'lucide-react';

export function ChatList() {
  const { chats, activeChat, setActiveChat } = useChat();
  const { user } = useAuth();

  return (
    <div className="space-y-1 p-2">
      {chats.length === 0 ? (
        <div className="p-12 text-center text-slate-600 text-sm italic">
          No conversations yet. Start one by clicking the search icon!
        </div>
      ) : (
        chats.map((chat) => {
          const isActive = activeChat?.id === chat.id;
          const otherMemberId = chat.type === 'private' ? chat.members.find(id => id !== user?.uid) : null;
          
          return (
            <motion.button
              key={chat.id}
              onClick={() => setActiveChat(chat)}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all border ${isActive ? 'bg-white dark:bg-slate-800 shadow-lg shadow-saffron/10 border-saffron/40' : 'hover:bg-white/60 dark:hover:bg-slate-800/40 border-transparent'}`}
            >
              <div className="relative">
                <div className="w-11 h-11 bg-white dark:bg-slate-800 rounded-xl flex-shrink-0 overflow-hidden ring-1 ring-sandstone dark:ring-white/5 shadow-sm">
                  {chat.type === 'private' ? (
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${otherMemberId || chat.id}`} className="bg-sandstone/20 dark:bg-slate-900" alt="" />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-ayodhya-gradient text-white font-bold uppercase text-xs">
                      {chat.name?.[0] || 'G'}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
              </div>

              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className={`text-sm font-semibold truncate ${isActive ? 'text-saffron' : 'text-slate-800 dark:text-slate-200'}`}>
                    {chat.type === 'private' ? 'Divine Soul' : chat.name}
                  </h3>
                  {chat.lastMessage?.timestamp && (
                    <span className="text-[9px] text-slate-400 whitespace-nowrap ml-2 uppercase font-bold tracking-tighter">
                      {formatDistanceToNow(chat.lastMessage.timestamp.toMillis(), { addSuffix: false })}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 truncate pr-4">
                    {chat.lastMessage?.content || 'Sacred encryption active'}
                  </p>
                  {isActive ? (
                    <div className="w-1.5 h-1.5 bg-saffron rounded-full shadow-[0_0_8px_rgba(255,153,51,0.6)]"></div>
                  ) : chat.lastMessage?.unread && (
                      <div className="bg-saffron text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm shadow-saffron/20">2</div>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })
      )}
    </div>
  );
}
