import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "@/lib/api";
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
} from "lucide-react";

// Voice options for OpenAI Realtime
const VOICE_OPTIONS = [
  { value: "alloy", label: "Alloy" },
  { value: "echo", label: "Echo" },
  { value: "shimmer", label: "Shimmer" },
  { value: "verse", label: "Verse" },
  { value: "coral", label: "Coral" },
  { value: "sage", label: "Sage" },
];

// Language options
const LANGUAGE_OPTIONS = [
  { value: "it", label: "Italiano" },
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
];

// Tool definitions for display
const TOOL_DEFINITIONS: Record<string, { label: string; description: string }> = {
  get_company_info: { label: "Informazioni Azienda", description: "Fornisce informazioni sull'azienda" },
  get_business_hours: { label: "Orari Apertura", description: "Fornisce gli orari di apertura" },
  get_location: { label: "Posizione Ufficio", description: "Fornisce l'indirizzo dell'ufficio" },
  schedule_callback: { label: "Pianifica Richiamata", description: "Pianifica una richiamata per un cliente" },
  take_message: { label: "Prendi Messaggio", description: "Prende un messaggio per un dipendente" },
  transfer_call: { label: "Trasferisci Chiamata", description: "Trasferisce la chiamata a un altro numero" },
  verify_access_code: { label: "Verifica Codice", description: "Verifica il codice di accesso per i dati finanziari" },
  get_financial_summary: { label: "Sintesi Finanziaria", description: "Sintesi dei risultati finanziari" },
  get_balance_sheet: { label: "Stato Patrimoniale", description: "Dati dello stato patrimoniale" },
  get_income_statement: { label: "Conto Economico", description: "Ricavi, costi, margini" },
  get_financial_metrics: { label: "KPI Finanziari", description: "ROI, ROS, EBITDA e altri KPI" },
  get_business_lines: { label: "Linee di Business", description: "Ripartizione ricavi per linea" },
};

export function Settings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"agent" | "instructions" | "knowledge" | "tools">("agent");
  const [instructionPreview, setInstructionPreview] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Fetch agent config
  const { data: fullConfig, isLoading, error } = useQuery({
    queryKey: ["agentConfig"],
    queryFn: getAgentConfig,
  });

  // Form state
  const [agentForm, setAgentForm] = useState<Partial<AgentConfig>>({});
  const [instructionsForm, setInstructionsForm] = useState<Partial<AgentInstructions>>({});
  const [knowledgeForm, setKnowledgeForm] = useState<Partial<KnowledgeBase>>({});
  const [toolsForm, setToolsForm] = useState<ToolConfig[]>([]);

  // Initialize forms when data loads
  useEffect(() => {
    if (fullConfig) {
      setAgentForm(fullConfig.config);
      setInstructionsForm(fullConfig.instructions || {});
      setKnowledgeForm(fullConfig.knowledgeBase || {});
      setToolsForm(fullConfig.toolConfigs || []);
    }
  }, [fullConfig]);

  // Mutations
  const updateConfigMutation = useMutation({
    mutationFn: updateAgentConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentConfig"] });
      showSaveSuccess("Impostazioni agente salvate");
    },
  });

  const updateInstructionsMutation = useMutation({
    mutationFn: updateInstructions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentConfig"] });
      showSaveSuccess("Istruzioni salvate");
    },
  });

  const updateKnowledgeMutation = useMutation({
    mutationFn: updateKnowledgeBase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentConfig"] });
      showSaveSuccess("Knowledge base salvata");
    },
  });

  const updateToolsMutation = useMutation({
    mutationFn: updateToolConfigs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentConfig"] });
      showSaveSuccess("Strumenti aggiornati");
    },
  });

  const showSaveSuccess = (message: string) => {
    setSaveSuccess(message);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const handlePreviewInstructions = async () => {
    try {
      const preview = await previewInstructions();
      setInstructionPreview(preview);
    } catch (err) {
      console.error("Failed to preview instructions:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">Errore nel caricamento della configurazione</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Impostazioni Agente</h2>
          <p className="text-muted-foreground">Configura il tuo assistente vocale AI</p>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <Badge variant="outline" className="border-emerald-500 text-emerald-600">
              <Check className="h-3 w-3 mr-1" />
              {saveSuccess}
            </Badge>
          )}
          <Badge variant="outline" className="text-sm">
            <SettingsIcon className="h-3 w-3 mr-1" />
            {agentForm.agentName || "Arthur"}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={activeTab === "agent" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("agent")}
        >
          <Mic className="h-4 w-4 mr-2" />
          Agente
        </Button>
        <Button
          variant={activeTab === "instructions" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("instructions")}
        >
          <Brain className="h-4 w-4 mr-2" />
          Istruzioni
        </Button>
        <Button
          variant={activeTab === "knowledge" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("knowledge")}
        >
          <Building className="h-4 w-4 mr-2" />
          Knowledge Base
        </Button>
        <Button
          variant={activeTab === "tools" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("tools")}
        >
          <Wrench className="h-4 w-4 mr-2" />
          Strumenti
        </Button>
      </div>

      {/* Agent Settings Tab */}
      {activeTab === "agent" && (
        <Card>
          <CardHeader>
            <CardTitle>Configurazione Agente</CardTitle>
            <CardDescription>Imposta nome, voce e parametri dell'assistente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Agent Name */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">Nome Agente</label>
              <Input
                value={agentForm.agentName || ""}
                onChange={(e) => setAgentForm({ ...agentForm, agentName: e.target.value })}
                placeholder="Arthur"
              />
            </div>

            {/* Voice Selection */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">Voce</label>
              <div className="flex flex-wrap gap-2">
                {VOICE_OPTIONS.map((voice) => (
                  <Button
                    key={voice.value}
                    variant={agentForm.voice === voice.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAgentForm({ ...agentForm, voice: voice.value })}
                  >
                    {voice.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Temperature */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Temperatura: {agentForm.temperature?.toFixed(1) || "0.2"}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={agentForm.temperature || 0.2}
                onChange={(e) => setAgentForm({ ...agentForm, temperature: parseFloat(e.target.value) })}
                className="w-full"
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
              />
              <p className="text-xs text-muted-foreground">
                Messaggio iniziale che attiva il saluto dell'agente
              </p>
            </div>

            {/* Greeting Delay */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Ritardo Saluto: {agentForm.greetingDelayMs || 200}ms
              </label>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={agentForm.greetingDelayMs || 200}
                onChange={(e) => setAgentForm({ ...agentForm, greetingDelayMs: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Language */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">Lingua Primaria</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <Button
                    key={lang.value}
                    variant={agentForm.primaryLanguage === lang.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAgentForm({ ...agentForm, primaryLanguage: lang.value })}
                  >
                    {lang.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Auto Detect Language */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoDetectLanguage"
                checked={agentForm.autoDetectLanguage ?? true}
                onChange={(e) => setAgentForm({ ...agentForm, autoDetectLanguage: e.target.checked })}
                className="h-4 w-4"
              />
              <label htmlFor="autoDetectLanguage" className="text-sm">
                Rileva automaticamente la lingua del chiamante
              </label>
            </div>

            {/* Turn Detection */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium">Rilevamento Turno di Parola</h4>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="turnDetection"
                  checked={agentForm.turnDetectionEnabled ?? true}
                  onChange={(e) => setAgentForm({ ...agentForm, turnDetectionEnabled: e.target.checked })}
                  className="h-4 w-4"
                />
                <label htmlFor="turnDetection" className="text-sm">
                  Abilita rilevamento automatico
                </label>
              </div>

              {agentForm.turnDetectionEnabled && (
                <>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">
                      Soglia VAD: {agentForm.vadThreshold?.toFixed(1) || "0.5"}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={agentForm.vadThreshold || 0.5}
                      onChange={(e) => setAgentForm({ ...agentForm, vadThreshold: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium">
                      Durata Silenzio: {agentForm.silenceDurationMs || 500}ms
                    </label>
                    <input
                      type="range"
                      min="200"
                      max="2000"
                      step="100"
                      value={agentForm.silenceDurationMs || 500}
                      onChange={(e) => setAgentForm({ ...agentForm, silenceDurationMs: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={() => updateConfigMutation.mutate(agentForm)}
                disabled={updateConfigMutation.isPending}
              >
                {updateConfigMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
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
          <Card>
            <CardHeader>
              <CardTitle>Sistema di Istruzioni</CardTitle>
              <CardDescription>Personalizza il comportamento dell'agente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Template Mode Toggle */}
              <div className="flex items-center gap-4">
                <Button
                  variant={instructionsForm.useTemplate ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInstructionsForm({ ...instructionsForm, useTemplate: true })}
                >
                  Modalità Template
                </Button>
                <Button
                  variant={!instructionsForm.useTemplate ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInstructionsForm({ ...instructionsForm, useTemplate: false })}
                >
                  Istruzioni Personalizzate
                </Button>
              </div>

              {instructionsForm.useTemplate ? (
                <>
                  {/* Template Sections */}
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Stile di Comunicazione</label>
                      <textarea
                        className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={instructionsForm.communicationStyle || ""}
                        onChange={(e) => setInstructionsForm({ ...instructionsForm, communicationStyle: e.target.value })}
                        placeholder="Descrivi come l'agente deve comunicare..."
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Gestione Lingue</label>
                      <textarea
                        className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={instructionsForm.languageInstructions || ""}
                        onChange={(e) => setInstructionsForm({ ...instructionsForm, languageInstructions: e.target.value })}
                        placeholder="Istruzioni per il rilevamento e adattamento lingua..."
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Chiusura Chiamate</label>
                      <textarea
                        className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={instructionsForm.closingInstructions || ""}
                        onChange={(e) => setInstructionsForm({ ...instructionsForm, closingInstructions: e.target.value })}
                        placeholder="Come terminare le chiamate..."
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Istruzioni Aggiuntive</label>
                      <textarea
                        className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={instructionsForm.additionalInstructions || ""}
                        onChange={(e) => setInstructionsForm({ ...instructionsForm, additionalInstructions: e.target.value })}
                        placeholder="Regole aggiuntive per l'agente..."
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* Custom Instructions */
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Istruzioni Complete</label>
                  <textarea
                    className="min-h-[400px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
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
                <Button variant="outline" onClick={handlePreviewInstructions}>
                  <Eye className="h-4 w-4 mr-2" />
                  Anteprima
                </Button>
                <Button
                  onClick={() => updateInstructionsMutation.mutate(instructionsForm)}
                  disabled={updateInstructionsMutation.isPending}
                >
                  {updateInstructionsMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salva Istruzioni
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview Modal */}
          {instructionPreview && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Anteprima Istruzioni Generate</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setInstructionPreview(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-[400px] whitespace-pre-wrap">
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
          <Card>
            <CardHeader>
              <CardTitle>Informazioni Azienda</CardTitle>
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
                  className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={knowledgeForm.companyDescription || ""}
                  onChange={(e) => setKnowledgeForm({ ...knowledgeForm, companyDescription: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Missione</label>
                <textarea
                  className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={knowledgeForm.companyMission || ""}
                  onChange={(e) => setKnowledgeForm({ ...knowledgeForm, companyMission: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contatti</CardTitle>
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
          <Card>
            <CardHeader>
              <CardTitle>Posizione</CardTitle>
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

          {/* Transfer Numbers */}
          <Card>
            <CardHeader>
              <CardTitle>Numeri di Trasferimento</CardTitle>
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

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle>Servizi</CardTitle>
              <CardDescription>Separati da virgola</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
          <Card>
            <CardHeader>
              <CardTitle>Accesso Dati Finanziari</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="financialAccess"
                  checked={knowledgeForm.financialAccessEnabled ?? false}
                  onChange={(e) => setKnowledgeForm({ ...knowledgeForm, financialAccessEnabled: e.target.checked })}
                  className="h-4 w-4"
                />
                <label htmlFor="financialAccess" className="text-sm">
                  Abilita accesso ai dati finanziari
                </label>
              </div>

              {knowledgeForm.financialAccessEnabled && (
                <div className="grid gap-2">
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
            >
              {updateKnowledgeMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salva Knowledge Base
            </Button>
          </div>
        </div>
      )}

      {/* Tools Tab */}
      {activeTab === "tools" && (
        <div className="space-y-4">
          {/* General Tools */}
          <Card>
            <CardHeader>
              <CardTitle>Strumenti Generali</CardTitle>
              <CardDescription>Strumenti base per la gestione delle chiamate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {toolsForm
                  .filter((t) => t.category === "general")
                  .map((tool) => (
                    <div
                      key={tool.name}
                      className="flex items-center justify-between p-3 rounded-md border"
                    >
                      <div>
                        <div className="font-medium">
                          {TOOL_DEFINITIONS[tool.name]?.label || tool.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {TOOL_DEFINITIONS[tool.name]?.description || tool.description}
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
                          );
                        }}
                      >
                        {tool.enabled ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Attivo
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-1" />
                            Disattivo
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Financial Tools */}
          <Card>
            <CardHeader>
              <CardTitle>Strumenti Finanziari</CardTitle>
              <CardDescription>Strumenti per accesso ai dati finanziari (richiede codice)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {toolsForm
                  .filter((t) => t.category === "financial")
                  .map((tool) => (
                    <div
                      key={tool.name}
                      className="flex items-center justify-between p-3 rounded-md border"
                    >
                      <div>
                        <div className="font-medium">
                          {TOOL_DEFINITIONS[tool.name]?.label || tool.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {TOOL_DEFINITIONS[tool.name]?.description || tool.description}
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
                          );
                        }}
                      >
                        {tool.enabled ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Attivo
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-1" />
                            Disattivo
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
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
                }));
                updateToolsMutation.mutate(toolUpdates);
              }}
              disabled={updateToolsMutation.isPending}
            >
              {updateToolsMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salva Configurazione Strumenti
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
