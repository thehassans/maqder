import { Outlet, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function AuthLayout() {
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  // Only redirect when we are SURE the user is logged in.
  // Never block the login form with a loading screen — the login button
  // already has its own spinner, and showing a blank/loading screen here
  // causes stuck-screen issues (stale token, getMe timeout, race conditions).
  if (isAuthenticated && user) {
    if (user?.role === 'super_admin') return <Navigate to="/super-admin" replace />
    if (user?.role === 'reseller') return <Navigate to="/reseller" replace />
    return <Navigate to="/app/dashboard" replace />
  }

  return <Outlet />
}
