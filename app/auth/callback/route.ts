// app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServerClient'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/signin?error=missing_code`
    )
  }

  const supabase = createServerSupabaseClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('exchangeCodeForSession error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/signin?error=exchange_failed`
    )
  }

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/`)
}
