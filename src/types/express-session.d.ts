import "express-session";
import { Session } from "express-session";

declare module "express-serve-static-core" {
  interface Request {
    session: Session & {
      user?: {
        username?: string;
      };
    };
  }
}

export {};