import type { AgentInstructions, KnowledgeBase, AgentConfig } from '@prisma/client';

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
  [key: string]: string | string[];
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

## Trasferimenti Telefonici:
Per richieste che richiedono altri reparti, usa il tool transfer_call:
{{#if transferNumberMain}}1. **Richieste Commerciali/Generali**: transfer_call a {{transferNumberMain}}{{/if}}
{{#if transferNumberSupport}}2. **Supporto Tecnico**: transfer_call a {{transferNumberSupport}}{{/if}}

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
