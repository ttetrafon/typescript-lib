////////////////////////
//   AUTHENTICATION   //
////////////////////////

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

////////////////////
//   NAVIGATION   //
////////////////////

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

///////////////
//   STATE   //
///////////////

export type BroadcastMessageType = 'create-observable' | 'receive-state' | 'request-state' | 'update-observable';

export type BroadcastMessage = {
  type: BroadcastMessageType;
  name: string;
  data: any;
  time: number;
};

export type Listener = (subscriber: string, property: string, updatedValue: any) => void;
