import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from "react-router-dom"
import { LandingPage } from "@/pages/LandingPage"
import { Login } from "@/pages/Login"
import { Layout } from "@/components/Layout"
import { Dashboard } from "@/pages/Dashboard"
import { Calls } from "@/pages/Calls"
import { CallDetail } from "@/pages/CallDetail"
import { Callbacks } from "@/pages/Callbacks"
import { Messages } from "@/pages/Messages"
import { Search } from "@/pages/Search"
import { Settings } from "@/pages/Settings"
import { ProtectedRoute } from "@/components/ProtectedRoute"

// Handle 404 redirect for SPA routing on static hosts
function RedirectHandler() {
  const [searchParams] = useSearchParams()
  const route = searchParams.get('route')

  if (route) {
    return <Navigate to={decodeURIComponent(route)} replace />
  }

  return <LandingPage />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RedirectHandler />} />
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calls" element={<Calls />} />
          <Route path="/calls/:callSid" element={<CallDetail />} />
          <Route path="/callbacks" element={<Callbacks />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/search" element={<Search />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
