import { describe, it, expect, vi } from 'vitest'
import { createJWT, generateSessionId, getJWTFromCookie, getStoredPasswordHash, hashPassword, setPasswordHash, signToken, verifyJWT, verifyPassword, verifySignature } from './passwords-sessions'
import { JWTPayload } from '../types';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password correctly', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for different passwords', async () => {
      const hash1 = await hashPassword('password1');
      const hash2 = await hashPassword('password2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify a correct password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      const result = await verifyPassword(password, hash);

      expect(result).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      const result = await verifyPassword('wrongPassword', hash);

      expect(result).toBe(false);
    });

    it('should handle invalid hash gracefully', async () => {
      const result = await verifyPassword('password', 'invalid-hash');

      expect(result).toBe(false);
    });
  });

  describe('getStoredPasswordHash and setPasswordHash', () => {
    it('should get password hash through callback', async () => {
      const mockCb = vi.fn().mockResolvedValue('mock-hash');
      const result = await getStoredPasswordHash(mockCb);

      expect(result).toBe('mock-hash');
      expect(mockCb).toHaveBeenCalled();
    });

    it('should set password hash through callback', async () => {
      const mockCb = vi.fn();
      await setPasswordHash(mockCb, 'test-hash');

      expect(mockCb).toHaveBeenCalledWith('test-hash');
    });
  });
});

describe('Session Utilities', () => {
  const secret = 'test-secret';
  const tokenDuration = 7 * 24 * 60 * 60 * 1000;

  describe('generateSessionId', () => {
    it('should generate a valid session id', async () => {
      const sessionId = generateSessionId();

      expect(sessionId.length).toBeGreaterThan(0);
    });
  });

  describe('signToken', () => {
    it('should generate a valid signature', async () => {
      const sessionId = generateSessionId();
      const expiresAt = Date.now() + tokenDuration;
      const data = `${sessionId}.${expiresAt}`;
      const signature = await signToken(data, secret);
      console.log("signature", signature);

      expect(signature.length).greaterThan(0);
    });
  });

  describe('verifySignature', () => {
    it('should verify a signed token', async () => {
      const sessionId = generateSessionId();
      const expiresAt = Date.now() + tokenDuration;
      const data = `${sessionId}.${expiresAt}`;
      const signature = await signToken(data, secret);

      const verificationResult = verifySignature(data, signature, secret);

      expect(verificationResult).toBeTruthy();
    });

    it('should not verify a modified token', async () => {
      const sessionId = generateSessionId();
      const expiresAt = Date.now() + tokenDuration;
      const data = `${sessionId}.${expiresAt}`;
      const signature = await signToken(data, secret);

      const dataModified = `${sessionId}.${expiresAt + 1000}`;
      const verificationResult = await verifySignature(dataModified, signature, secret);

      expect(verificationResult).toBeFalsy();
    });
  });

  describe('createSession', () => {
    it('', async () => {

    });
  });

  describe('verifySession', () => {
    it('', async () => {

    });
  });
});

// describe('Cookie Utilities', () => {
// });

describe('JWT Utilities', () => {
  const secret = 'test-secret';
  const payload: JWTPayload = {
    sub: 125,
    username: 'test-user',
    iat: 0,
    exp: 0
  };

  it('should create a valid JWT', async () => {
    const token = await createJWT(payload, secret);

    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('should verify a valid JWT', async () => {
    const token = await createJWT(payload, secret);
    const verified = await verifyJWT<typeof payload>(token, secret);

    expect(verified).not.toBeNull();
    if (verified) {
      expect(verified.sub).toBe(125);
      expect(verified.username).toBe('test-user');
    }
  });

  it('should reject an invalid JWT', async () => {
    const verified = await verifyJWT<JWTPayload>('invalid-token', secret);

    expect(verified).toBeNull();
  });

  it('should extract JWT from cookie header', () => {
    const cookieHeader = 'token=abc123; other=value';
    const token = getJWTFromCookie(cookieHeader);

    expect(token).toBe('abc123');
  });

  it('should return null when no token found in cookie', () => {
    const cookieHeader = 'other=value; another=test';
    const token = getJWTFromCookie(cookieHeader);

    expect(token).toBeNull();
  })
});
