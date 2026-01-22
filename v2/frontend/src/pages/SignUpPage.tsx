import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Check } from 'lucide-react'
import { AuthLayout } from '@/components/AuthLayout'
import { useAuth } from '@/hooks/useAuth'

export function SignUpPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }



    setIsLoading(true)

    try {
      await register(username, password)
      setSuccess(true)
      // Redirect to login after short delay
      setTimeout(() => navigate('/login'), 1500)
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout title="Account created!" subtitle="Redirecting you to login...">
        <div className="flex flex-col items-center py-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <p className="text-neutral-400">Your account has been created successfully.</p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Create account" subtitle="Join michi-reader to save your favorite links">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-neutral-300 mb-1.5">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            autoComplete="username"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                       text-white placeholder:text-neutral-500
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
                       transition-all"
            placeholder="Choose a username"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                       text-white placeholder:text-neutral-500
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
                       transition-all"
            placeholder="Create a password"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-300 mb-1.5">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                       text-white placeholder:text-neutral-500
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
                       transition-all"
            placeholder="Confirm your password"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !username || !password || !confirmPassword}
          className="w-full py-3 px-4 rounded-xl font-semibold
                     bg-gradient-to-r from-blue-500 to-purple-600 text-white
                     hover:from-blue-600 hover:to-purple-700
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40
                     flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </button>

        <p className="text-center text-neutral-400 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
