import { Buffer } from 'buffer';
window.Buffer = Buffer;
window.global = window;
(window as any).process = { env: {} };

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { doc, getDocFromCache } from 'firebase/firestore';
import { db } from './lib/firebase';

async function testConnection() {
  try {
    // We use a small check to verify Firebase availability
    const testDoc = doc(db, '_internal_', 'connection_test');
    await getDocFromCache(testDoc).catch(() => {});
    console.log("Firebase connection initialized.");
  } catch (error) {
    console.error("Firebase connection test failed:", error);
  }
}

testConnection();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
