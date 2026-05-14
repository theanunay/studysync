import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, getDocs, doc, getDoc, Timestamp, where } from 'firebase/firestore';
import { ChatList } from './chat/ChatList';
import { ChatView } from './chat/ChatView';
import { SearchModal } from './modals/SearchModal';
import { CreateGroupModal } from './modals/CreateGroupModal';
import { StatusModal } from './modals/StatusModal';
import { StatusViewerModal } from './modals/StatusViewerModal';
import { MessageSquare, Users, History, Settings, Moon, Sun, Search, Plus, Camera, UserPlus, Contact, ShieldCheck, MoreVertical, Phone, PhoneOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { localDb } from '../lib/db';
import { CallOverlay } from './chat/CallOverlay';

export function useStatuses() {
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const q = query(
      collection(db, 'statusUpdates'), 
      where('timestamp', '>=', Timestamp.fromDate(yesterday)),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const statusesMap = new Map<string, any>();
      
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        if (!statusesMap.has(data.userId)) {
          try {
            const userDoc = await getDoc(doc(db, 'users', data.userId));
            const userData = userDoc.exists() ? userDoc.data() : { displayName: 'Unknown', photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.userId}` };
            
            statusesMap.set(data.userId, {
              userId: data.userId,
              user: userData,
              updates: []
            });
          } catch (err) {
            console.error("Failed to fetch user details for status:", err);
            continue;
          }
        }
        
        statusesMap.get(data.userId).updates.push({
          id: docSnapshot.id,
          ...data
        });
      }
      
      setStatuses(Array.from(statusesMap.values()));
      setLoading(false);
    }, (error) => {
      console.error("Status updates listener error:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { statuses, loading };
}

export function Main({ onToggleTheme, isDarkMode }: { onToggleTheme: () => void, isDarkMode: boolean }) {
  const { activeChat, incomingCall, setIncomingCall } = useChat();
  const { statuses, loading: statusesLoading } = useStatuses();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'chats' | 'contacts' | 'status' | 'groups' | 'settings'>('chats');
  const [showSearch, setShowSearch] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showStatusUpload, setShowStatusUpload] = useState(false);
  const [viewingStatusGroup, setViewingStatusGroup] = useState<any | null>(null);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [isAnswering, setIsAnswering] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-temple-white dark:bg-slate-950 text-slate-900 dark:text-slate-200">
      {/* Incoming Call Toast */}
      <AnimatePresence>
        {incomingCall && !isAnswering && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[60] w-full max-w-sm"
          >
            <div className="bg-white dark:bg-slate-900 border border-saffron/30 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 divine-glow">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-ayodhya-gradient rounded-xl flex items-center justify-center animate-bounce shadow-lg shadow-saffron/40">
                  <Phone className="text-white w-6 h-6" />
                </div>
                <div>
                   <p className="font-bold text-saffron">Incoming Call</p>
                   <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Secure Divine Presence</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsAnswering(true)}
                  className="p-3 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-600/20"
                >
                   <Phone className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setIncomingCall(null)}
                  className="p-3 bg-rose-600 rounded-xl text-white shadow-lg shadow-rose-600/20"
                >
                   <PhoneOff className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAnswering && incomingCall && (
          <CallOverlay 
            chatId={incomingCall.chatId}
            type="voice"
            isIncoming={true}
            incomingSignal={JSON.parse(incomingCall.signal)}
            onClose={() => {
              setIsAnswering(false);
              setIncomingCall(null);
            }}
          />
        )}
      </AnimatePresence>
      {/* Navigation Sidebar */}
      <nav className="hidden md:flex w-[72px] bg-slate-50/80 dark:bg-slate-900/90 border-r border-sandstone/50 dark:border-slate-800/80 flex-col items-center py-6 justify-between z-20 backdrop-blur-xl shrink-0 relative">
        <div className="space-y-8 flex flex-col items-center w-full">
          <motion.div 
            whileHover={{ rotate: 360 }}
            transition={{ duration: 2 }}
            className="relative group cursor-pointer"
          >
            <div className="w-12 h-12 bg-ayodhya-gradient rounded-xl flex items-center justify-center shadow-md shadow-saffron/20 overflow-hidden relative border border-gold/20">
               <ShieldCheck className="text-white w-6 h-6 z-10" />
               <div className="absolute inset-0 bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[size:4px_4px] opacity-20"></div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center border border-saffron/20">
               <div className="w-2 h-2 bg-emerald-500 rounded-full diya-light"></div>
            </div>
          </motion.div>
          
          <div className="space-y-4 w-full px-3 flex flex-col items-center">
            <NavIcon 
              icon={<MessageSquare />} 
              active={activeTab === 'chats'} 
              onClick={() => setActiveTab('chats')} 
              label="Divine Chats"
            />
            <NavIcon 
              icon={<Contact />} 
              active={activeTab === 'contacts'} 
              onClick={() => setActiveTab('contacts')} 
              label="Seekers List"
            />
            <NavIcon 
              icon={<History />} 
              active={activeTab === 'status'} 
              onClick={() => setActiveTab('status')} 
              label="Present Souls"
            />
            <NavIcon 
              icon={<Users />} 
              active={activeTab === 'groups'} 
              onClick={() => setActiveTab('groups')} 
              label="Groups"
            />
          </div>
        </div>

        <div className="space-y-4 w-full flex flex-col items-center px-3">
          <ThemeToggle isDarkMode={isDarkMode} onToggle={onToggleTheme} />
          
          <NavIcon 
            icon={<Settings />} 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            label="Sanctuary Settings"
          />
        </div>
      </nav>

      {/* List Sidebar */}
      <div className={`${activeChat ? 'hidden md:flex' : 'flex'} flex-1 md:flex-none md:w-80 lg:w-96 bg-white/40 dark:bg-slate-900/40 border-r border-sandstone/50 dark:border-slate-800/80 flex-col z-10 backdrop-blur-md relative overflow-hidden shrink-0`}>
        <div className="absolute inset-0 temple-pattern pointer-events-none opacity-50"></div>
        <header className="p-5 space-y-5 relative z-50">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-ayodhya-gradient capitalize leading-tight">
                {activeTab}
              </h1>
              {user && (
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5" title={user.email || ''}>
                  Om, {user.displayName || 'Seeker'}
                </p>
              )}
            </div>
            <div className="flex gap-1 md:gap-2">
              <button 
                onClick={() => setShowSearch(true)}
                className="p-2 hover:bg-saffron/10 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500 dark:text-slate-400 hover:text-saffron"
              >
                <Search className="w-5 h-5" />
              </button>
              <button 
                onClick={() => activeTab === 'groups' ? setShowCreateGroup(true) : setShowStatusUpload(true)}
                className="p-2 bg-ayodhya-gradient text-white rounded-xl transition-colors shadow-lg shadow-saffron/20 hover:scale-105 active:scale-95"
              >
                <Plus className="w-5 h-5" />
              </button>
              <div className="relative md:hidden">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 hover:bg-saffron/10 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500 dark:text-slate-400 hover:text-saffron"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                <AnimatePresence>
                  {showMobileMenu && (
                    <>
                      <div className="fixed inset-0 z-[100]" onClick={() => setShowMobileMenu(false)} />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-sandstone/30 dark:border-white/5 py-2 z-[101] overflow-hidden majestic-shadow"
                      >
                        <button 
                          onClick={() => { setActiveTab('settings'); setShowMobileMenu(false); }}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-sm flex items-center gap-3 text-slate-700 dark:text-slate-200 transition-colors"
                        >
                           <Settings className="w-4 h-4 text-slate-500" /> Settings
                        </button>
                        <button 
                          onClick={() => { onToggleTheme(); setShowMobileMenu(false); }}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-sm flex items-center gap-3 text-slate-700 dark:text-slate-200 transition-colors"
                        >
                          {isDarkMode ? <Sun className="w-4 h-4 text-marigold" /> : <Moon className="w-4 h-4 text-indigo-400" />} {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search messages..." 
              className="w-full bg-white/60 dark:bg-slate-800/50 border border-sandstone dark:border-slate-700/50 rounded-lg py-2 pl-9 pr-4 text-sm focus:ring-1 focus:ring-saffron outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
            />
          </div>
        </header>

        {/* Stories/Status horizontal strip if in chats tab */}
        {activeTab === 'chats' && (
          <div className="px-5 mb-4 flex gap-4 overflow-x-auto pb-2 scrollbar-none relative z-10">
            <div 
              className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer group"
              onClick={() => setShowStatusUpload(true)}
            >
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-sandstone dark:border-slate-700 p-0.5 group-hover:border-saffron transition-colors">
                <div className="w-full h-full rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-saffron transition-colors flex-col">
                  <div className="w-full h-full rounded-full overflow-hidden relative">
                    <img src={user?.photoURL || ''} alt="You" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Plus className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-slate-500">You</span>
            </div>
            {/* Real stories */}
            {statuses.map(statusGroup => (
              <div 
                key={statusGroup.userId} 
                className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer"
                onClick={() => setViewingStatusGroup(statusGroup)}
              >
                <div className="w-12 h-12 rounded-full border-2 border-saffron p-0.5 shadow-sm">
                  <img src={statusGroup.user.photoURL} className="rounded-full w-full h-full object-cover bg-white dark:bg-slate-800" alt="" />
                </div>
                <span className="text-[10px] text-slate-500 truncate w-12 text-center">{statusGroup.user.displayName.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 pb-20 md:pb-0">
          {activeTab === 'chats' && <ChatList />}
          {activeTab === 'contacts' && <ContactList />}
          {activeTab === 'status' && <StatusView statuses={statuses} loading={statusesLoading} onStatusClick={setViewingStatusGroup} />}
          {activeTab === 'groups' && <GroupList />}
          {activeTab === 'settings' && <SettingsView />}
        </div>
        
        {/* Mobile Bottom Navigation */}
        <div className="md:hidden absolute bottom-0 left-0 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-sandstone dark:border-slate-800 p-2 flex justify-around items-center z-20 shadow-lg">
          <MobileNavIcon 
            icon={<MessageSquare />} 
            active={activeTab === 'chats'} 
            onClick={() => setActiveTab('chats')} 
            label="Chats"
          />
          <MobileNavIcon 
            icon={<Contact />} 
            active={activeTab === 'contacts'} 
            onClick={() => setActiveTab('contacts')} 
            label="Contacts"
          />
          <MobileNavIcon 
            icon={<History />} 
            active={activeTab === 'status'} 
            onClick={() => setActiveTab('status')} 
            label="Status"
          />
          <MobileNavIcon 
            icon={<Users />} 
            active={activeTab === 'groups'} 
            onClick={() => setActiveTab('groups')} 
            label="Groups"
          />
        </div>
      </div>

      {/* Main Content View */}
      <main className={`${activeChat ? 'flex' : 'hidden md:flex'} flex-1 bg-white/40 dark:bg-slate-900 relative flex-col`}>
        <div className="absolute inset-0 temple-pattern pointer-events-none"></div>
        {activeChat ? (
          <ChatView onToggleInfo={() => setShowRightSidebar(!showRightSidebar)} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 relative z-10">
            <div className="p-12 bg-white/80 dark:bg-slate-800 rounded-full border border-sandstone dark:border-slate-700 divine-glow">
              <MessageSquare className="w-24 h-24 text-saffron" />
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold tracking-tight text-saffron text-shadow-saffron">Divine Connection Secured</p>
              <p className="text-sm text-slate-500 uppercase tracking-widest font-bold mt-1">End-to-End Encrypted Sessions</p>
            </div>
          </div>
        )}
      </main>

      {/* Right Sidebar: Info */}
      {activeChat && showRightSidebar && (
        <aside className="hidden xl:flex w-72 border-l border-sandstone dark:border-slate-800 bg-white/20 dark:bg-slate-900/30 flex-col z-10 backdrop-blur-sm relative">
          <div className="absolute inset-0 temple-pattern pointer-events-none opacity-20"></div>
          <div className="p-8 flex flex-col items-center text-center relative z-10">
            <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-800 mb-4 flex items-center justify-center text-4xl shadow-xl overflow-hidden ring-4 ring-sandstone dark:ring-slate-800/50 relative">
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChat?.id}`} alt="" />
               <div className="absolute inset-0 bg-ayodhya-gradient opacity-10"></div>
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{activeChat?.type === 'group' ? activeChat.name : 'Private Session'}</h3>
            <p className="text-[10px] text-saffron font-bold uppercase tracking-widest mt-1">Sacred Connection • E2EE</p>
          </div>
          
          <div className="flex-1 px-6 space-y-8 relative z-10">
            <section>
              <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-4">Divine Assets</h4>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="aspect-square bg-white/60 dark:bg-slate-800 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer border border-sandstone/30 dark:border-white/5 shadow-sm"></div>
                ))}
              </div>
            </section>

            <section>
              <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-4">Temple Settings</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-white/60 dark:bg-slate-800/40 rounded-xl border border-sandstone/30 dark:border-white/5 shadow-sm">
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Silent Meditation</span>
                  <div className="w-8 h-4 bg-sandstone dark:bg-slate-700 rounded-full relative cursor-pointer group">
                    <div className="absolute left-1 top-1 w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full group-hover:bg-saffron transition-colors"></div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-auto pb-8">
              <div className="p-4 bg-saffron/5 border border-saffron/10 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="text-saffron w-4 h-4" />
                  <span className="text-[11px] font-bold text-saffron uppercase">Sacred Privacy</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Your encryption keys never leave your sanctuary. We respect the divinity of your personal data.
                </p>
              </div>
            </section>
          </div>
        </aside>
      )}

      <AnimatePresence>
        {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
        {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} />}
        {showStatusUpload && <StatusModal onClose={() => setShowStatusUpload(false)} />}
        {viewingStatusGroup && (
          <StatusViewerModal 
            statusGroup={viewingStatusGroup} 
            onClose={() => setViewingStatusGroup(null)} 
            formatTimestamp={formatTimestamp}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function NavIcon({ icon, active, onClick, label }: { icon: any, active?: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`p-3 rounded-xl transition-all relative group flex items-center justify-center ${active ? 'bg-ayodhya-gradient text-white shadow-md shadow-saffron/30' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'}`}
      title={label}
    >
      <div className="relative z-10 transition-transform group-hover:scale-110 active:scale-90">
         {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
      </div>
    </button>
  );
}

function ThemeToggle({ isDarkMode, onToggle }: { isDarkMode: boolean, onToggle: () => void }) {
  return (
    <button 
      onClick={onToggle}
      className="p-3 rounded-xl relative flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-all group overflow-hidden"
      title={isDarkMode ? "Switch to Divine Day" : "Switch to Sacred Night"}
    >
      <motion.div
        animate={{ 
          rotate: isDarkMode ? 180 : 0,
          scale: [1, 1.2, 1]
        }}
        transition={{ 
          rotate: { duration: 0.5, type: "spring" },
          scale: { duration: 0.3, times: [0, 0.5, 1] }
        }}
        className="relative z-10 transition-transform group-hover:scale-110 active:scale-90 flex items-center justify-center w-6 h-6"
      >
        {isDarkMode ? <Sun className="w-6 h-6 text-marigold" /> : <Moon className="w-6 h-6 text-indigo-400" />}
      </motion.div>
    </button>
  );
}

function MobileNavIcon({ icon, active, onClick, label }: { icon: any, active?: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 p-2 flex-1 transition-colors ${active ? 'text-saffron' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
    >
      <div className={`relative transition-transform ${active ? 'scale-110' : ''}`}>
         {React.cloneElement(icon as React.ReactElement, { className: "w-[22px] h-[22px]" })}
      </div>
      <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

function formatTimestamp(timestamp: any) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
  return 'Yesterday';
}

function StatusView({ statuses, loading, onStatusClick }: { statuses: any[], loading: boolean, onStatusClick: (group: any) => void }) {
  if (loading) return <div className="p-12 text-center opacity-40 italic text-sm text-slate-500">Loading sacred visions...</div>;

  return (
    <div className="p-4 space-y-4">
      {statuses.length === 0 ? (
        <div className="p-12 text-center opacity-40 italic text-sm text-slate-500">No status updates yet</div>
      ) : (
        statuses.map(statusGroup => {
          const latestUpdate = statusGroup.updates[0];
          return (
            <div 
              key={statusGroup.userId}
              onClick={() => onStatusClick(statusGroup)}
              className="flex items-center gap-4 p-3 bg-white/40 dark:bg-slate-800/40 border border-sandstone/50 dark:border-white/5 rounded-2xl shadow-sm cursor-pointer hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className="w-12 h-12 rounded-full border-2 border-saffron p-0.5 shrink-0">
                <img src={statusGroup.user.photoURL} className="w-full h-full rounded-full bg-white dark:bg-slate-800 object-cover" alt="" />
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{statusGroup.user.displayName}</p>
                 <p className="text-[10px] text-slate-500">{formatTimestamp(latestUpdate.timestamp)}</p>
                 <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 truncate">
                   {latestUpdate.content ? latestUpdate.content : 'Photo upload'}
                 </p>
              </div>
              {latestUpdate.imageUrl && (
                 <img src={latestUpdate.imageUrl} className="w-12 h-12 rounded-lg object-cover ml-2 shrink-0 border border-sandstone/30 dark:border-white/10" alt="Status thumbnail" />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function GroupList() { return <div className="p-12 text-center opacity-40 italic text-sm text-slate-500">No groups joined</div>; }

function ContactList() {
  const { chats, createPrivateChat } = useChat();
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    const fetchContacts = async () => {
      const allContacts = await localDb.contacts.toArray();
      setContacts(allContacts);
    };
    fetchContacts();
  }, []);

  return (
    <div className="p-4 space-y-2">
      {contacts.length === 0 ? (
        <div className="p-12 text-center opacity-40 italic text-sm text-slate-500">No contacts added yet</div>
      ) : (
        contacts.map(contact => (
          <button 
            key={contact.uid}
            onClick={() => createPrivateChat(contact)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/40 dark:bg-slate-800/40 hover:bg-white/80 dark:hover:bg-slate-800/60 transition-all border border-sandstone/50 dark:border-white/5 shadow-sm"
          >
            <img src={contact.photoURL} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800" alt="" />
            <div className="flex-1 text-left min-w-0">
               <p className="text-sm font-semibold truncate text-slate-800 dark:text-slate-200">{contact.displayName}</p>
               <p className="text-[10px] text-saffron uppercase font-bold tracking-widest">Secured Presence</p>
            </div>
            <div className="w-8 h-8 rounded-full border border-sandstone dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-saffron hover:border-saffron transition-colors">
               <MessageSquare className="w-4 h-4" />
            </div>
          </button>
        ))
      )}
    </div>
  );
}

function SettingsView() {
  const { logOut, user, updateProfileData, uploadAvatar } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdate = async () => {
    await updateProfileData(displayName);
    setIsEditing(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const url = await uploadAvatar(file);
      await updateProfileData(displayName, url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-saffron uppercase tracking-widest">Divine Presence</h3>
        <div className="p-4 bg-white/60 dark:bg-slate-800/50 rounded-2xl border border-sandstone dark:border-white/5 space-y-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img src={user?.photoURL || ''} className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-700 object-cover shadow-md" alt="" />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-saffron/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              {isUploading && (
                <div className="absolute inset-0 bg-white/40 dark:bg-black/40 rounded-2xl flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-saffron/30 border-t-saffron rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-2">
                  <input 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-sandstone dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-saffron"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleUpdate} className="text-xs font-bold text-saffron">Save</button>
                    <button onClick={() => setIsEditing(false)} className="text-xs font-bold text-slate-400">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold truncate text-slate-800 dark:text-slate-200">{user?.displayName}</p>
                    <button onClick={() => setIsEditing(true)} className="text-[10px] font-bold text-saffron uppercase tracking-widest hover:underline transition-all">Edit</button>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-saffron uppercase tracking-widest">Local Sanctuary</h3>
        <div className="p-4 bg-white/60 dark:bg-slate-800/50 rounded-2xl border border-sandstone dark:border-white/5 space-y-2 shadow-sm">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">Local Cache</span>
            <span className="text-saffron font-bold">1.2 MB</span>
          </div>
          <div className="h-1.5 w-full bg-sandstone dark:bg-slate-900 rounded-full overflow-hidden">
             <div className="h-full bg-ayodhya-gradient w-1/4 rounded-full"></div>
          </div>
        </div>
      </div>

      <button 
        onClick={logOut}
        className="w-full py-4 text-vermillion font-bold hover:bg-vermillion/5 rounded-2xl transition-colors border border-vermillion/10 uppercase text-xs tracking-widest"
      >
        Leave Sanctuary
      </button>
    </div>
  );
}
