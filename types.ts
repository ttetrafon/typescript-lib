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

export type PathType = 'WebPage' | 'Dialog';
export type Route = {
  content: string;
  title: string;
  description: string;
  pathType: PathType;
  navData?: Record<string, unknown>;
}

export type RouteInfo = {
  content: string;
  title: string;
  description: string;
  canonicalUrl: string;
  structuredData: object;
  navData?: Record<string, unknown>;
}
