/**
 * Crypto utilities for E2EE using Web Crypto API.
 * Uses ECDH for key exchange and AES-GCM for message encryption.
 */

const ENC_ALGO = 'AES-GCM';
const ECDH_ALGO = 'ECDH';
const CURVE = 'P-256';

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await window.crypto.subtle.generateKey(
    { name: ECDH_ALGO, namedCurve: CURVE },
    true,
    ['deriveKey']
  );
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('spki', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

export async function importPublicKey(base64: string): Promise<CryptoKey> {
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return await window.crypto.subtle.importKey(
    'spki',
    buffer,
    { name: ECDH_ALGO, namedCurve: CURVE },
    true,
    []
  );
}

export async function deriveSharedKey(
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<CryptoKey> {
  return await window.crypto.subtle.deriveKey(
    { name: ECDH_ALGO, public: publicKey },
    privateKey,
    { name: ENC_ALGO, length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(
  key: CryptoKey,
  plainText: string
): Promise<{ ciphertext: string; iv: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plainText);
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: ENC_ALGO, iv },
    key,
    encoded
  );
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    iv: btoa(String.fromCharCode(...new Uint8Array(iv)))
  };
}

export async function decrypt(
  key: CryptoKey,
  ciphertextB64: string,
  ivB64: string
): Promise<string> {
  const iv = new Uint8Array(atob(ivB64).split('').map(c => c.charCodeAt(0)));
  const ciphertext = new Uint8Array(atob(ciphertextB64).split('').map(c => c.charCodeAt(0)));
  const decrypted = await window.crypto.subtle.decrypt(
    { name: ENC_ALGO, iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

export async function generateGroupKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    { name: ENC_ALGO, length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function exportSymmetricKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

export async function importSymmetricKey(base64: string): Promise<CryptoKey> {
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return await window.crypto.subtle.importKey(
    'raw',
    buffer,
    { name: ENC_ALGO },
    true,
    ['encrypt', 'decrypt']
  );
}
