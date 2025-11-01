import type { DashboardUser } from '../dashboard/web/types.js';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends DashboardUser {}

    interface Request {
      user?: DashboardUser;
      login(user: DashboardUser, done: (err?: unknown) => void): void;
      logout(callback: (err?: unknown) => void): void;
      isAuthenticated(): boolean;
    }
  }
}

export {};
