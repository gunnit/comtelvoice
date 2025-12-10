import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { searchTranscripts, type Transcript } from "@/lib/api"
import { Search as SearchIcon, User, Bot, ArrowRight } from "lucide-react"

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground">
          Search through conversation transcripts
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Search Transcripts</CardTitle>
          <CardDescription>
            Enter keywords to search across all conversations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="Search for keywords..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={!query.trim()}>
              <SearchIcon className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {searchQuery && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              {isLoading
                ? "Searching..."
                : error
                ? "Error loading results"
                : `${results?.length || 0} matches found for "${searchQuery}"`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <p className="text-destructive text-center py-8">
                Failed to search transcripts
              </p>
            ) : results && results.length > 0 ? (
              <div className="space-y-3">
                {results.map((transcript) => (
                  <div
                    key={transcript.id}
                    className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            transcript.speaker === "user"
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
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={transcript.speaker === "user" ? "default" : "secondary"}>
                              {transcript.speaker === "user" ? "User" : transcript.agentName || "Agent"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(transcript.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm">{transcript.text}</p>
                        </div>
                      </div>
                      <Link
                        to={`/calls/${transcript.callId}`}
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        View call
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No matches found for "{searchQuery}"
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search Tips */}
      {!searchQuery && (
        <Card>
          <CardHeader>
            <CardTitle>Search Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Search is case-insensitive</li>
              <li>• Try searching for company names, products, or topics discussed</li>
              <li>• Search for specific phrases like "callback request" or "technical support"</li>
              <li>• Results show both user and agent messages</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
