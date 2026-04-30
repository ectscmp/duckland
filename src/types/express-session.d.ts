
declare module "express-session" {
  interface SessionData {
    user?: {
      username?: string;
      email?: string;
      name?: string;
    };
  }
}

export {};
