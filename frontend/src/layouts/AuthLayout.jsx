import { Outlet, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function AuthLayout() {
  const { isAuthenticated, isLoading, user } = useSelector((state) => state.auth)

  if (isLoading) return null
  
  if (isAuthenticated) {
    // Redirect super_admin to super admin dashboard
    if (user?.role === 'super_admin') {
      return <Navigate to="/super-admin" replace />
    }
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
