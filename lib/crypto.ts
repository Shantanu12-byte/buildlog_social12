import nacl from 'tweetnacl';
import { decodeBase64, encodeBase64, decodeUTF8, encodeUTF8 } from 'tweetnacl-util';
import * as AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

/**
 * lib/crypto.ts
 * E2EE helper for buildlog using X25519 (tweetnacl)
 */

const KEY_STORAGE_KEY = 'buildlog_private_key';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

function safeDecode(str: string, label: string): Uint8Array {
  if (!str || typeof str !== 'string' || str.trim().length === 0) {
    throw new Error(`INVALID_KEY_FORMAT: ${label} is empty or not a string`);
  }
  
  // Clean the string - remove any hidden characters or whitespace that might break base64
  const cleaned = str.trim().replace(/\s/g, '');
  
  try {
    return decodeBase64(cleaned);
  } catch (e) {
    console.error(`BASE64_DECODE_FAILED [${label}]:`, {
      length: cleaned.length,
      prefix: cleaned.substring(0, 5) + '...',
      type: typeof cleaned
    });
    throw new Error(`INVALID_ENCODING: ${label}`);
  }
}

/**
 * Generates or retrieves the user's asymmetric keypair
 */
export async function getOrCreateKeyPair(): Promise<KeyPair> {
  const privKeyBase64 = await AsyncStorage.default.getItem(KEY_STORAGE_KEY);
  
  if (!privKeyBase64) {
    const pair = nacl.box.keyPair();
    const newPrivKeyBase64 = encodeBase64(pair.secretKey);
    await AsyncStorage.default.setItem(KEY_STORAGE_KEY, newPrivKeyBase64);
    
    // Upload public key to profiles
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ 
        public_key: encodeBase64(pair.publicKey) 
      }).eq('id', user.id);
    }
    
    return {
      publicKey: encodeBase64(pair.publicKey),
      privateKey: newPrivKeyBase64,
    };
  }

  try {
    const secretKey = safeDecode(privKeyBase64, 'PRIVATE_KEY_STORAGE');
    const pair = nacl.box.keyPair.fromSecretKey(secretKey);
    const pubKeyBase64 = encodeBase64(pair.publicKey);
    
    // Always re-sync public key to DB to fix potential corruption
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      supabase.from('profiles').update({ public_key: pubKeyBase64 }).eq('id', user.id).then(({ error }) => {
        if (error) console.error('KEY_SYNC_ERROR:', error);
      });
    }

    return {
      publicKey: pubKeyBase64,
      privateKey: privKeyBase64,
    };
  } catch (e) {
    console.error('CRITICAL: Local private key is corrupted. Regenerating...');
    await AsyncStorage.default.removeItem(KEY_STORAGE_KEY);
    return getOrCreateKeyPair();
  }
}

/**
 * Encrypts a message using sender's private key and recipient's public key
 */
export function encryptMessage(message: string, recipientPublicKeyBase64: string, myPrivateKeyBase64: string): string {
  try {
    const recipientKey = safeDecode(recipientPublicKeyBase64, 'RECIPIENT_PUBLIC_KEY');
    const myPrivateKey = safeDecode(myPrivateKeyBase64, 'MY_PRIVATE_KEY');
    
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const utf8Msg = decodeUTF8(message);
    
    const encrypted = nacl.box(
      utf8Msg,
      nonce,
      recipientKey,
      myPrivateKey
    );

    const full = new Uint8Array(nonce.length + encrypted.length);
    full.set(nonce);
    full.set(encrypted, nonce.length);
    
    return encodeBase64(full);
  } catch (e: any) {
    console.error('ENCRYPTION_CRASH:', e.message);
    throw e;
  }
}

/**
 * Decrypts a message using recipient's private key and sender's public key
 */
export function decryptMessage(encryptedFullBase64: string, senderPublicKeyBase64: string, myPrivateKeyBase64: string): string {
  if (!encryptedFullBase64 || !senderPublicKeyBase64 || !myPrivateKeyBase64) return '[ENCRYPTED_DATA]';
  
  try {
    const encryptedData = decodeBase64(encryptedFullBase64);
    const senderKey = decodeBase64(senderPublicKeyBase64);
    const myPrivateKey = decodeBase64(myPrivateKeyBase64);
    
    const nonce = encryptedData.slice(0, nacl.box.nonceLength);
    const encrypted = encryptedData.slice(nacl.box.nonceLength);
    
    const decrypted = nacl.box.open(
      encrypted,
      nonce,
      senderKey,
      myPrivateKey
    );
    
    if (!decrypted) return '[DECRYPTION_FAILED]';
    return encodeUTF8(decrypted);
  } catch (e) {
    return '[ENCRYPTION_MISMATCH]';
  }
}
