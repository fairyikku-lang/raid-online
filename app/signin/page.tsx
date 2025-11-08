'use client'                           // ← TO MUSI BYĆ NA SAMEJ GÓRZE!

import { useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabaseBrowserClient'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const supabase = createBrowserSupabaseClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          'https://raid-online-cat1.vercel.app/auth/callback',
        shouldCreateUser: false,
      },
    })

    if (error) {
      console.error(error.message)
      alert('Błąd logowania: ' + error.message)
      return
    }

    alert('Wysłano link logowania na maila ✅')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
      <h2>Logowanie bez hasła</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="twoj@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit">Wyślij link</button>
      </form>
    </div>
  )
}
