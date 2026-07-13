import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      role: string;
      country: string | null;
      kycLevel: number;
    };
    // Surfaced from the backend so the AppShell can sync it to localStorage
    // via `setAccessToken()` for the api-client Authorization header.
    accessToken?: string;
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    country: string | null;
    kycLevel: number;
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    country: string | null;
    kycLevel: number;
    accessToken?: string;
  }
}
