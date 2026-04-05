import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Lock, Mail, AlertTriangle } from 'lucide-react'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      // Double check role for immediate feedback
      const { data: profile, error: roleError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (roleError || !profile || profile.role !== 'admin') {
        await supabase.auth.signOut()
        throw new Error('Access denied. Administrator role required.')
      }

      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Login failed')
      setLoading(false)
    }
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0a] p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex h-16 w-16 bg-purple-600 rounded-2xl items-center justify-center text-3xl mb-4">
            🔥
          </div>
          <h1 className="text-2xl font-bold tracking-tight">BUILDLOG ADMIN</h1>
          <p className="text-gray-400 mt-2">Secure Gateway • Employees Only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-start gap-3">
              <AlertTriangle size={20} className="shrink-0 mt-0.5" />
              <div className="text-sm font-medium">{error}</div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-400 ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" size={18} />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#111111] border border-[#1f2937] focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl py-3 pl-12 pr-4 outline-none transition-all placeholder:text-gray-600"
                placeholder="admin@buildlog.dev"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-400 ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" size={18} />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#111111] border border-[#1f2937] focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl py-3 pl-12 pr-4 outline-none transition-all placeholder:text-gray-600"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 active:scale-[0.98] transition-all py-4 rounded-xl font-bold flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Enter Dashboard →'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-xs">
            Buildlog Security Terminal • All access attempts are logged.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
