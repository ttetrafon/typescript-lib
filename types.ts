export interface JWTPayload {
  sub: string | number;
  username: string;
  iat: number;
  exp: number;
}

export interface SessionData {
  sessionId: string;
  expiresAt: number;
}
