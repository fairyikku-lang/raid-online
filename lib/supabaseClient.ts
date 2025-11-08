// lib/supabaseClient.ts
import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Tworzy klienta Supabase, który działa zarówno po stronie przeglądarki (CSR),
 * jak i serwera (SSR). 
 * Nie korzysta z next/headers, więc nie powoduje błędów podczas builda na Vercel.
 */
export const createClient = () => {
  if (typeof window === 'undefined') {
    // SSR (Vercel, build) – bez ciasteczek, tylko do odczytu publicznych danych
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get() { return '' },
          set(_name: string, _value: string, _options: CookieOptions) { /* nic */ },
          remove(_name: string, _options: CookieOptions) { /* nic */ },
        },
      }
    );
  }

  // CSR (przeglądarka, lokalne UI)
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};
