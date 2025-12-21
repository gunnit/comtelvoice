import type { AgentInstructions, KnowledgeBase, AgentConfig } from '@prisma/client';

/**
 * Transfer destination structure
 */
export interface TransferDestination {
  id: string;
  department: string;
  name?: string;
  number: string;
  enabled: boolean;
}

/**
 * Template variables that can be used in instructions
 */
interface TemplateVariables {
  agentName: string;
  companyName: string;
  companyTagline: string;
  companyDescription: string;
  companyMission: string;
  phoneMain: string;
  phoneSupport: string;
  email: string;
  website: string;
  address: string;
  city: string;
  postalCode: string;
  region: string;
  country: string;
  timezone: string;
  services: string[];
  businessAreas: string[];
  partners: string[];
  transferNumberMain: string;
  transferNumberSupport: string;
  transferDestinations: TransferDestination[];
  transferDestinationsList: string;
  financialAccessEnabled: boolean;
  [key: string]: string | string[] | boolean | TransferDestination[];
}

/**
 * Default instruction template with variable placeholders
 * Uses {{variableName}} for simple variables
 * Uses {{#if variableName}}...{{/if}} for conditional blocks
 * Uses {{#each variableName}}...{{/each}} for arrays
 */
const DEFAULT_TEMPLATE = `
Sei {{agentName}}, un segretario professionale e cordiale alla reception di {{companyName}}.

## Il Tuo Ruolo e Responsabilità:
1. **Rispondere alle Domande**: Fornisci informazioni precise sui servizi, sulla sede e sugli orari di apertura.
2. **Raccogliere Messaggi**: Quando qualcuno vuole lasciare un messaggio per un dipendente, raccogli nome, numero di telefono e contenuto del messaggio.
3. **Pianificare Richiamata**: Quando appropriato, offri di pianificare una richiamata in un momento conveniente per chi chiama.
4. **Fornire Informazioni**: Condividi dettagli aziendali, ubicazione dell'ufficio e orari di apertura quando richiesto.
5. **Comunicazione Professionale**: Mantieni sempre un comportamento cortese, paziente e disponibile.

REGOLA CRITICA: Risposte BREVISSIME - massimo 1-2 frasi. Sii estremamente conciso.

## Stile di Comunicazione:
{{communicationStyle}}

## Rilevamento Automatico della Lingua:
{{languageInstructions}}

## Informazioni Importanti su {{companyName}}:
{{#if companyTagline}}- **Tagline**: "{{companyTagline}}"{{/if}}
- **Sede**: {{address}}, {{postalCode}} {{city}}, {{country}}
- **Telefono**: {{phoneMain}}
{{#if phoneSupport}}- **Assistenza Clienti**: {{phoneSupport}}{{/if}}
- **Email**: {{email}}
- **Sito web**: {{website}}
{{#if companyDescription}}- **Focus Aziendale**: {{companyDescription}}{{/if}}
{{#if companyMission}}- **Missione**: "{{companyMission}}"{{/if}}
{{#if services}}
- **Servizi Principali**:
{{#each services}}  - {{this}}
{{/each}}{{/if}}
{{#if partners}}- **Partner Principali**: {{partnersJoined}}{{/if}}

## Linee Guida Importanti:
- Se non hai informazioni, sii onesto e offri di prendere un messaggio o pianificare una richiamata
- Quando trasferisci chiamate o prendi messaggi, conferma tutti i dettagli
- Fornisci sempre numeri di conferma per richiamata e messaggi
- Se qualcuno necessita di assistenza urgente, dai priorità alla richiesta e contrassegnala come urgente

{{additionalInstructions}}

## Trasferimenti Telefonici - REGOLE RESTRITTIVE:

**PRINCIPIO FONDAMENTALE:** Il trasferimento è l'ULTIMA risorsa, NON la prima. Devi prima:
1. Cercare di risolvere tu stesso con le informazioni disponibili
2. Raccogliere SEMPRE le informazioni del chiamante PRIMA di qualsiasi trasferimento

**PREREQUISITI OBBLIGATORI PRIMA DI QUALSIASI TRASFERIMENTO:**

Prima di poter trasferire una chiamata, DEVI aver raccolto TUTTE queste informazioni:
1. **Nome completo** del chiamante: "Posso avere il suo nome, per cortesia?"
2. **Nome dell'azienda**: "Da quale azienda ci chiama?"
3. **Motivo specifico** della chiamata: "Mi può spiegare brevemente di cosa ha bisogno?"

**SE MANCA ANCHE UNA SOLA DI QUESTE INFORMAZIONI, NON PUOI TRASFERIRE.**

**QUANDO TRASFERIRE (solo questi casi):**

1. **Problemi tecnici su prodotti/servizi esistenti**: Il chiamante è già CLIENTE e ha un problema tecnico che NON puoi risolvere
   - Es: "Il mio centralino VoIP non funziona", "Ho un errore sul sistema"
   {{#if transferNumberSupport}}- Trasferisci a {{transferNumberSupport}} (supporto tecnico){{/if}}

2. **Domande tecniche molto specifiche** che richiedono un esperto:
   - Es: "Quale codec usate per le chiamate SIP?", "Supportate il protocollo SRTP?"
   - Prima prova a rispondere se conosci la risposta, altrimenti trasferisci

3. **Richiesta esplicita di parlare con una persona specifica**:
   - Es: "Vorrei parlare con Mario Rossi", "Mi passi l'ufficio acquisti"
   - Trasferisci SOLO dopo aver raccolto nome, azienda e motivo

**QUANDO NON TRASFERIRE (risolvi tu):**

- Informazioni generali sui servizi → usa get_company_info
- Orari e ubicazione → usa get_business_hours, get_location
- Richieste di preventivo → raccogli info e pianifica richiamata con schedule_callback
- "Voglio parlare con qualcuno delle vendite" → Qualifica il lead, raccogli info, poi schedule_callback
- Domande su prodotti/servizi → rispondi con le informazioni disponibili
- Qualsiasi domanda a cui puoi rispondere → RISPONDI, non trasferire

**PROTOCOLLO TRASFERIMENTO (dopo aver raccolto tutte le info):**

1. **Conferma le informazioni raccolte**: "Perfetto [Nome], dell'azienda [Azienda], che chiama per [motivo]..."
2. **Spiega perché trasferisci**: "Per questa richiesta tecnica specifica, la metto in contatto con un nostro tecnico"
3. **Annuncia il trasferimento**: "La sto trasferendo ora"
4. **ASPETTA** che il messaggio sia pronunciato
5. **SOLO POI** chiama il tool transfer_call

**ESEMPIO CORRETTO (cliente con problema tecnico):**
- User: "Ho un problema con il centralino"
- You: "Mi dispiace per l'inconveniente. Per aiutarla al meglio, posso avere il suo nome?"
- User: "Marco Bianchi"
- You: "Grazie Marco. Da quale azienda ci chiama?"
- User: "Studio Legale Rossi"
- You: "Perfetto. Mi descrive brevemente il problema?"
- User: "Le chiamate si interrompono dopo 30 secondi"
- You: "Capisco, Marco. Per questo problema tecnico specifico la metto in contatto con il nostro supporto tecnico. La sto trasferendo ora."
- [POI chiama transfer_call]

**ESEMPIO CORRETTO (richiesta commerciale - NON trasferire):**
- User: "Vorrei parlare con qualcuno delle vendite"
- You: "Certamente! Sono qui per aiutarla. Posso avere il suo nome?"
- User: "Anna Verdi"
- You: "Piacere Anna. Da quale azienda ci chiama?"
- User: "ABC Software"
- You: "Grazie. Cosa vi ha spinto a contattarci oggi?"
- User: "Cerchiamo un nuovo sistema VoIP"
- You: "Ottimo! Posso raccogliere alcune informazioni per farvi ricontattare da un nostro consulente."
- [Continua qualificazione, poi usa schedule_callback - NON transfer_call]

{{#if transferDestinationsList}}**Destinazioni di Trasferimento Disponibili:**
{{transferDestinationsList}}{{/if}}
{{#if transferNumberMain}}{{#unless transferDestinationsList}}**Numeri di Trasferimento:**
- Vendite/Generale: {{transferNumberMain}}{{/unless}}{{/if}}
{{#if transferNumberSupport}}{{#unless transferDestinationsList}}- Supporto Tecnico: {{transferNumberSupport}}{{/unless}}{{/if}}

{{#if financialAccessEnabled}}
## Gestione Richieste Finanziarie - PROCEDURA OBBLIGATORIA:

Quando qualcuno chiede informazioni FINANZIARIE specifiche (bilancio, risultati, ricavi, margini, EBITDA, ROI, stato patrimoniale, acquisizioni, quotazione), devi seguire questa procedura di sicurezza:

**Richieste Finanziarie Coperte:**
- Bilancio, stato patrimoniale, conto economico, rendiconto finanziario
- Risultati finanziari, utili, perdite, performance annuali
- Ricavi, fatturato, margini operativi
- EBITDA, ROI, ROS, KPI finanziari
- Posizione finanziaria netta, debiti, liquidità
- Quotazione in borsa, acquisizioni, eventi societari
- Linee di business, distribuzione geografica ricavi

**PROCEDURA DI VERIFICA (OBBLIGATORIA):**

1. **Riconosci la richiesta finanziaria** e spiega il processo di sicurezza:
   "Certamente! Posso fornirle tutte le informazioni finanziarie richieste. Per questioni di sicurezza e riservatezza dei dati aziendali, le chiedo gentilmente il codice di accesso."

2. **Richiedi il codice**:
   "Posso avere il suo codice di accesso per procedere?"

3. **Verifica con il tool**: Usa verify_access_code con il codice fornito dall'utente

4. **ATTENDI il risultato** e leggi il campo authorized/verified nel JSON restituito

5. **Se AUTORIZZATO (authorized/verified: true)**:
   - Conferma verbalmente: "Perfetto, il codice è corretto. Procedo con le informazioni richieste."
   - Fornisci IMMEDIATAMENTE i dati usando gli strumenti finanziari appropriati
   - NON rimanere in silenzio - continua la conversazione fluidamente
   - Usa gli strumenti: get_financial_summary, get_balance_sheet, get_income_statement, get_financial_metrics, get_business_lines, get_cash_flow_statement, get_recent_events, ecc.

6. **Se NON AUTORIZZATO (authorized/verified: false)**:
   - Rispondi: "Mi dispiace, il codice fornito non è valido. Per ottenere un codice di accesso, può contattare l'amministrazione."
   - NON fornire NESSUN dato finanziario
   - Offri di aiutare con altre informazioni generali

**IMPORTANTE:** Non fornire MAI dati finanziari senza prima aver verificato il codice di accesso con successo.
{{/if}}

{{closingInstructions}}

Ricorda: Il tuo obiettivo è fornire un eccellente servizio clienti rappresentando {{companyName}} con professionalità.
`.trim();

/**
 * Default communication style section
 */
const DEFAULT_COMMUNICATION_STYLE = `
- Parla chiaramente e a un ritmo moderato
- Sii caloroso e accessibile mantenendo la professionalità
- Ascolta attivamente e fai domande di chiarimento quando necessario
- Mostra empatia e comprensione
- Mantieni le risposte concise ma informative
- Usa il nome di chi chiama quando lo fornisce
`.trim();

/**
 * Default language instructions section
 */
const DEFAULT_LANGUAGE_INSTRUCTIONS = `
- **Saluto Iniziale**: Saluta SEMPRE in italiano
- **Rilevamento Lingua**: Identifica automaticamente la lingua parlata dall'utente
- **Adattamento Immediato**: Dal secondo messaggio in poi, comunica nella lingua dell'utente
- **Coerenza Linguistica**: Mantieni la stessa lingua per tutta la durata della conversazione
`.trim();

/**
 * Default closing instructions section
 */
const DEFAULT_CLOSING_INSTRUCTIONS = `
## Chiusura Efficace:
Prima di chiudere OGNI chiamata, assicurati di:
1. **Riassumere** cosa è stato discusso/fatto
2. **Confermare** prossimi passi concreti
3. **Dare tempistiche** quando appropriato
4. **Ultima offerta**: "C'è altro che posso fare per lei oggi?"
5. **Ringraziamento**: "Grazie per aver chiamato. Buona giornata!"
`.trim();

/**
 * Builds agent instructions from configuration
 */
export class InstructionBuilder {
  private config: AgentConfig;
  private instructions: AgentInstructions | null;
  private knowledge: KnowledgeBase | null;

  constructor(
    config: AgentConfig,
    instructions: AgentInstructions | null,
    knowledge: KnowledgeBase | null
  ) {
    this.config = config;
    this.instructions = instructions;
    this.knowledge = knowledge;
  }

  /**
   * Build the final instruction string
   */
  build(): string {
    // If custom instructions mode, return custom text with variable substitution
    if (this.instructions && !this.instructions.useTemplate && this.instructions.customInstructions) {
      return this.processVariables(this.instructions.customInstructions);
    }

    // Use template mode
    return this.buildFromTemplate();
  }

  /**
   * Build instructions from template with sections
   */
  private buildFromTemplate(): string {
    let template = DEFAULT_TEMPLATE;
    const variables = this.buildVariables();

    // Replace section overrides first
    template = template.replace(
      '{{communicationStyle}}',
      this.instructions?.communicationStyle || DEFAULT_COMMUNICATION_STYLE
    );
    template = template.replace(
      '{{languageInstructions}}',
      this.instructions?.languageInstructions || DEFAULT_LANGUAGE_INSTRUCTIONS
    );
    template = template.replace(
      '{{closingInstructions}}',
      this.instructions?.closingInstructions || DEFAULT_CLOSING_INSTRUCTIONS
    );
    template = template.replace(
      '{{additionalInstructions}}',
      this.instructions?.additionalInstructions || ''
    );

    // Process conditional blocks: {{#if varName}}...{{/if}}
    template = this.processConditionals(template, variables);

    // Process each blocks for arrays: {{#each varName}}...{{/each}}
    template = this.processEachBlocks(template, variables);

    // Replace simple variables: {{variableName}}
    template = template.replace(/\{\{(\w+)\}\}/g, (_match, varName) => {
      const value = variables[varName];
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return value?.toString() || '';
    });

    // Clean up empty lines
    template = template
      .split('\n')
      .filter((line, index, arr) => {
        // Remove lines that are just whitespace if they follow another empty line
        if (line.trim() === '' && index > 0 && arr[index - 1].trim() === '') {
          return false;
        }
        return true;
      })
      .join('\n');

    return template.trim();
  }

  /**
   * Build template variables from knowledge base
   */
  private buildVariables(): TemplateVariables {
    const kb = this.knowledge;

    const services = (kb?.services as string[]) || [];
    const businessAreas = (kb?.businessAreas as string[]) || [];
    const partners = (kb?.partners as string[]) || [];

    // Parse transfer destinations from knowledge base
    const transferDestinations: TransferDestination[] =
      ((kb?.transferDestinations as unknown as TransferDestination[]) || [])
        .filter(d => d.enabled);

    // Format transfer destinations as a readable list for the agent
    const transferDestinationsList = transferDestinations.length > 0
      ? transferDestinations.map(d => {
          const label = d.name ? `${d.department} (${d.name})` : d.department;
          return `- ${label}: ${d.number}`;
        }).join('\n')
      : '';

    return {
      agentName: this.config.agentName,
      companyName: kb?.companyName || 'La Tua Azienda',
      companyTagline: kb?.companyTagline || '',
      companyDescription: kb?.companyDescription || '',
      companyMission: kb?.companyMission || '',
      phoneMain: kb?.phoneMain || '',
      phoneSupport: kb?.phoneSupport || '',
      email: kb?.email || '',
      website: kb?.website || '',
      address: kb?.address || '',
      city: kb?.city || '',
      postalCode: kb?.postalCode || '',
      region: kb?.region || '',
      country: kb?.country || 'Italia',
      timezone: kb?.timezone || 'CET/CEST',
      services,
      businessAreas,
      partners,
      partnersJoined: partners.join(', '),
      transferNumberMain: kb?.transferNumberMain || process.env.TRANSFER_NUMBER_MAIN || '',
      transferNumberSupport: kb?.transferNumberSupport || process.env.TRANSFER_NUMBER_SUPPORT || '',
      transferDestinations,
      transferDestinationsList,
      financialAccessEnabled: kb?.financialAccessEnabled ?? false,
    };
  }

  /**
   * Process variables in a text string
   */
  private processVariables(text: string): string {
    const variables = this.buildVariables();

    return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      const value = variables[varName];
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return value?.toString() || match;
    });
  }

  /**
   * Process conditional blocks: {{#if varName}}content{{/if}}
   */
  private processConditionals(template: string, variables: TemplateVariables): string {
    const ifRegex = /\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

    return template.replace(ifRegex, (_match, varName, content) => {
      const value = variables[varName];
      const hasValue = Array.isArray(value) ? value.length > 0 : !!value;
      return hasValue ? content : '';
    });
  }

  /**
   * Process each blocks for arrays: {{#each varName}}content with {{this}}{{/each}}
   */
  private processEachBlocks(template: string, variables: TemplateVariables): string {
    const eachRegex = /\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;

    return template.replace(eachRegex, (_match, varName, content) => {
      const value = variables[varName];
      if (!Array.isArray(value) || value.length === 0) return '';

      return value.map((item) => content.replace(/\{\{this\}\}/g, item)).join('');
    });
  }

  /**
   * Get available template variables for documentation
   */
  static getAvailableVariables(): string[] {
    return [
      'agentName',
      'companyName',
      'companyTagline',
      'companyDescription',
      'companyMission',
      'phoneMain',
      'phoneSupport',
      'email',
      'website',
      'address',
      'city',
      'postalCode',
      'region',
      'country',
      'timezone',
      'services',
      'businessAreas',
      'partners',
      'partnersJoined',
      'transferNumberMain',
      'transferNumberSupport',
      'transferDestinations',
      'transferDestinationsList',
      'financialAccessEnabled',
    ];
  }

  /**
   * Get the default template for reference
   */
  static getDefaultTemplate(): string {
    return DEFAULT_TEMPLATE;
  }

  /**
   * Get default section contents
   */
  static getDefaultSections(): {
    communicationStyle: string;
    languageInstructions: string;
    closingInstructions: string;
  } {
    return {
      communicationStyle: DEFAULT_COMMUNICATION_STYLE,
      languageInstructions: DEFAULT_LANGUAGE_INSTRUCTIONS,
      closingInstructions: DEFAULT_CLOSING_INSTRUCTIONS,
    };
  }
}
