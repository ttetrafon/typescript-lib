export interface JWTPayload {
  sub: number;
  username: string;
  iat: number;
  exp: number;
}

export interface SessionData {
  sessionId: string;
  expiresAt: number;
}
