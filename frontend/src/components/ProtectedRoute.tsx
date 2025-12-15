import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/lib/auth"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, checkAuth } = useAuth()
  const location = useLocation()

  // Check auth status on mount
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (!isAuthenticated) {
    // Redirect to login, saving the location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
