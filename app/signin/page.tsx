import { createBrowserSupabaseClient } from '@/lib/supabaseBrowserClient'
'use client'

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
        shouldCreateUser: false, // ✅ tylko zaproszeni użytkownicy
      },
    })

    if (error) {
      console.error(error.message)
      alert('Błąd logowania: ' + error.message)
      return
    }

    alert('Wysłałem link logowania na maila 🙂')
  }

  // ...reszta JSX (formularz)
}
