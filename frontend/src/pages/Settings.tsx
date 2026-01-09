import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  getAgentConfig,
  updateAgentConfig,
  updateInstructions,
  updateKnowledgeBase,
  updateToolConfigs,
  previewInstructions,
  type AgentConfig,
  type AgentInstructions,
  type KnowledgeBase,
  type ToolConfig,
  type TransferDestination,
} from "@/lib/api"
import {
  Settings as SettingsIcon,
  Mic,
  Brain,
  Building,
  Wrench,
  Save,
  Eye,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Phone,
  Plus,
  Trash2,
  Activity,
  Globe,
  Clock,
  MapPin,
  Mail,
  Briefcase,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Voice options for OpenAI Realtime
const VOICE_OPTIONS = [
  { value: "alloy", label: "Alloy", description: "Neutra e bilanciata" },
  { value: "echo", label: "Echo", description: "Calda e profonda" },
  { value: "shimmer", label: "Shimmer", description: "Chiara e luminosa" },
  { value: "verse", label: "Verse", description: "Professionale" },
  { value: "coral", label: "Coral", description: "Amichevole" },
  { value: "sage", label: "Sage", description: "Saggia e calma" },
]

// Language options
const LANGUAGE_OPTIONS = [
  { value: "it", label: "Italiano", flag: "🇮🇹" },
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "de", label: "Deutsch", flag: "🇩🇪" },
  { value: "fr", label: "Français", flag: "🇫🇷" },
  { value: "es", label: "Español", flag: "🇪🇸" },
]

// Tool definitions for display
const TOOL_DEFINITIONS: Record<string, { label: string; description: string; icon: typeof Wrench }> = {
  get_company_info: { label: "Informazioni Azienda", description: "Fornisce informazioni sull'azienda", icon: Building },
  get_business_hours: { label: "Orari Apertura", description: "Fornisce gli orari di apertura", icon: Clock },
  get_location: { label: "Posizione Ufficio", description: "Fornisce l'indirizzo dell'ufficio", icon: MapPin },
  schedule_callback: { label: "Pianifica Richiamata", description: "Pianifica una richiamata per un cliente", icon: Phone },
  take_message: { label: "Prendi Messaggio", description: "Prende un messaggio per un dipendente", icon: Mail },
  transfer_call: { label: "Trasferisci Chiamata", description: "Trasferisce la chiamata a un altro numero", icon: Phone },
  verify_access_code: { label: "Verifica Codice", description: "Verifica il codice di accesso per i dati finanziari", icon: Shield },
  get_financial_summary: { label: "Sintesi Finanziaria", description: "Sintesi dei risultati finanziari", icon: Briefcase },
  get_balance_sheet: { label: "Stato Patrimoniale", description: "Dati dello stato patrimoniale", icon: Briefcase },
  get_income_statement: { label: "Conto Economico", description: "Ricavi, costi, margini", icon: Briefcase },
  get_financial_metrics: { label: "KPI Finanziari", description: "ROI, ROS, EBITDA e altri KPI", icon: Activity },
  get_business_lines: { label: "Linee di Business", description: "Ripartizione ricavi per linea", icon: Briefcase },
}

type TabId = "agent" | "instructions" | "knowledge" | "transfers" | "tools"

const TABS: { id: TabId; label: string; icon: typeof Mic }[] = [
  { id: "agent", label: "Agente", icon: Mic },
  { id: "instructions", label: "Istruzioni", icon: Brain },
  { id: "knowledge", label: "Knowledge Base", icon: Building },
  { id: "transfers", label: "Trasferimenti", icon: Phone },
  { id: "tools", label: "Strumenti", icon: Wrench },
]

// Loading skeleton
function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-8 w-48 rounded" />
          <div className="skeleton h-4 w-64 rounded" />
        </div>
        <div className="skeleton h-8 w-32 rounded-lg" />
      </div>
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-9 w-28 rounded-lg" />
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="skeleton h-6 w-40 rounded" />
          <div className="skeleton h-4 w-64 rounded" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-10 w-full rounded-lg" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function Settings() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabId>("agent")
  const [instructionPreview, setInstructionPreview] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [transferDestinations, setTransferDestinations] = useState<TransferDestination[]>([])

  // Fetch agent config
  const { data: fullConfig, isLoading, error } = useQuery({
    queryKey: ["agentConfig"],
    queryFn: getAgentConfig,
  })

  // Form state
  const [agentForm, setAgentForm] = useState<Partial<AgentConfig>>({})
  const [instructionsForm, setInstructionsForm] = useState<Partial<AgentInstructions>>({})
  const [knowledgeForm, setKnowledgeForm] = useState<Partial<KnowledgeBase>>({})
  const [toolsForm, setToolsForm] = useState<ToolConfig[]>([])

  // Initialize forms when data loads
  useEffect(() => {
    if (fullConfig) {
      setAgentForm(fullConfig.config)
      setInstructionsForm(fullConfig.instructions || {})
      setKnowledgeForm(fullConfig.knowledgeBase || {})
      setToolsForm(fullConfig.toolConfigs || [])
      setTransferDestinations(fullConfig.knowledgeBase?.transferDestinations || [])
    }
  }, [fullConfig])

  // Mutations
  const updateConfigMutation = useMutation({
    mutationFn: updateAgentConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentConfig"] })
      showSaveSuccess("Impostazioni agente salvate")
    },
  })

  const updateInstructionsMutation = useMutation({
    mutationFn: updateInstructions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentConfig"] })
      showSaveSuccess("Istruzioni salvate")
    },
  })

  const updateKnowledgeMutation = useMutation({
    mutationFn: updateKnowledgeBase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentConfig"] })
      showSaveSuccess("Knowledge base salvata")
    },
  })

  const updateToolsMutation = useMutation({
    mutationFn: updateToolConfigs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentConfig"] })
      showSaveSuccess("Strumenti aggiornati")
    },
  })

  const showSaveSuccess = (message: string) => {
    setSaveSuccess(message)
    setTimeout(() => setSaveSuccess(null), 3000)
  }

  const handlePreviewInstructions = async () => {
    try {
      const preview = await previewInstructions()
      setInstructionPreview(preview)
    } catch (err) {
      console.error("Failed to preview instructions:", err)
    }
  }

  if (isLoading) {
    return <SettingsSkeleton />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="p-4 rounded-2xl bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">Errore nel caricamento</p>
          <p className="text-sm text-muted-foreground mt-1">
            Impossibile caricare la configurazione dell'agente
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Riprova
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
            <SettingsIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Impostazioni Agente</h2>
            <p className="text-muted-foreground">Configura il tuo assistente vocale AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <Badge className="badge-success animate-fade-in-up">
              <Check className="h-3 w-3 mr-1" />
              {saveSuccess}
            </Badge>
          )}
          <Badge className="bg-primary/10 text-primary border-primary/20">
            <Mic className="h-3 w-3 mr-1" />
            {agentForm.agentName || "Arthur"}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-border/30">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "transition-all duration-200 gap-2",
                activeTab === tab.id && "shadow-glow"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </Button>
          )
        })}
      </div>

      {/* Agent Settings Tab */}
      {activeTab === "agent" && (
        <Card className="card-interactive">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none rounded-2xl" />
          <CardHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Mic className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Configurazione Agente</CardTitle>
                <CardDescription>Imposta nome, voce e parametri dell'assistente</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-6">
            {/* Agent Name */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">Nome Agente</label>
              <Input
                value={agentForm.agentName || ""}
                onChange={(e) => setAgentForm({ ...agentForm, agentName: e.target.value })}
                placeholder="Arthur"
                className="max-w-md"
              />
            </div>

            {/* Voice Selection */}
            <div className="grid gap-3">
              <label className="text-sm font-medium">Voce</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {VOICE_OPTIONS.map((voice) => (
                  <button
                    key={voice.value}
                    onClick={() => setAgentForm({ ...agentForm, voice: voice.value })}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all duration-200",
                      agentForm.voice === voice.value
                        ? "border-primary bg-primary/10 shadow-glow"
                        : "border-border/30 hover:border-primary/30 hover:bg-muted/30"
                    )}
                  >
                    <div className="font-medium">{voice.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{voice.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Temperature */}
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Temperatura</label>
                <span className="text-sm font-mono bg-muted/50 px-2 py-0.5 rounded">
                  {agentForm.temperature?.toFixed(1) || "0.2"}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={agentForm.temperature || 0.2}
                onChange={(e) => setAgentForm({ ...agentForm, temperature: parseFloat(e.target.value) })}
                className="w-full accent-primary"
              />
              <p className="text-xs text-muted-foreground">
                Valori più bassi = risposte più coerenti. Valori più alti = più creatività.
              </p>
            </div>

            {/* Greeting */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">Messaggio di Saluto Trigger</label>
              <Input
                value={agentForm.greetingMessage || ""}
                onChange={(e) => setAgentForm({ ...agentForm, greetingMessage: e.target.value })}
                placeholder="Ciao"
                className="max-w-md"
              />
              <p className="text-xs text-muted-foreground">
                Messaggio iniziale che attiva il saluto dell'agente
              </p>
            </div>

            {/* Greeting Delay */}
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Ritardo Saluto</label>
                <span className="text-sm font-mono bg-muted/50 px-2 py-0.5 rounded">
                  {agentForm.greetingDelayMs || 200}ms
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={agentForm.greetingDelayMs || 200}
                onChange={(e) => setAgentForm({ ...agentForm, greetingDelayMs: parseInt(e.target.value) })}
                className="w-full accent-primary"
              />
            </div>

            {/* Language */}
            <div className="grid gap-3">
              <label className="text-sm font-medium">Lingua Primaria</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <Button
                    key={lang.value}
                    variant={agentForm.primaryLanguage === lang.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAgentForm({ ...agentForm, primaryLanguage: lang.value })}
                    className={cn(
                      "gap-2",
                      agentForm.primaryLanguage === lang.value && "shadow-glow"
                    )}
                  >
                    <span>{lang.flag}</span>
                    {lang.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Auto Detect Language */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/30">
              <input
                type="checkbox"
                id="autoDetectLanguage"
                checked={agentForm.autoDetectLanguage ?? true}
                onChange={(e) => setAgentForm({ ...agentForm, autoDetectLanguage: e.target.checked })}
                className="h-4 w-4 accent-primary"
              />
              <div>
                <label htmlFor="autoDetectLanguage" className="text-sm font-medium cursor-pointer">
                  Rileva automaticamente la lingua
                </label>
                <p className="text-xs text-muted-foreground">
                  L'agente adatterà la lingua in base a come parla il chiamante
                </p>
              </div>
            </div>

            {/* Turn Detection */}
            <div className="space-y-4 pt-4 border-t border-border/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-warning/10">
                  <Activity className="h-4 w-4 text-warning" />
                </div>
                <h4 className="font-medium">Rilevamento Turno di Parola</h4>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/30">
                <input
                  type="checkbox"
                  id="turnDetection"
                  checked={agentForm.turnDetectionEnabled ?? true}
                  onChange={(e) => setAgentForm({ ...agentForm, turnDetectionEnabled: e.target.checked })}
                  className="h-4 w-4 accent-primary"
                />
                <label htmlFor="turnDetection" className="text-sm font-medium cursor-pointer">
                  Abilita rilevamento automatico
                </label>
              </div>

              {agentForm.turnDetectionEnabled && (
                <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Soglia VAD</label>
                      <span className="text-sm font-mono bg-muted/50 px-2 py-0.5 rounded">
                        {agentForm.vadThreshold?.toFixed(1) || "0.5"}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={agentForm.vadThreshold || 0.5}
                      onChange={(e) => setAgentForm({ ...agentForm, vadThreshold: parseFloat(e.target.value) })}
                      className="w-full accent-primary"
                    />
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Durata Silenzio</label>
                      <span className="text-sm font-mono bg-muted/50 px-2 py-0.5 rounded">
                        {agentForm.silenceDurationMs || 500}ms
                      </span>
                    </div>
                    <input
                      type="range"
                      min="200"
                      max="2000"
                      step="100"
                      value={agentForm.silenceDurationMs || 500}
                      onChange={(e) => setAgentForm({ ...agentForm, silenceDurationMs: parseInt(e.target.value) })}
                      className="w-full accent-primary"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={() => updateConfigMutation.mutate(agentForm)}
                disabled={updateConfigMutation.isPending}
                className="gap-2"
              >
                {updateConfigMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salva Configurazione
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions Tab */}
      {activeTab === "instructions" && (
        <div className="space-y-4">
          <Card className="card-interactive">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none rounded-2xl" />
            <CardHeader className="relative">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Sistema di Istruzioni</CardTitle>
                  <CardDescription>Personalizza il comportamento dell'agente</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative space-y-6">
              {/* Template Mode Toggle */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={instructionsForm.useTemplate ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInstructionsForm({ ...instructionsForm, useTemplate: true })}
                  className={cn(instructionsForm.useTemplate && "shadow-glow")}
                >
                  Modalità Template
                </Button>
                <Button
                  variant={!instructionsForm.useTemplate ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInstructionsForm({ ...instructionsForm, useTemplate: false })}
                  className={cn(!instructionsForm.useTemplate && "shadow-glow")}
                >
                  Istruzioni Personalizzate
                </Button>
              </div>

              {instructionsForm.useTemplate ? (
                <div className="space-y-4">
                  {[
                    { key: "communicationStyle", label: "Stile di Comunicazione", placeholder: "Descrivi come l'agente deve comunicare..." },
                    { key: "languageInstructions", label: "Gestione Lingue", placeholder: "Istruzioni per il rilevamento e adattamento lingua..." },
                    { key: "closingInstructions", label: "Chiusura Chiamate", placeholder: "Come terminare le chiamate..." },
                    { key: "additionalInstructions", label: "Istruzioni Aggiuntive", placeholder: "Regole aggiuntive per l'agente..." },
                  ].map((field) => (
                    <div key={field.key} className="grid gap-2">
                      <label className="text-sm font-medium">{field.label}</label>
                      <textarea
                        className="min-h-[100px] w-full rounded-xl border border-border/30 bg-background px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                        value={(instructionsForm as Record<string, string>)[field.key] || ""}
                        onChange={(e) => setInstructionsForm({ ...instructionsForm, [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Istruzioni Complete</label>
                  <textarea
                    className="min-h-[400px] w-full rounded-xl border border-border/30 bg-background px-4 py-3 text-sm font-mono transition-all duration-200 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    value={instructionsForm.customInstructions || ""}
                    onChange={(e) => setInstructionsForm({ ...instructionsForm, customInstructions: e.target.value })}
                    placeholder="Inserisci le istruzioni complete per l'agente..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Puoi usare variabili come {"{{agentName}}"}, {"{{companyName}}"}, {"{{services}}"} etc.
                  </p>
                </div>
              )}

              {/* Preview & Save */}
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handlePreviewInstructions} className="gap-2">
                  <Eye className="h-4 w-4" />
                  Anteprima
                </Button>
                <Button
                  onClick={() => updateInstructionsMutation.mutate(instructionsForm)}
                  disabled={updateInstructionsMutation.isPending}
                  className="gap-2"
                >
                  {updateInstructionsMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salva Istruzioni
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview Modal */}
          {instructionPreview && (
            <Card className="card-interactive animate-fade-in-up">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-info/10">
                      <Eye className="h-5 w-5 text-info" />
                    </div>
                    <CardTitle>Anteprima Istruzioni Generate</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setInstructionPreview(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted/30 p-4 rounded-xl overflow-auto max-h-[400px] whitespace-pre-wrap border border-border/30">
                  {instructionPreview}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Knowledge Base Tab */}
      {activeTab === "knowledge" && (
        <div className="space-y-4">
          {/* Company Info */}
          <Card className="card-interactive">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Building className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Informazioni Azienda</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Nome Azienda</label>
                  <Input
                    value={knowledgeForm.companyName || ""}
                    onChange={(e) => setKnowledgeForm({ ...knowledgeForm, companyName: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Tagline</label>
                  <Input
                    value={knowledgeForm.companyTagline || ""}
                    onChange={(e) => setKnowledgeForm({ ...knowledgeForm, companyTagline: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Descrizione</label>
                <textarea
                  className="min-h-[80px] w-full rounded-xl border border-border/30 bg-background px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  value={knowledgeForm.companyDescription || ""}
                  onChange={(e) => setKnowledgeForm({ ...knowledgeForm, companyDescription: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Missione</label>
                <textarea
                  className="min-h-[60px] w-full rounded-xl border border-border/30 bg-background px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  value={knowledgeForm.companyMission || ""}
                  onChange={(e) => setKnowledgeForm({ ...knowledgeForm, companyMission: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="card-interactive">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-info/10">
                  <Mail className="h-5 w-5 text-info" />
                </div>
                <CardTitle>Contatti</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Telefono Principale</label>
                  <Input
                    value={knowledgeForm.phoneMain || ""}
                    onChange={(e) => setKnowledgeForm({ ...knowledgeForm, phoneMain: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Telefono Supporto</label>
                  <Input
                    value={knowledgeForm.phoneSupport || ""}
                    onChange={(e) => setKnowledgeForm({ ...knowledgeForm, phoneSupport: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    value={knowledgeForm.email || ""}
                    onChange={(e) => setKnowledgeForm({ ...knowledgeForm, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Sito Web</label>
                  <Input
                    value={knowledgeForm.website || ""}
                    onChange={(e) => setKnowledgeForm({ ...knowledgeForm, website: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="card-interactive">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-success/10">
                  <MapPin className="h-5 w-5 text-success" />
                </div>
                <CardTitle>Posizione</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Indirizzo</label>
                  <Input
                    value={knowledgeForm.address || ""}
                    onChange={(e) => setKnowledgeForm({ ...knowledgeForm, address: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Città</label>
                  <Input
                    value={knowledgeForm.city || ""}
                    onChange={(e) => setKnowledgeForm({ ...knowledgeForm, city: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">CAP</label>
                  <Input
                    value={knowledgeForm.postalCode || ""}
                    onChange={(e) => setKnowledgeForm({ ...knowledgeForm, postalCode: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Paese</label>
                  <Input
                    value={knowledgeForm.country || ""}
                    onChange={(e) => setKnowledgeForm({ ...knowledgeForm, country: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card className="card-interactive">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-warning/10">
                  <Briefcase className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <CardTitle>Servizi</CardTitle>
                  <CardDescription>Separati da virgola</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <textarea
                className="min-h-[100px] w-full rounded-xl border border-border/30 bg-background px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                value={(knowledgeForm.services || []).join(", ")}
                onChange={(e) => setKnowledgeForm({
                  ...knowledgeForm,
                  services: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                })}
                placeholder="VoIP, Networking, Cybersecurity, ..."
              />
            </CardContent>
          </Card>

          {/* Financial Access */}
          <Card className="card-interactive">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-destructive/10">
                  <Shield className="h-5 w-5 text-destructive" />
                </div>
                <CardTitle>Accesso Dati Finanziari</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/30">
                <input
                  type="checkbox"
                  id="financialAccess"
                  checked={knowledgeForm.financialAccessEnabled ?? false}
                  onChange={(e) => setKnowledgeForm({ ...knowledgeForm, financialAccessEnabled: e.target.checked })}
                  className="h-4 w-4 accent-primary"
                />
                <label htmlFor="financialAccess" className="text-sm font-medium cursor-pointer">
                  Abilita accesso ai dati finanziari
                </label>
              </div>

              {knowledgeForm.financialAccessEnabled && (
                <div className="grid gap-2 pl-4 border-l-2 border-primary/20">
                  <label className="text-sm font-medium">Codici di Accesso (separati da virgola)</label>
                  <Input
                    value={(knowledgeForm.financialAccessCodes || []).join(", ")}
                    onChange={(e) => setKnowledgeForm({
                      ...knowledgeForm,
                      financialAccessCodes: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                    })}
                    placeholder="CODICE1, CODICE2, ..."
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => updateKnowledgeMutation.mutate(knowledgeForm)}
              disabled={updateKnowledgeMutation.isPending}
              className="gap-2"
            >
              {updateKnowledgeMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salva Knowledge Base
            </Button>
          </div>
        </div>
      )}

      {/* Transfers Tab */}
      {activeTab === "transfers" && (
        <div className="space-y-4">
          <Card className="card-interactive">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Destinazioni di Trasferimento</CardTitle>
                    <CardDescription>
                      Configura i numeri per il trasferimento chiamate
                    </CardDescription>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    const newDestination: TransferDestination = {
                      id: `dest-${Date.now()}`,
                      department: "",
                      name: "",
                      number: "",
                      enabled: true,
                    }
                    setTransferDestinations([...transferDestinations, newDestination])
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Aggiungi
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {transferDestinations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <Phone className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium text-muted-foreground">
                    Nessuna destinazione configurata
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Clicca "Aggiungi" per configurare una nuova destinazione di trasferimento
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transferDestinations.map((dest, index) => (
                    <div
                      key={dest.id}
                      className={cn(
                        "p-5 rounded-xl border transition-all duration-200 animate-fade-in-up",
                        dest.enabled
                          ? "border-primary/20 bg-primary/5"
                          : "border-border/30 bg-muted/30 opacity-60"
                      )}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Badge className={dest.enabled ? "badge-success" : ""}>
                            {dest.enabled ? "Attivo" : "Disattivo"}
                          </Badge>
                          {dest.department && (
                            <span className="font-medium">{dest.department}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setTransferDestinations(
                                transferDestinations.map((d, i) =>
                                  i === index ? { ...d, enabled: !d.enabled } : d
                                )
                              )
                            }}
                            className="gap-1"
                          >
                            {dest.enabled ? (
                              <>
                                <X className="h-4 w-4" />
                                <span className="hidden sm:inline">Disattiva</span>
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4" />
                                <span className="hidden sm:inline">Attiva</span>
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setTransferDestinations(
                                transferDestinations.filter((_, i) => i !== index)
                              )
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Reparto/Dipartimento *</label>
                          <Input
                            value={dest.department}
                            onChange={(e) => {
                              setTransferDestinations(
                                transferDestinations.map((d, i) =>
                                  i === index ? { ...d, department: e.target.value } : d
                                )
                              )
                            }}
                            placeholder="es. Supporto Tecnico IT"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Nome Referente (opzionale)</label>
                          <Input
                            value={dest.name || ""}
                            onChange={(e) => {
                              setTransferDestinations(
                                transferDestinations.map((d, i) =>
                                  i === index ? { ...d, name: e.target.value } : d
                                )
                              )
                            }}
                            placeholder="es. Marco Rossi"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Numero Telefono *</label>
                          <Input
                            value={dest.number}
                            onChange={(e) => {
                              setTransferDestinations(
                                transferDestinations.map((d, i) =>
                                  i === index ? { ...d, number: e.target.value } : d
                                )
                              )
                            }}
                            placeholder="+390220527877"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legacy Transfer Numbers */}
          <Card className="card-interactive border-border/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-muted">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle>Numeri Legacy</CardTitle>
                  <CardDescription>
                    Numeri predefiniti usati come fallback
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Vendite/Generale</label>
                  <Input
                    value={knowledgeForm.transferNumberMain || ""}
                    onChange={(e) => setKnowledgeForm({ ...knowledgeForm, transferNumberMain: e.target.value })}
                    placeholder="+39..."
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Supporto Tecnico</label>
                  <Input
                    value={knowledgeForm.transferNumberSupport || ""}
                    onChange={(e) => setKnowledgeForm({ ...knowledgeForm, transferNumberSupport: e.target.value })}
                    placeholder="+39..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => {
                updateKnowledgeMutation.mutate({
                  ...knowledgeForm,
                  transferDestinations,
                })
              }}
              disabled={updateKnowledgeMutation.isPending}
              className="gap-2"
            >
              {updateKnowledgeMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salva Trasferimenti
            </Button>
          </div>
        </div>
      )}

      {/* Tools Tab */}
      {activeTab === "tools" && (
        <div className="space-y-4">
          {/* General Tools */}
          <Card className="card-interactive">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Wrench className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Strumenti Generali</CardTitle>
                  <CardDescription>Strumenti base per la gestione delle chiamate</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {toolsForm
                  .filter((t) => t.category === "general")
                  .map((tool, index) => {
                    const ToolIcon = TOOL_DEFINITIONS[tool.name]?.icon || Wrench
                    return (
                      <div
                        key={tool.name}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl border transition-all duration-200 animate-fade-in-up",
                          tool.enabled
                            ? "border-primary/20 bg-primary/5"
                            : "border-border/30 hover:border-border/50"
                        )}
                        style={{ animationDelay: `${index * 0.03}s` }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-xl",
                            tool.enabled ? "bg-primary/10" : "bg-muted/50"
                          )}>
                            <ToolIcon className={cn(
                              "h-4 w-4",
                              tool.enabled ? "text-primary" : "text-muted-foreground"
                            )} />
                          </div>
                          <div>
                            <div className="font-medium">
                              {TOOL_DEFINITIONS[tool.name]?.label || tool.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {TOOL_DEFINITIONS[tool.name]?.description || tool.description}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant={tool.enabled ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setToolsForm(
                              toolsForm.map((t) =>
                                t.name === tool.name ? { ...t, enabled: !t.enabled } : t
                              )
                            )
                          }}
                          className={cn("gap-1", tool.enabled && "shadow-glow")}
                        >
                          {tool.enabled ? (
                            <>
                              <Check className="h-4 w-4" />
                              <span className="hidden sm:inline">Attivo</span>
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4" />
                              <span className="hidden sm:inline">Disattivo</span>
                            </>
                          )}
                        </Button>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Financial Tools */}
          <Card className="card-interactive">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-warning/10">
                  <Briefcase className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <CardTitle>Strumenti Finanziari</CardTitle>
                  <CardDescription>Strumenti per accesso ai dati finanziari (richiede codice)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {toolsForm
                  .filter((t) => t.category === "financial")
                  .map((tool, index) => {
                    const ToolIcon = TOOL_DEFINITIONS[tool.name]?.icon || Briefcase
                    return (
                      <div
                        key={tool.name}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl border transition-all duration-200 animate-fade-in-up",
                          tool.enabled
                            ? "border-warning/20 bg-warning/5"
                            : "border-border/30 hover:border-border/50"
                        )}
                        style={{ animationDelay: `${index * 0.03}s` }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-xl",
                            tool.enabled ? "bg-warning/10" : "bg-muted/50"
                          )}>
                            <ToolIcon className={cn(
                              "h-4 w-4",
                              tool.enabled ? "text-warning" : "text-muted-foreground"
                            )} />
                          </div>
                          <div>
                            <div className="font-medium">
                              {TOOL_DEFINITIONS[tool.name]?.label || tool.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {TOOL_DEFINITIONS[tool.name]?.description || tool.description}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant={tool.enabled ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setToolsForm(
                              toolsForm.map((t) =>
                                t.name === tool.name ? { ...t, enabled: !t.enabled } : t
                              )
                            )
                          }}
                          className={cn("gap-1", tool.enabled && "shadow-glow")}
                        >
                          {tool.enabled ? (
                            <>
                              <Check className="h-4 w-4" />
                              <span className="hidden sm:inline">Attivo</span>
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4" />
                              <span className="hidden sm:inline">Disattivo</span>
                            </>
                          )}
                        </Button>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => {
                const toolUpdates = toolsForm.map((t) => ({
                  toolName: t.name,
                  enabled: t.enabled,
                  parameters: t.parameters,
                }))
                updateToolsMutation.mutate(toolUpdates)
              }}
              disabled={updateToolsMutation.isPending}
              className="gap-2"
            >
              {updateToolsMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salva Configurazione Strumenti
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
