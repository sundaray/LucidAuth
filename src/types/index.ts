import type { AnyAuthProvider } from '../providers/types.js';

export interface SignInOptions {
  redirectTo?: `/${string}`;
}

export interface AuthConfig {
  baseUrl: string;
  session: {
    secret: string;
    maxAge: number;
  };
  providers: AnyAuthProvider[];
}
