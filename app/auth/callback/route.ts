import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServerClient'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')

  if (code) {
    const supabase = createServerSupabaseClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL))
}
