import OpenAI from 'openai';

const openai = new OpenAI();

export interface AnalysisResult {
  summary: string;
  sentiment: {
    overall: 'positive' | 'neutral' | 'negative' | 'frustrated';
    trend?: 'improving' | 'stable' | 'declining';
    score?: number;
  };
  intent: {
    primary: 'sales_inquiry' | 'support' | 'complaint' | 'info_request' | 'callback_request' | 'other';
    secondary?: string[];
  };
  entities: {
    names: string[];
    products: string[];
    dates: string[];
    phones: string[];
    emails: string[];
  };
  actionItems: Array<{
    description: string;
    assignee?: string;
    priority?: string;
  }>;
  urgency: {
    score: 'low' | 'medium' | 'high' | 'critical';
    reason?: string;
  };
  leadScore?: {
    score: 'hot' | 'warm' | 'cold';
    reason?: string;
  };
  faq: {
    isFaq: boolean;
    topic?: string;
  };
  resolution: 'resolved' | 'needs_followup' | 'escalated' | 'unknown';
  topicTags: string[];
  language: string;
}

const ANALYSIS_SYSTEM_PROMPT = `Sei un esperto analista di trascrizioni telefoniche per Comtel Italia, un'azienda leader nell'integrazione di sistemi ICT.

I servizi dell'azienda includono: VoIP, Unified Communications, Network Security, Cloud, Cybersecurity, Session Border Controller, Data Networking, Modern Work.

Analizza la seguente trascrizione di una chiamata telefonica ed estrai informazioni strutturate.

IMPORTANTE: Rispondi SOLO con un oggetto JSON valido, senza testo aggiuntivo. Il JSON deve seguire esattamente questa struttura:

{
  "summary": "Riepilogo di 2-3 frasi della chiamata in italiano",
  "sentiment": {
    "overall": "positive|neutral|negative|frustrated",
    "trend": "improving|stable|declining",
    "score": -1.0 a 1.0
  },
  "intent": {
    "primary": "sales_inquiry|support|complaint|info_request|callback_request|other",
    "secondary": ["array di altri intenti rilevati"]
  },
  "entities": {
    "names": ["nomi di persone menzionate"],
    "products": ["prodotti/servizi discussi"],
    "dates": ["date/orari menzionati"],
    "phones": ["numeri di telefono"],
    "emails": ["indirizzi email"]
  },
  "actionItems": [
    {"description": "azione necessaria", "assignee": "se menzionato", "priority": "high|medium|low"}
  ],
  "urgency": {
    "score": "low|medium|high|critical",
    "reason": "breve spiegazione"
  },
  "leadScore": {
    "score": "hot|warm|cold",
    "reason": "breve spiegazione per chiamate commerciali"
  },
  "faq": {
    "isFaq": true|false,
    "topic": "argomento se FAQ rilevata"
  },
  "resolution": "resolved|needs_followup|escalated|unknown",
  "topicTags": ["VoIP", "Security", "Cloud", "Pricing", ecc.],
  "language": "lingua principale del chiamante (it/en/altro)"
}

Note per l'analisi:
- "sentiment.overall": valuta il tono generale del chiamante
- "sentiment.trend": come è cambiato il sentiment durante la chiamata
- "intent.primary": l'obiettivo principale del chiamante
- "urgency": basato sul linguaggio e contesto usato
- "leadScore": valuta solo per chiamate commerciali, altrimenti ometti
- "faq": marca come true se è una domanda comune che potrebbe essere automatizzata
- "resolution": se il problema/richiesta è stato risolto durante la chiamata
- "topicTags": categorie pertinenti ai servizi Comtel`;

export interface AnalyzeOptions {
  model?: 'gpt-4.1' | 'gpt-5.1' | 'gpt-5-mini';
}

export interface AnalyzeResponse {
  result: AnalysisResult;
  tokensUsed: number;
  processingTimeMs: number;
}

/**
 * Analyze a transcript using OpenAI
 */
export async function analyzeTranscript(
  transcript: string,
  options: AnalyzeOptions = {}
): Promise<AnalyzeResponse> {
  const model = options.model || 'gpt-5.1';
  const startTime = Date.now();

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
        { role: 'user', content: `Trascrizione da analizzare:\n\n${transcript}` },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const processingTimeMs = Date.now() - startTime;
    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    const result = JSON.parse(content) as AnalysisResult;
    const tokensUsed = response.usage?.total_tokens || 0;

    // Validate and provide defaults for required fields
    const validatedResult: AnalysisResult = {
      summary: result.summary || 'Analisi non disponibile',
      sentiment: {
        overall: result.sentiment?.overall || 'neutral',
        trend: result.sentiment?.trend,
        score: result.sentiment?.score,
      },
      intent: {
        primary: result.intent?.primary || 'other',
        secondary: result.intent?.secondary || [],
      },
      entities: {
        names: result.entities?.names || [],
        products: result.entities?.products || [],
        dates: result.entities?.dates || [],
        phones: result.entities?.phones || [],
        emails: result.entities?.emails || [],
      },
      actionItems: result.actionItems || [],
      urgency: {
        score: result.urgency?.score || 'low',
        reason: result.urgency?.reason,
      },
      leadScore: result.leadScore,
      faq: {
        isFaq: result.faq?.isFaq || false,
        topic: result.faq?.topic,
      },
      resolution: result.resolution || 'unknown',
      topicTags: result.topicTags || [],
      language: result.language || 'it',
    };

    return {
      result: validatedResult,
      tokensUsed,
      processingTimeMs,
    };
  } catch (error) {
    console.error('Failed to analyze transcript:', error);
    throw error;
  }
}
