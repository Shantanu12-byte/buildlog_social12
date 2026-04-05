import { Navigate, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  session: any
}

const ProtectedRoute = ({ session }: Props) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      setIsAdmin(false)
      setLoading(false)
      return
    }

    const checkRole = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (error || !data || data.role !== 'admin') {
          setIsAdmin(false)
        } else {
          setIsAdmin(true)
        }
      } catch (err) {
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkRole()
  }, [session])

  if (!session) return <Navigate to="/login" replace />
  
  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0a]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
  </div>

  if (isAdmin === false) return <Navigate to="/login" replace />

  return <Outlet />
}

export default ProtectedRoute
