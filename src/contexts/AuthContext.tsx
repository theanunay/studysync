import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../lib/firebase';
import { generateKeyPair, exportPublicKey } from '../lib/crypto';
import { localDb } from '../lib/db';

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
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  updateProfileData: (displayName: string, photoURL?: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Ensure user document and keys exist
          await ensureUserSetup(user);
          setUser(user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const ensureUserSetup = async (user: User) => {
    const userDocRef = doc(db, 'users', user.uid);
    let userSnap;
    try {
      userSnap = await getDoc(userDocRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `users/${user.uid}`);
      return;
    }

    let localKey = await localDb.keys.get('me');

    if (!userSnap.exists() || !localKey) {
      if (!localKey) {
        const keyPair = await generateKeyPair();
        const exportedPublic = await exportPublicKey(keyPair.publicKey);
        localKey = {
          id: 'me',
          publicKey: keyPair.publicKey,
          privateKey: keyPair.privateKey,
          exportedPublicKey: exportedPublic
        };
        await localDb.keys.put(localKey);
      }

      if (!userSnap.exists()) {
        try {
          await setDoc(userDocRef, {
            uid: user.uid,
            displayName: user.displayName,
            photoURL: user.photoURL,
            publicKey: localKey.exportedPublicKey,
            status: 'Available',
            lastSeen: serverTimestamp()
          });
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
        }
      }
    }
  };

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const updateProfileData = async (displayName: string, photoURL?: string) => {
    if (!auth.currentUser) return;
    try {
      await updateProfile(auth.currentUser, {
        displayName,
        photoURL: photoURL || auth.currentUser.photoURL
      });
      
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        displayName,
        photoURL: photoURL || auth.currentUser.photoURL
      });
      
      setUser({ ...auth.currentUser });
    } catch (e) {
      console.error("Profile update failed", e);
    }
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    if (!auth.currentUser) throw new Error("Not logged in");
    const storageRef = ref(storage, `avatars/${auth.currentUser.uid}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const logOut = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logOut, updateProfileData, uploadAvatar }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
