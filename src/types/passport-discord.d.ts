declare module 'passport-discord' {
  import type { Profile as PassportProfile, Strategy as PassportStrategy } from 'passport';

  export interface Profile extends PassportProfile {
    id: string;
    username: string;
    avatar: string | null;
    discriminator?: string;
  }

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope: string[];
  }

  export type VerifyFunction = (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: unknown, user?: unknown) => void
  ) => void;

  export class Strategy extends PassportStrategy {
    constructor(options: StrategyOptions, verify: VerifyFunction);
  }
}
