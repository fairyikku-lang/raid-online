import { NextResponse } from 'next/server'
import { createClientServer } from '@/lib/supabaseClient'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')

  if (code) {
    const supabase = createClientServer()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // po zalogowaniu wracamy na stronę główną
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL))
}
