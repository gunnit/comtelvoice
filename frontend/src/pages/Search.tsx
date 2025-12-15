import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { searchTranscripts, type Transcript } from "@/lib/api"
import { Search as SearchIcon, User, Bot, ArrowRight, Lightbulb } from "lucide-react"

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
      <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
        {part}
      </mark>
    ) : (
      part
    )
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
      <Card>
        <CardHeader>
          <CardTitle>Ricerca Trascrizioni</CardTitle>
          <CardDescription>
            Inserisci parole chiave per cercare in tutte le conversazioni
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="Cerca parole chiave..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 h-10 sm:h-9 text-base sm:text-sm"
            />
            <Button type="submit" disabled={!query.trim()} className="h-10 sm:h-9 px-3 sm:px-4">
              <SearchIcon className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Cerca</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {searchQuery && (
        <Card>
          <CardHeader>
            <CardTitle>Risultati</CardTitle>
            <CardDescription>
              {isLoading
                ? "Ricerca in corso..."
                : error
                  ? "Errore durante la ricerca"
                  : `${results?.length || 0} risultati per "${searchQuery}"`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <p className="text-destructive text-center py-8">
                Impossibile cercare nelle trascrizioni
              </p>
            ) : results && results.length > 0 ? (
              <div className="space-y-3">
                {results.map((transcript) => (
                  <div
                    key={transcript.id}
                    className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div
                          className={`p-2 rounded-full shrink-0 ${transcript.speaker === "user"
                              ? "bg-primary"
                              : "bg-muted"
                            }`}
                        >
                          {transcript.speaker === "user" ? (
                            <User className="h-4 w-4 text-primary-foreground" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant={transcript.speaker === "user" ? "default" : "secondary"}>
                              {transcript.speaker === "user" ? "Utente" : transcript.agentName || "Agente"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(transcript.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm break-words">
                            {highlightText(transcript.text, searchQuery)}
                          </p>
                        </div>
                      </div>
                      <Link
                        to={`/calls/${transcript.callId}`}
                        className="flex items-center gap-1 text-sm text-primary hover:underline whitespace-nowrap shrink-0"
                      >
                        <span className="hidden sm:inline">Vedi chiamata</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nessun risultato per "{searchQuery}"
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Prova con parole chiave diverse o più generiche
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search Tips - Always visible */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Suggerimenti per la Ricerca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>La ricerca non distingue maiuscole e minuscole</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Prova a cercare nomi di aziende, prodotti o argomenti discussi</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Cerca frasi specifiche come "richiesta di richiamo" o "supporto tecnico"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>I risultati mostrano sia i messaggi degli utenti che quelli dell'agente</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
