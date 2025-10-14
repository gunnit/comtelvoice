import { z } from 'zod';
import { tool } from '@openai/agents/realtime';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load financial data
const financialDataPath = path.join(__dirname, 'data', 'financial-data.json');
const financialData = JSON.parse(fs.readFileSync(financialDataPath, 'utf-8'));

// Access codes for financial data (in production, use environment variables or database)
const ACCESS_CODES = ['COMTEL2024', 'FINANCE123', 'BILANCIO2024'];

/**
 * Tool: Verify Access Code
 * Verifies the access code provided by the caller to authorize access to financial data
 */
export const verifyAccessCode = tool({
  name: 'verify_access_code',
  description: 'Verifica il codice di accesso fornito dall\'utente per autorizzare l\'accesso ai dati finanziari riservati',
  parameters: z.object({
    accessCode: z.string().describe('Codice di accesso fornito dall\'utente')
  }),
  execute: async ({ accessCode }) => {
    const isValid = ACCESS_CODES.includes(accessCode.toUpperCase().trim());

    console.log(`🔐 Tentativo di accesso ai dati finanziari - Codice: ${accessCode} - Risultato: ${isValid ? '✅ AUTORIZZATO' : '❌ NEGATO'}`);

    return JSON.stringify({
      authorized: isValid,
      message: isValid
        ? 'Accesso autorizzato. Posso ora fornirle le informazioni finanziarie richieste.'
        : 'Mi dispiace, il codice fornito non è valido. Per accedere ai dati finanziari riservati, la prego di contattare l\'amministrazione al +39 02 2052781.',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Tool: Get Financial Summary
 * Provides a summary of the main financial data for fiscal year 2024
 */
export const getFinancialSummary = tool({
  name: 'get_financial_summary',
  description: 'Fornisce una sintesi dei principali dati finanziari dell\'esercizio 2024 di Comtel Italia',
  parameters: z.object({}),
  execute: async () => {
    console.log('📊 Richiesta sintesi finanziaria');

    return JSON.stringify({
      annoFiscale: financialData.annoFiscale,
      sintesi: financialData.sintesiFinanziaria,
      valutazione: financialData.sintesiFinanziaria.valutazioneComplessiva,
      highlights: financialData.highlights2024.slice(0, 5), // Top 5 highlights
      dataApprovazione: financialData.dataApprovazioneBilancio
    });
  }
});

/**
 * Tool: Get Balance Sheet
 * Provides the complete balance sheet as of December 31, 2024
 */
export const getBalanceSheet = tool({
  name: 'get_balance_sheet',
  description: 'Fornisce lo stato patrimoniale completo al 31 dicembre 2024',
  parameters: z.object({}),
  execute: async () => {
    console.log('📊 Richiesta stato patrimoniale');

    return JSON.stringify({
      anno: financialData.annoFiscale,
      dataChiusura: financialData.dataChiusuraEsercizio,
      statoPatrimoniale: financialData.statoPatrimoniale,
      note: 'Dati espressi in Euro. Totale attivo = Totale passivo = €29.690.258',
      revisore: 'EY S.p.A. - Parere positivo senza rilievi'
    });
  }
});

/**
 * Tool: Get Income Statement
 * Provides the income statement for fiscal year 2024
 */
export const getIncomeStatement = tool({
  name: 'get_income_statement',
  description: 'Fornisce il conto economico dell\'esercizio 2024 con dettaglio di ricavi, costi e risultato',
  parameters: z.object({}),
  execute: async () => {
    console.log('📊 Richiesta conto economico');

    return JSON.stringify({
      anno: financialData.annoFiscale,
      contoEconomico: financialData.contoEconomico,
      confronto: financialData.confrontoStorico,
      interpretazione: {
        valoreProduzione: '€42.5M (+1.2% vs 2023)',
        risultatoOperativo: '€1.1M (EBIT margin 2.6%)',
        risultatoNetto: '€148k (ritorno all\'utile dopo perdita €4.4M nel 2023)'
      }
    });
  }
});

/**
 * Tool: Get Financial Metrics (KPIs)
 * Provides key performance indicators and financial ratios
 */
export const getFinancialMetrics = tool({
  name: 'get_financial_metrics',
  description: 'Fornisce i principali indicatori finanziari (KPI) e indici di bilancio',
  parameters: z.object({}),
  execute: async () => {
    console.log('📊 Richiesta indicatori finanziari (KPI)');

    return JSON.stringify({
      anno: financialData.annoFiscale,
      indicatori: financialData.indicatoriChiave,
      interpretazione: {
        redditualita: 'ROI eccellente al 31.8%, EBITDA ricorrente margin al 4.8%',
        solidita: 'PFN/EBITDA migliorato da 2.3x a 1.3x (-43% indebitamento)',
        liquidita: 'Disponibilità liquide €2.9M, DSO 120gg, DPO 140gg',
        valutazioneComplessiva: 'Indicatori in netto miglioramento rispetto al 2023'
      }
    });
  }
});

/**
 * Tool: Get Business Lines Performance
 * Provides revenues and performance for each business line
 */
export const getBusinessLines = tool({
  name: 'get_business_lines',
  description: 'Fornisce ricavi e performance per ciascuna linea di business (Networking & Security, Customer & User Interaction, Infrastructure Technology, Audio Video)',
  parameters: z.object({}),
  execute: async () => {
    console.log('📊 Richiesta performance linee di business');

    return JSON.stringify({
      anno: financialData.annoFiscale,
      lineeBusiness: financialData.lineeBusiness,
      distribuzioneGeografica: financialData.distribuzioneGeografica,
      analisi: {
        topPerformer: 'Infrastructure Technology: +48.2% (€7.0M)',
        crescita: 'Customer & User Interaction: +11.3% (€18.7M)',
        principale: 'Customer & User Interaction rappresenta il 44.4% dei ricavi',
        mercato: 'Italia 95.4%, Europa 0.7%, Extra-Europa 4.0%'
      }
    });
  }
});

/**
 * Tool: Get Cash Flow Statement
 * Provides the cash flow statement for fiscal year 2024
 */
export const getCashFlowStatement = tool({
  name: 'get_cash_flow_statement',
  description: 'Fornisce il rendiconto finanziario con i flussi di cassa per attività operativa, investimento e finanziamento',
  parameters: z.object({}),
  execute: async () => {
    console.log('📊 Richiesta rendiconto finanziario');

    return JSON.stringify({
      anno: financialData.annoFiscale,
      rendicontoFinanziario: financialData.rendicontoFinanziario,
      analisi: {
        flussiOperativi: '€3.3M positivi - ottima generazione di cassa dalla gestione',
        flussiInvestimento: '-€1.4M per crescita (immobilizzazioni e sviluppo)',
        flussiFinanziamento: '-€1.4M per rimborso debiti bancari',
        variazioneLiquidita: '+€501k - liquidità finale €2.9M'
      }
    });
  }
});

/**
 * Tool: Get Recent Corporate Events
 * Provides information on significant corporate events in 2025
 */
export const getRecentEvents = tool({
  name: 'get_recent_events',
  description: 'Fornisce informazioni su eventi societari rilevanti del 2025 (quotazione, acquisizioni, operazioni straordinarie)',
  parameters: z.object({}),
  execute: async () => {
    console.log('📊 Richiesta eventi societari rilevanti');

    return JSON.stringify({
      eventiRilevanti: financialData.eventiRilevanti2025,
      impatti: {
        quotazioneEGM: 'Raccolta €4.9M, accesso mercato capitali, maggiore visibilità',
        acquisizioni: 'Novanext (€1.9M) e accordo NEC per espansione capacità e mercato',
        capitale: 'Riduzione capitale 2024 per copertura perdita 2023, poi rafforzamento via IPO'
      }
    });
  }
});

/**
 * Tool: Get Organizational Structure
 * Provides information on organizational structure and management
 */
export const getOrganizationalStructure = tool({
  name: 'get_organizational_structure',
  description: 'Fornisce informazioni sulla struttura organizzativa, management e personale di Comtel',
  parameters: z.object({}),
  execute: async () => {
    console.log('📊 Richiesta struttura organizzativa');

    return JSON.stringify({
      strutturaOrganizzativa: financialData.strutturaOrganizzativa,
      personale: financialData.personale,
      governance: financialData.societa.governance,
      note: 'Dott. Mattia Conti ricopre i ruoli di Deputy GM e CCO. Team di 117 dipendenti (+10 vs 2023)'
    });
  }
});

/**
 * Tool: Get Company Information (Financial Context)
 * Provides institutional and legal information about the company
 */
export const getCompanyInfoFinancial = tool({
  name: 'get_company_info_financial',
  description: 'Fornisce informazioni istituzionali, anagrafiche e legali della società (sede, contatti, certificazioni, governance)',
  parameters: z.object({}),
  execute: async () => {
    console.log('📊 Richiesta informazioni società');

    return JSON.stringify({
      societa: financialData.societa,
      certificazioni: financialData.societa.certificazioni,
      partnerTecnologici: financialData.partnerTecnologici,
      serviziPrincipali: financialData.serviziPrincipali
    });
  }
});

/**
 * Tool: Get Historical Comparison
 * Provides comparison between 2024 and 2023 results
 */
export const getHistoricalComparison = tool({
  name: 'get_historical_comparison',
  description: 'Fornisce un confronto dettagliato tra i risultati 2024 e 2023 con variazioni percentuali',
  parameters: z.object({}),
  execute: async () => {
    console.log('📊 Richiesta confronto storico 2024 vs 2023');

    return JSON.stringify({
      confrontoStorico: financialData.confrontoStorico,
      highlights: [
        'Ritorno all\'utile: da -€4.4M a +€148k',
        'Riduzione PFN: da €4.5M a €2.6M (-43%)',
        'EBITDA ricorrente: da €2.0M a €2.0M (+2.8%)',
        'Ricavi sostanzialmente stabili: +0.5%',
        'ROI in miglioramento: da 29.7% a 31.8%'
      ]
    });
  }
});

/**
 * Tool: Get 2025 Outlook and Opportunities
 * Provides information on 2025 prospects, opportunities and risks
 */
export const getOutlook2025 = tool({
  name: 'get_outlook_2025',
  description: 'Fornisce le prospettive per il 2025, opportunità di crescita e rischi identificati',
  parameters: z.object({}),
  execute: async () => {
    console.log('📊 Richiesta prospettive 2025');

    return JSON.stringify({
      prospettive2025: financialData.prospettive2025,
      opportunita: financialData.opportunita2025,
      criticita: financialData.criticita,
      target: 'Consolidamento risultati positivi 2024, crescita organica e inorganica, miglioramento marginalità',
      rischi: 'Incertezza macro, integrazione acquisizioni, gestione crescita, competizione mercato'
    });
  }
});

/**
 * Tool: Get Highlights and Key Points
 * Provides the main highlights, strengths and critical points of 2024
 */
export const getHighlightsAndCriticalities = tool({
  name: 'get_highlights_criticalities',
  description: 'Fornisce i principali successi dell\'anno 2024 e le aree di attenzione identificate',
  parameters: z.object({}),
  execute: async () => {
    console.log('📊 Richiesta highlights e criticità');

    return JSON.stringify({
      highlights: financialData.highlights2024,
      criticita: financialData.criticita,
      opportunita: financialData.opportunita2025,
      bilanciamento: 'Risultati molto positivi con ritorno all\'utile e riduzione debito, ma attenzione a giorni medi pagamento e marginalità operativa'
    });
  }
});

/**
 * Export all financial tools
 */
export const financialTools = [
  verifyAccessCode,
  getFinancialSummary,
  getBalanceSheet,
  getIncomeStatement,
  getFinancialMetrics,
  getBusinessLines,
  getCashFlowStatement,
  getRecentEvents,
  getOrganizationalStructure,
  getCompanyInfoFinancial,
  getHistoricalComparison,
  getOutlook2025,
  getHighlightsAndCriticalities
];
