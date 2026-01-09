import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { searchTranscripts, type Transcript } from "@/lib/api"
import { Search as SearchIcon, User, Bot, ArrowUpRight, Lightbulb, Sparkles } from "lucide-react"
import { Illustration } from "@/components/Illustration"
import { cn } from "@/lib/utils"

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Highlight matching text in search results
function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text

  // Escape special regex characters in query
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const regex = new RegExp(`(${escapedQuery})`, "gi")
  const parts = text.split(regex)

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-primary/30 text-primary-foreground px-1 rounded font-medium">
        {part}
      </mark>
    ) : (
      part
    )
  )
}

// Loading skeleton
function SearchResultsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-start gap-4 p-4 border border-border/30 rounded-xl">
          <div className="skeleton h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton h-16 w-full rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function Search() {
  const [query, setQuery] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const { data: results, isLoading, error } = useQuery<Transcript[]>({
    queryKey: ["search", searchQuery],
    queryFn: () => searchTranscripts(searchQuery, 50),
    enabled: searchQuery.length > 0,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(query.trim())
  }

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card className="card-interactive overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <CardHeader className="relative">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <SearchIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Ricerca Trascrizioni</CardTitle>
              <CardDescription>
                Inserisci parole chiave per cercare in tutte le conversazioni
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cerca parole chiave..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-11 h-12 text-base"
              />
            </div>
            <Button
              type="submit"
              disabled={!query.trim()}
              className="h-12 px-6 gap-2"
            >
              <SearchIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Cerca</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {searchQuery && (
        <Card className="card-interactive">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Risultati</CardTitle>
                <CardDescription>
                  {isLoading
                    ? "Ricerca in corso..."
                    : error
                      ? "Errore durante la ricerca"
                      : `${results?.length || 0} risultati per "${searchQuery}"`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SearchResultsSkeleton />
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="p-4 rounded-2xl bg-destructive/10 mb-4">
                  <SearchIcon className="h-8 w-8 text-destructive" />
                </div>
                <p className="text-destructive font-medium">
                  Impossibile cercare nelle trascrizioni
                </p>
              </div>
            ) : results && results.length > 0 ? (
              <div className="space-y-3">
                {results.map((transcript, index) => (
                  <div
                    key={transcript.id}
                    className={cn(
                      "p-4 rounded-xl border border-border/30 transition-all duration-200",
                      "hover:bg-muted/30 hover:border-primary/30 hover:shadow-card",
                      "animate-fade-in-up"
                    )}
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                          transcript.speaker === "user"
                            ? "bg-gradient-to-br from-primary to-primary/80"
                            : "bg-gradient-to-br from-muted to-muted/50"
                        )}>
                          {transcript.speaker === "user" ? (
                            <User className="h-4 w-4 text-primary-foreground" />
                          ) : (
                            <Bot className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge className={transcript.speaker === "user" ? "badge-info" : ""}>
                              {transcript.speaker === "user" ? "Utente" : transcript.agentName || "Agente"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(transcript.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed break-words">
                            {highlightText(transcript.text, searchQuery)}
                          </p>
                        </div>
                      </div>
                      {transcript.callSid && (
                        <Link
                          to={`/calls/${transcript.callSid}`}
                          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 whitespace-nowrap shrink-0 group"
                        >
                          <span className="hidden sm:inline">Vedi chiamata</span>
                          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 animate-fade-in">
                <Illustration
                  name="empty-search"
                  alt="Nessun risultato trovato"
                  width={200}
                  className="mx-auto mb-6 opacity-80"
                />
                <p className="text-lg font-medium text-muted-foreground">
                  Nessun risultato per "{searchQuery}"
                </p>
                <p className="text-sm text-muted-foreground/70 mt-2">
                  Prova con parole chiave diverse o più generiche
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search Tips - Always visible */}
      <Card className="card-interactive border-border/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-warning/10">
              <Lightbulb className="h-5 w-5 text-warning" />
            </div>
            <CardTitle>Suggerimenti per la Ricerca</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              "La ricerca non distingue maiuscole e minuscole",
              "Prova a cercare nomi di aziende, prodotti o argomenti discussi",
              "Cerca frasi specifiche come \"richiesta di richiamo\" o \"supporto tecnico\"",
              "I risultati mostrano sia i messaggi degli utenti che quelli dell'agente",
            ].map((tip, index) => (
              <li
                key={index}
                className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/30"
              >
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-primary">{index + 1}</span>
                </div>
                <span className="text-sm text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
