// lib/supabaseServerClient.ts
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * Use this in server components (default in App Router), server actions,
 * route handlers (app/api/*), and other server-side code.
 * This file imports `next/headers`, so it MUST NOT be used in client components.
 */
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options?: Record<string, any>) {
          cookieStore.set({ name, value, ...(options || {}) } as any)
        },
        remove(name: string, options?: Record<string, any>) {
          cookieStore.set({ name, value: '', ...(options || {}) } as any)
        },
      },
    }
  )
}
