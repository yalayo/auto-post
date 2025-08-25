// Cloudflare Workers-compatible auth service using Web Crypto API

/**
 * Generate a random salt using Web Crypto API
 */
function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert string to ArrayBuffer
 */
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

/**
 * Convert ArrayBuffer to hex string
 */
function arrayBufferToHex(buffer: ArrayBuffer): string {
  const array = new Uint8Array(buffer);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert hex string to ArrayBuffer
 */
function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
}

/**
 * Constant-time comparison function (timing-safe equal)
 */
function timingSafeEqual(a: ArrayBuffer, b: ArrayBuffer): boolean {
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  
  const arrayA = new Uint8Array(a);
  const arrayB = new Uint8Array(b);
  let result = 0;
  
  for (let i = 0; i < arrayA.length; i++) {
    result |= arrayA[i] ^ arrayB[i];
  }
  
  return result === 0;
}

/**
 * Hash password using PBKDF2 with Web Crypto API
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt();
  const passwordBuffer = stringToArrayBuffer(password);
  const saltBuffer = hexToArrayBuffer(salt);
  
  // Import the password as a key
  const key = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  // Derive bits using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000, // 100k iterations for security
      hash: 'SHA-256'
    },
    key,
    256 // 32 bytes = 256 bits
  );
  
  const hash = arrayBufferToHex(derivedBits);
  return `${hash}.${salt}`;
}

/**
 * Compare password with stored hash using constant-time comparison
 */
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [storedHash, salt] = stored.split('.');
  if (!storedHash || !salt) {
    return false;
  }
  
  const passwordBuffer = stringToArrayBuffer(supplied);
  const saltBuffer = hexToArrayBuffer(salt);
  
  // Import the password as a key
  const key = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  // Derive bits using the same parameters
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    256
  );
  
  const suppliedHashBuffer = derivedBits;
  const storedHashBuffer = hexToArrayBuffer(storedHash);
  
  return timingSafeEqual(suppliedHashBuffer, storedHashBuffer);
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export function sanitizeUser(user: any): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
  };
}