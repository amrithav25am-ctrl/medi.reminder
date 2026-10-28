// End-to-End Encryption Service using Web Crypto API (AES-GCM 256-bit)

const DEFAULT_SALT = new Uint8Array([143, 22, 91, 104, 38, 201, 77, 85, 12, 199, 44, 211, 88, 16, 99, 102]);

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedPayload {
  ciphertext: string; // Base64
  iv: string; // Base64
  salt: string; // Base64
  version: string;
  timestamp: string;
}

export async function encryptData(data: unknown, passphrase: string = 'DoseMate-E2EE-Vault-Key'): Promise<EncryptedPayload> {
  const enc = new TextEncoder();
  const rawData = enc.encode(JSON.stringify(data));
  
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const key = await deriveKey(passphrase, salt);
  
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    rawData
  );

  return {
    ciphertext: arrayBufferToBase64(encryptedBuffer),
    iv: uint8ArrayToBase64(iv),
    salt: uint8ArrayToBase64(salt),
    version: '1.0',
    timestamp: new Date().toISOString(),
  };
}

export async function decryptData<T>(payload: EncryptedPayload, passphrase: string = 'DoseMate-E2EE-Vault-Key'): Promise<T> {
  const salt = base64ToUint8Array(payload.salt);
  const iv = base64ToUint8Array(payload.iv);
  const encryptedBuffer = base64ToArrayBuffer(payload.ciphertext);
  
  const key = await deriveKey(passphrase, salt);
  
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    key,
    encryptedBuffer
  );

  const dec = new TextDecoder();
  const jsonStr = dec.decode(decryptedBuffer);
  return JSON.parse(jsonStr) as T;
}

export async function computeHash(text: string): Promise<string> {
  const enc = new TextEncoder();
  const buffer = await window.crypto.subtle.digest('SHA-256', enc.encode(text));
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helpers
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  return base64ToUint8Array(base64).buffer as ArrayBuffer;
}
