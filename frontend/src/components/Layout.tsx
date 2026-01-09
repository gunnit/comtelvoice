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
  Bell,
  Moon,
  Sun,
  LogOut,
  Settings,
  Headphones,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/lib/auth"
import { useQuery } from "@tanstack/react-query"
import { getStats, type Stats } from "@/lib/api"

// Badge key type for nav items that show counts
type BadgeKey = "pendingCallbacks" | "unreadMessages" | null

interface NavItem {
  to: string
  label: string
  icon: React.ElementType
  badgeKey?: BadgeKey
  badgeVariant?: "warning" | "destructive" | "info"
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navItems: NavGroup[] = [
  {
    title: "Panoramica",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/calls", label: "Chiamate", icon: Phone },
      { to: "/callbacks", label: "Richiami", icon: PhoneCall, badgeKey: "pendingCallbacks", badgeVariant: "warning" },
      { to: "/messages", label: "Messaggi", icon: MessageSquare, badgeKey: "unreadMessages", badgeVariant: "destructive" },
      { to: "/search", label: "Cerca", icon: Search },
    ]
  },
  {
    title: "Sistema",
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
  const [isDark, setIsDark] = useState(true) // Default to dark mode

  // Touch swipe state for mobile sidebar
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const sidebarRef = useRef<HTMLElement>(null)

  // Fetch stats for notification badges
  const { data: stats } = useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: getStats,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000,
  })

  // Get badge count for a nav item
  const getBadgeCount = (badgeKey?: BadgeKey): number => {
    if (!badgeKey || !stats) return 0
    return stats[badgeKey] || 0
  }

  // Check for dark mode preference
  useEffect(() => {
    // Default to dark mode for the new design
    if (!document.documentElement.classList.contains('light')) {
      setIsDark(true)
    } else {
      setIsDark(false)
    }
  }, [])

  // Handle swipe gestures for mobile sidebar
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchEndX.current = null
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!touchStartX.current || !touchEndX.current) return

    const distance = touchStartX.current - touchEndX.current
    const minSwipeDistance = 50

    // Swipe left to close sidebar
    if (distance > minSwipeDistance && sidebarOpen) {
      setSidebarOpen(false)
    }
    // Swipe right to open sidebar (only from left edge)
    if (distance < -minSwipeDistance && touchStartX.current < 30 && !sidebarOpen) {
      setSidebarOpen(true)
    }

    touchStartX.current = null
    touchEndX.current = null
  }, [sidebarOpen])

  // Global touch handler for opening sidebar from left edge
  useEffect(() => {
    const handleGlobalTouchStart = (e: TouchEvent) => {
      if (e.touches[0].clientX < 20) {
        touchStartX.current = e.touches[0].clientX
      }
    }

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (touchStartX.current !== null) {
        touchEndX.current = e.touches[0].clientX
      }
    }

    const handleGlobalTouchEnd = () => {
      if (touchStartX.current !== null && touchEndX.current !== null) {
        const distance = touchEndX.current - touchStartX.current
        if (distance > 50 && touchStartX.current < 30) {
          setSidebarOpen(true)
        }
      }
      touchStartX.current = null
      touchEndX.current = null
    }

    document.addEventListener('touchstart', handleGlobalTouchStart, { passive: true })
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: true })
    document.addEventListener('touchend', handleGlobalTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleGlobalTouchStart)
      document.removeEventListener('touchmove', handleGlobalTouchMove)
      document.removeEventListener('touchend', handleGlobalTouchEnd)
    }
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const toggleDarkMode = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('light')
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

  // Total pending items for notification bell
  const totalPendingItems = (stats?.pendingCallbacks || 0) + (stats?.unreadMessages || 0)

  return (
    <div className="min-h-screen bg-background bg-noise">
      {/* Skip Navigation Link - Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Vai al contenuto principale
      </a>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="navigation"
        aria-label="Menu principale"
        className={cn(
          "fixed top-0 left-0 z-50 h-full sidebar transition-all duration-300 ease-out flex flex-col border-r border-sidebar-border/50",
          sidebarCollapsed ? "w-[72px]" : "w-[280px]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Sidebar Header */}
        <div className={cn(
          "flex h-18 items-center border-b border-sidebar-border/50 px-4",
          sidebarCollapsed ? "justify-center" : "justify-between"
        )}>
          {!sidebarCollapsed && (
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-glow transition-all duration-300 group-hover:shadow-glow-lg">
                <Headphones className="h-5 w-5 text-primary-foreground" />
                <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success animate-pulse-dot" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-sidebar-foreground">Comtel</span>
                <span className="text-xs text-sidebar-foreground/50 font-medium">Voice Agent</span>
              </div>
            </Link>
          )}
          {sidebarCollapsed && (
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-glow">
              <Headphones className="h-5 w-5 text-primary-foreground" />
              <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success animate-pulse-dot" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto sidebar-scrollbar p-3 space-y-6">
          {navItems.map((group, groupIndex) => (
            <div key={group.title} className={cn(groupIndex > 0 && "pt-4 border-t border-sidebar-border/30")}>
              {!sidebarCollapsed && (
                <h4 className="mb-3 px-3 text-[10px] font-bold tracking-widest text-sidebar-foreground/40 uppercase">
                  {group.title}
                </h4>
              )}
              <div className="space-y-1">
                {group.items.map(({ to, label, icon: Icon, badgeKey, badgeVariant }) => {
                  const active = isActive(to)
                  const badgeCount = getBadgeCount(badgeKey)
                  return (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "sidebar-nav-item group relative",
                        active && "active",
                        sidebarCollapsed && "justify-center px-2"
                      )}
                      title={sidebarCollapsed ? `${label}${badgeCount > 0 ? ` (${badgeCount})` : ''}` : undefined}
                      aria-current={active ? "page" : undefined}
                    >
                      {/* Active indicator bar */}
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sidebar-primary-foreground rounded-r-full" />
                      )}
                      <Icon className={cn(
                        "h-[18px] w-[18px] flex-shrink-0 transition-colors",
                        active ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
                      )} />
                      {!sidebarCollapsed && (
                        <>
                          <span className="font-medium flex-1">{label}</span>
                          {/* Badge for counts */}
                          {badgeCount > 0 && (
                            <span
                              className={cn(
                                "min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center transition-all",
                                badgeVariant === "warning" && "bg-warning/20 text-warning",
                                badgeVariant === "destructive" && "bg-destructive/20 text-destructive",
                                badgeVariant === "info" && "bg-info/20 text-info",
                                active && "bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground"
                              )}
                            >
                              {badgeCount > 99 ? "99+" : badgeCount}
                            </span>
                          )}
                        </>
                      )}
                      {active && !sidebarCollapsed && badgeCount === 0 && (
                        <Sparkles className="ml-auto h-3 w-3 text-sidebar-primary-foreground/70" />
                      )}
                      {/* Badge dot for collapsed sidebar */}
                      {sidebarCollapsed && badgeCount > 0 && (
                        <span
                          className={cn(
                            "absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full",
                            badgeVariant === "warning" && "bg-warning",
                            badgeVariant === "destructive" && "bg-destructive",
                            badgeVariant === "info" && "bg-info"
                          )}
                        />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-sidebar-border/50 p-3 space-y-2">
          {/* User Info in Sidebar */}
          {user && !sidebarCollapsed && (
            <div className="px-3 py-2 rounded-xl bg-sidebar-accent/50 mb-2">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
                  <p className="text-xs text-sidebar-foreground/50 truncate">{user.companyName || 'Admin'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Collapse Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground hidden lg:flex transition-all duration-200",
              sidebarCollapsed && "justify-center px-2"
            )}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <ChevronsLeft className={cn(
              "h-4 w-4 transition-transform duration-300",
              sidebarCollapsed && "rotate-180"
            )} />
            {!sidebarCollapsed && <span className="ml-2 font-medium">Comprimi</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn(
        "min-h-screen transition-all duration-300 flex flex-col",
        sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[280px]"
      )}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 border-b border-border/50">
          <div className="glass h-16 flex items-center gap-4 px-4 lg:px-6">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-accent"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>

            {/* Page Title */}
            <div className="flex-1">
              <h1 className="text-lg font-bold tracking-tight">
                {getPageTitle()}
              </h1>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-1.5">
              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="h-9 w-9 rounded-xl hover:bg-accent transition-colors"
                aria-label={isDark ? "Passa al tema chiaro" : "Passa al tema scuro"}
                aria-pressed={isDark}
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl relative hover:bg-accent transition-colors"
                aria-label={`Notifiche${totalPendingItems > 0 ? ` (${totalPendingItems} da gestire)` : ''}`}
              >
                <Bell className="h-4 w-4" />
                {totalPendingItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-scale-in">
                    {totalPendingItems > 9 ? "9+" : totalPendingItems}
                  </span>
                )}
              </Button>

              {/* Separator */}
              <div className="h-6 w-px bg-border/50 mx-1 hidden md:block" />

              {/* User Info */}
              {user && (
                <div className="hidden md:flex items-center gap-3 px-2">
                  <div className="text-right">
                    <p className="text-sm font-semibold">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.companyName || user.email}</p>
                  </div>
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                    <span className="text-sm font-bold text-primary">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                </div>
              )}

              {/* Logout */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={handleLogout}
                aria-label="Esci dall'account"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main id="main-content" className="flex-1 p-4 lg:p-6 animate-fade-in" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
