import { useEffect } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export function ProtectedRoute() {
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login', { replace: true })
    }
  }, [user, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-pulse rounded-full bg-accent/30" />
      </div>
    )
  }

  if (!user) return null

  return <Outlet />
}
