import { Link, useLocation, Outlet } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Phone,
  PhoneCall,
  MessageSquare,
  Search,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/calls", label: "Calls", icon: Phone },
  { to: "/callbacks", label: "Callbacks", icon: PhoneCall },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/search", label: "Search", icon: Search },
]

export function Layout() {
  const location = useLocation()

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link to="/" className="mr-6 flex items-center space-x-2">
              <Phone className="h-6 w-6" />
              <span className="font-bold">Comtel Voice Dashboard</span>
            </Link>
          </div>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-2 transition-colors hover:text-foreground/80",
                  location.pathname === to
                    ? "text-foreground"
                    : "text-foreground/60"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container py-6">
        <Outlet />
      </main>
    </div>
  )
}
