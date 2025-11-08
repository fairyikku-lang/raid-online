// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServerClient'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')

  // jeśli nie ma code – wracamy do logowania
  if (!code) {
    return NextResponse.redirect(new URL('/signin', url.origin))
  }

  const supabase = createServerSupabaseClient()

  // wymiana "code" z linka na sesję + cookie
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(new URL('/signin?error=auth', url.origin))
  }

  // ✅ tutaj już POWINNA być założona sesja
  // wybierz gdzie chcesz lądować po zalogowaniu:
  return NextResponse.redirect(new URL('/heroes', url.origin))
  // albo np.: new URL('/heroes', url.origin)
}
