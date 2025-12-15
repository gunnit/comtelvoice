import { Link, useLocation, Outlet, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Phone,
  PhoneCall,
  MessageSquare,
  Search,
  Menu,
  X,
  ChevronsLeft,
  Command,
  Bell,
  Moon,
  Sun,
  LogOut,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"

const navItems = [
  {
    title: "General",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/calls", label: "Chiamate", icon: Phone },
      { to: "/callbacks", label: "Richiami", icon: PhoneCall },
      { to: "/messages", label: "Messaggi", icon: MessageSquare },
      { to: "/search", label: "Cerca", icon: Search },
    ]
  },
  {
    title: "Configurazione",
    items: [
      { to: "/settings", label: "Impostazioni", icon: Settings },
    ]
  },
]

export function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isDark, setIsDark] = useState(false)

  // Check for dark mode preference
  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark')
    setIsDark(isDarkMode)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const toggleDarkMode = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/"
    return location.pathname.startsWith(path)
  }

  const getPageTitle = () => {
    for (const group of navItems) {
      const item = group.items.find(item => isActive(item.to))
      if (item) return item.label
    }
    return "Dashboard"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full sidebar transition-all duration-300 ease-in-out flex flex-col",
          sidebarCollapsed ? "w-[70px]" : "w-[280px]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Sidebar Header */}
        <div className={cn(
          "flex h-16 items-center border-b px-4",
          sidebarCollapsed ? "justify-center" : "justify-between",
          "border-[hsl(var(--sidebar-border))]"
        )}>
          {!sidebarCollapsed && (
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--sidebar-primary))]">
                <Command className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[hsl(var(--sidebar-foreground))]">Comtel</span>
                <span className="text-xs text-[hsl(var(--sidebar-foreground)/0.6)]">Voice Agent</span>
              </div>
            </Link>
          )}
          {sidebarCollapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--sidebar-primary))]">
              <Command className="h-4 w-4 text-white" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto sidebar-scrollbar p-3 space-y-6">
          {navItems.map((group) => (
            <div key={group.title}>
              {!sidebarCollapsed && (
                <h4 className="mb-2 px-3 text-xs font-semibold tracking-wider text-[hsl(var(--sidebar-foreground)/0.5)] uppercase">
                  {group.title}
                </h4>
              )}
              <div className="space-y-1">
                {group.items.map(({ to, label, icon: Icon }) => {
                  const active = isActive(to)
                  return (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "sidebar-nav-item",
                        active && "active",
                        sidebarCollapsed && "justify-center px-2"
                      )}
                      title={sidebarCollapsed ? label : undefined}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {!sidebarCollapsed && <span>{label}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-[hsl(var(--sidebar-border))] p-3">
          {/* Collapse Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full text-[hsl(var(--sidebar-foreground)/0.7)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))] hidden lg:flex",
              sidebarCollapsed && "justify-center px-2"
            )}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <ChevronsLeft className={cn(
              "h-4 w-4 transition-transform",
              sidebarCollapsed && "rotate-180"
            )} />
            {!sidebarCollapsed && <span className="ml-2">Comprimi</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn(
        "min-h-screen transition-all duration-300 flex flex-col",
        sidebarCollapsed ? "lg:pl-[70px]" : "lg:pl-[280px]"
      )}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>

          {/* Page Title - shows on all screens */}
          <div className="flex-1">
            <h1 className="text-lg font-semibold">
              {getPageTitle()}
            </h1>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="h-9 w-9"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 relative"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
              <span className="sr-only">Notifications</span>
            </Button>

            {/* User Info */}
            {user && (
              <div className="flex items-center gap-2">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.companyName || user.email}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-muted"
                  title={user.name}
                >
                  <span className="text-sm font-medium">{user.name.charAt(0).toUpperCase()}</span>
                </Button>
              </div>
            )}

            {/* Logout */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={handleLogout}
              title="Esci"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
