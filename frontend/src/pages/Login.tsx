import { useState } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { useAuth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Headphones, ArrowRight, Sparkles, Shield, Loader2 } from "lucide-react"
import { Illustration } from "@/components/Illustration"

export function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading } = useAuth()

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const result = await login(email, password)

    if (result.success) {
      navigate(from, { replace: true })
    } else {
      setError(result.error || "Login fallito")
    }
  }

  return (
    <div className="min-h-screen flex bg-background bg-noise relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-float" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-chart-3/20 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      </div>

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        <div className="relative z-10 max-w-lg space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-glow-lg animate-pulse-glow">
              <Headphones className="h-8 w-8 text-primary-foreground" />
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-success animate-pulse-dot" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Comtel Voice Agent</h1>
              <p className="text-secondary-foreground">AI-Powered Receptionist</p>
            </div>
          </div>

          {/* Tagline */}
          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight">
              Gestisci le chiamate con{" "}
              <span className="text-gradient">intelligenza artificiale</span>
            </h2>
            <p className="text-lg text-secondary-foreground leading-relaxed">
              Il tuo assistente vocale AI che risponde, gestisce richieste e trasferisce chiamate in modo autonomo, 24 ore su 24.
            </p>
          </div>

          {/* Features */}
          <div className="grid gap-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/30 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Conversazioni Naturali</p>
                <p className="text-sm text-foreground/80">Powered by OpenAI Realtime API</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/30 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-success/10">
                <Shield className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-semibold">Sicuro & Affidabile</p>
                <p className="text-sm text-foreground/80">Infrastruttura enterprise-grade</p>
              </div>
            </div>
          </div>

          {/* Illustration */}
          <div className="flex justify-center mt-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Illustration
              name="login-welcome"
              alt="Assistente vocale AI"
              width={280}
              className="opacity-90"
            />
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-glow">
              <Headphones className="h-6 w-6 text-primary-foreground" />
              <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-success animate-pulse-dot" />
            </div>
            <span className="text-xl font-bold">Comtel Voice Agent</span>
          </div>

          <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
            <CardHeader className="text-center space-y-2 pb-4">
              <CardTitle className="text-2xl font-bold">Bentornato</CardTitle>
              <CardDescription className="text-base">
                Accedi per gestire il tuo assistente vocale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl text-sm font-medium flex items-center gap-2 animate-scale-in">
                    <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold" htmlFor="email">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@azienda.it"
                    required
                    autoComplete="email"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold" htmlFor="password">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-12"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base gap-2 group"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Accesso in corso...
                    </>
                  ) : (
                    <>
                      Accedi
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </form>

              {/* Demo credentials hint */}
              <div className="mt-6 pt-6 border-t border-border/50">
                <p className="text-xs text-muted-foreground text-center">
                  Credenziali demo:{" "}
                  <code className="px-1.5 py-0.5 bg-muted rounded text-foreground font-mono">
                    admin@comtelitalia.it
                  </code>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Back to landing */}
          <div className="text-center">
            <Link
              to="/"
              className="text-sm text-foreground/80 hover:text-primary transition-colors"
            >
              Torna alla pagina principale
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
