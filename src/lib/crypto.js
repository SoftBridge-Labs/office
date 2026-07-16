// crypto.js
// Provides AES-GCM encryption for WebRTC Signaling E2EE

/**
 * Derives an AES-GCM CryptoKey from a given password string.
 */
async function getKeyMaterial(password) {
  const enc = new TextEncoder();
  return window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
}

async function getKey(password, salt) {
  const keyMaterial = await getKeyMaterial(password);
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a string (e.g. JSON stringified payload) using the provided password.
 * Returns a base64 encoded string containing the salt, iv, and ciphertext.
 */
export async function encryptPayload(text, password) {
  try {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await getKey(password, salt);
    
    const enc = new TextEncoder();
    const encoded = enc.encode(text);
    
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encoded
    );
    
    // Combine salt, iv, and ciphertext into a single array
    const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(ciphertext), salt.length + iv.length);
    
    // Convert to base64
    return btoa(String.fromCharCode.apply(null, combined));
  } catch (e) {
    console.error("Encryption failed", e);
    return null;
  }
}

/**
 * Decrypts a base64 encoded string containing salt, iv, and ciphertext using the password.
 * Returns the decrypted plaintext string.
 */
export async function decryptPayload(base64Cipher, password) {
  try {
    const combinedString = atob(base64Cipher);
    const combined = new Uint8Array(combinedString.length);
    for (let i = 0; i < combinedString.length; i++) {
      combined[i] = combinedString.charCodeAt(i);
    }
    
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const ciphertext = combined.slice(28);
    
    const key = await getKey(password, salt);
    
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      ciphertext
    );
    
    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (e) {
    // Fails to decrypt if wrong password or not encrypted data
    return null;
  }
}
