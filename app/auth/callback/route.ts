// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServerClient'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')

  // Brak code → wróć do logowania
  if (!code) {
    return NextResponse.redirect(new URL('/signin', url.origin))
  }

  const supabase = createServerSupabaseClient()

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(new URL('/signin?error=auth', url.origin))
  }

  // ✅ Sesja ustawiona — przekierowujemy użytkownika np. na stronę główną
  return NextResponse.redirect(new URL('/', url.origin))
}
