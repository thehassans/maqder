import { Outlet, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import LoadingScreen from '../components/ui/LoadingScreen'

export default function AuthLayout() {
  const { isAuthenticated, isLoading, user } = useSelector((state) => state.auth)

  // While a login request or session-verify is in flight, show a spinner
  // instead of null (which causes a white-screen flash).
  if (isLoading) return <LoadingScreen />
  
  if (isAuthenticated) {
    if (user?.role === 'super_admin') return <Navigate to="/super-admin" replace />
    if (user?.role === 'reseller') return <Navigate to="/reseller" replace />
    return <Navigate to="/app/dashboard" replace />
  }

  return <Outlet />
}
