// lib/supabaseBrowserClient.ts
import { createBrowserClient } from '@supabase/ssr'

/**
 * Use this ONLY in client components (files that start with 'use client'),
 * event handlers, effects, etc.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
