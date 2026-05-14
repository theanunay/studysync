import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc, serverTimestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth as firebaseAuth } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { localDb, LocalContact } from '../lib/db';
import { deriveSharedKey, importPublicKey, encrypt, decrypt } from '../lib/crypto';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: firebaseAuth.currentUser?.uid,
      email: firebaseAuth.currentUser?.email,
      emailVerified: firebaseAuth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface Chat {
  id: string;
  type: 'private' | 'group';
  members: string[];
  name?: string;
  lastMessage?: any;
}

interface Message {
  id: string;
  senderId: string;
  content: string; // Decrypted content
  type: 'text' | 'image' | 'video' | 'file';
  timestamp: any;
  status: 'sent' | 'delivered' | 'read';
}

interface ChatContextType {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  setActiveChat: (chat: Chat | null) => void;
  sendMessage: (content: string, type?: 'text' | 'image' | 'video' | 'file') => Promise<void>;
  createPrivateChat: (targetUser: any) => Promise<void>;
  createGroupChat: (name: string, members: string[]) => Promise<void>;
  typingStatus: { [userId: string]: boolean };
  setTyping: (isTyping: boolean) => Promise<void>;
  addContact: (targetUser: any) => Promise<void>;
  incomingCall: any;
  setIncomingCall: (call: any) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sharedKey, setSharedKey] = useState<CryptoKey | null>(null);
  const [typingStatus, setTypingStatus] = useState<{ [userId: string]: boolean }>({});
  const [incomingCall, setIncomingCall] = useState<any>(null);

  // Subscribe to chats
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('members', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
      setChats(chatList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'chats');
    });

    return unsubscribe;
  }, [user]);

  // Subscribe to incoming calls
  useEffect(() => {
    if (!user || chats.length === 0) return;

    const unsubscribes = chats.map(chat => {
      const q = query(
        collection(db, 'chats', chat.id, 'calls'),
        where('type', '==', 'offer')
      );

      return onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const data = change.doc.data();
            // Check if call is fresh (last 30 seconds)
            const isFresh = data.timestamp?.toMillis ? (Date.now() - data.timestamp.toMillis() < 30000) : true;
            if (data.callerId !== user.uid && isFresh) {
              setIncomingCall({
                chatId: chat.id,
                ...data
              });
            }
          }
        });
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [chats, user]);

  // Subscribe to typing status
  useEffect(() => {
    if (!activeChat) {
      setTypingStatus({});
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'chats', activeChat.id), (doc) => {
      if (doc.exists()) {
        setTypingStatus(doc.data().typing || {});
      }
    });

    return unsubscribe;
  }, [activeChat]);

  const setTyping = async (isTyping: boolean) => {
    if (!user || !activeChat) return;
    try {
      await updateDoc(doc(db, 'chats', activeChat.id), {
        [`typing.${user.uid}`]: isTyping
      });
    } catch (e) {
      console.error("Typing update failed", e);
    }
  };

  const addContact = async (targetUser: any) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'contacts'), {
        uid: targetUser.uid,
        addedAt: serverTimestamp()
      });
      // Also save to localDb for offline access/E2EE keys
      await localDb.contacts.put({
        uid: targetUser.uid,
        displayName: targetUser.displayName,
        photoURL: targetUser.photoURL,
        publicKey: targetUser.publicKey
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/contacts`);
    }
  };

  // Subscribe to messages when activeChat changes
  useEffect(() => {
    if (!user || !activeChat) {
      setMessages([]);
      setSharedKey(null);
      return;
    }

    const loadChatKeys = async () => {
      if (activeChat.type === 'private') {
        const otherMemberId = activeChat.members.find(id => id !== user.uid);
        if (!otherMemberId) return;

        // Try to get other user's public key
        // In a real app, you'd fetch this if missing
        const otherUserDoc = await localDb.contacts.get(otherMemberId);
        if (otherUserDoc) {
          const otherPubKey = await importPublicKey(otherUserDoc.publicKey);
          const myKeys = await localDb.keys.get('me');
          if (myKeys) {
            const derived = await deriveSharedKey(myKeys.privateKey, otherPubKey);
            setSharedKey(derived);
          }
        }
      }
      // Group keys logic would go here
    };

    loadChatKeys();

    const mQuery = query(
      collection(db, 'chats', activeChat.id, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(mQuery, async (snapshot) => {
      // In a real app, we would decrypt here
      // But decryption is async. We might want to store decrypted messages in localDb
      const newMessages: Message[] = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        let decryptedContent = '[Encrypted Message]';
        
        try {
          // Check local cache first
          const cached = await localDb.messages.get(doc.id);
          if (cached) {
            decryptedContent = cached.content;
          } else if (sharedKey) {
            // Decrypt if we have the key
            const parsed = JSON.parse(data.content);
            decryptedContent = await decrypt(sharedKey, parsed.ciphertext, parsed.iv);
            
            // Cache it
            await localDb.messages.put({
              id: doc.id,
              chatId: activeChat.id,
              senderId: data.senderId,
              content: decryptedContent,
              type: data.type,
              timestamp: data.timestamp?.toMillis() || Date.now(),
              status: data.status
            });
          }
        } catch (e) {
          console.error("Decryption failed", e);
        }

        newMessages.push({
          id: doc.id,
          senderId: data.senderId,
          content: decryptedContent,
          type: data.type,
          timestamp: data.timestamp,
          status: data.status
        });
      }
      setMessages(newMessages);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `chats/${activeChat.id}/messages`);
    });

    return unsubscribe;
  }, [activeChat, user, sharedKey]);

  const sendMessage = async (content: string, type: 'text' | 'image' | 'video' | 'file' = 'text') => {
    if (!user || !activeChat || !sharedKey) return;

    try {
      const encrypted = await encrypt(sharedKey, content);
      const messageData = {
        senderId: user.uid,
        content: JSON.stringify(encrypted),
        type,
        timestamp: serverTimestamp(),
        status: 'sent'
      };

      await addDoc(collection(db, 'chats', activeChat.id, 'messages'), messageData);
      await updateDoc(doc(db, 'chats', activeChat.id), {
        lastMessage: {
          content: type === 'text' ? 'Encrypted message' : `Shared ${type}`,
          timestamp: serverTimestamp()
        }
      });
    } catch (e) {
      console.error("Send failed", e);
    }
  };

  const createPrivateChat = async (targetUser: any) => {
    if (!user) return;

    // Check if chat already exists
    const existing = chats.find(c => c.type === 'private' && c.members.includes(targetUser.uid));
    if (existing) {
      setActiveChat(existing);
      return;
    }

    // Save contact locally
    await localDb.contacts.put({
      uid: targetUser.uid,
      displayName: targetUser.displayName,
      photoURL: targetUser.photoURL,
      publicKey: targetUser.publicKey
    });

    const newChat = {
      type: 'private',
      members: [user.uid, targetUser.uid],
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'chats'), newChat);
    setActiveChat({ id: docRef.id, ...newChat } as any);
  };

  const createGroupChat = async (name: string, members: string[]) => {
    if (!user) return;

    const allMembers = [user.uid, ...members];
    const newChat = {
      type: 'group',
      name,
      members: allMembers,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'chats'), newChat);
    setActiveChat({ id: docRef.id, ...newChat } as any);
  };

  return (
    <ChatContext.Provider value={{ 
      chats, 
      activeChat, 
      messages, 
      setActiveChat, 
      sendMessage, 
      createPrivateChat,
      createGroupChat,
      typingStatus,
      setTyping,
      addContact,
      incomingCall,
      setIncomingCall
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
