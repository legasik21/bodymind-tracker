import { useState, FormEvent } from 'react'
import { supabase } from '../lib/supabase'

type AuthMode = 'signin' | 'signup'

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleEmailAuth(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        // Redirect handled by auth state listener in main.tsx
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSuccess('Перевірте свою пошту для підтвердження!')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Сталася помилка')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleAuth() {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      })
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Сталася помилка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090c11] px-4">
      <div className="glass-panel w-full max-w-md rounded-[30px] p-6 sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-white">Вітаю!</h1>
          <p className="mt-2 text-sm text-white/60">
            {mode === 'signin' ? 'Увійди, щоб продовжити' : 'Створи акаунт для старту'}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-2xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 py-3 text-sm text-[var(--color-accent)]">
            {success}
          </div>
        )}

        <form className="grid gap-4" onSubmit={handleEmailAuth}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-white outline-hidden transition-colors placeholder:text-white/28 focus-visible:border-[var(--color-accent)]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70" htmlFor="password">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-white outline-hidden transition-colors placeholder:text-white/28 focus-visible:border-[var(--color-accent)]"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex min-h-[52px] items-center justify-center rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[#07110c] transition-colors hover:bg-[#74e4b1] disabled:opacity-50"
          >
            {loading ? 'Зачекай…' : mode === 'signin' ? 'Увійти' : 'Зареєструватися'}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-white/40">або</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="inline-flex min-h-[52px] w-full items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          <svg className="size-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Увійти через Google
        </button>

        <p className="mt-6 text-center text-sm text-white/50">
          {mode === 'signin' ? (
            <>
              Немає акаунту?{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null); setSuccess(null) }}
                className="font-medium text-[var(--color-accent)] hover:underline"
              >
                Зареєструйся
              </button>
            </>
          ) : (
            <>
              Вже є акаунт?{' '}
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); setSuccess(null) }}
                className="font-medium text-[var(--color-accent)] hover:underline"
              >
                Увійди
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}