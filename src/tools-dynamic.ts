import { z } from 'zod';
import { tool } from '@openai/agents/realtime';
import type { KnowledgeBase, ToolConfig } from '@prisma/client';
import type { CallState } from './agent.js';
import { callbackService } from './db/services/callbacks.js';
import { messageService } from './db/services/messages.js';

/**
 * Create tools dynamically based on user configuration
 */
export function createDynamicTools(
  getCallState: () => CallState,
  knowledge: KnowledgeBase | null,
  toolConfigs: ToolConfig[],
  financialAccessEnabled: boolean = false
): any[] {
  const enabledTools: any[] = [];

  // Build a map of tool configurations for quick lookup
  const toolConfigMap = new Map(
    toolConfigs.map((tc) => [tc.toolName, tc])
  );

  // Helper to check if tool is enabled
  const isEnabled = (name: string): boolean => {
    const config = toolConfigMap.get(name);
    return config?.enabled ?? true; // Default enabled if not configured
  };

  // ============================================
  // General Tools
  // ============================================

  // Company Info Tool
  if (isEnabled('get_company_info')) {
    enabledTools.push(createCompanyInfoTool(knowledge));
  }

  // Business Hours Tool
  if (isEnabled('get_business_hours')) {
    enabledTools.push(createBusinessHoursTool(knowledge));
  }

  // Location Tool
  if (isEnabled('get_location')) {
    enabledTools.push(createLocationTool(knowledge));
  }

  // Schedule Callback Tool
  if (isEnabled('schedule_callback')) {
    enabledTools.push(createScheduleCallbackTool());
  }

  // Take Message Tool
  if (isEnabled('take_message')) {
    enabledTools.push(createTakeMessageTool());
  }

  // Transfer Call Tool
  if (isEnabled('transfer_call')) {
    enabledTools.push(createTransferCallTool(getCallState, knowledge));
  }

  // ============================================
  // Financial Tools (if enabled)
  // ============================================

  if (financialAccessEnabled) {
    // Import and add financial tools if enabled
    const financialToolNames = [
      'verify_access_code',
      'get_financial_summary',
      'get_balance_sheet',
      'get_income_statement',
      'get_financial_metrics',
      'get_business_lines',
      'get_cash_flow_statement',
      'get_recent_events',
      'get_organizational_structure',
      'get_company_info_financial',
      'get_historical_comparison',
      'get_outlook_2025',
      'get_highlights_criticalities',
    ];

    try {
      // Dynamic import of financial tools
      // Note: We'll use the existing financial tools with their current implementation
      const { financialTools } = require('./financial-tools.js');

      // If user has custom access codes, override the verify tool
      if (knowledge?.financialAccessCodes && isEnabled('verify_access_code')) {
        const customCodes = knowledge.financialAccessCodes as string[];
        enabledTools.push(createCustomVerifyAccessCodeTool(customCodes));
      } else if (isEnabled('verify_access_code')) {
        // Use default verify tool
        const verifyTool = financialTools.find((t: any) => t.name === 'verify_access_code');
        if (verifyTool) enabledTools.push(verifyTool);
      }

      // Add other financial tools that are enabled
      for (const ft of financialTools) {
        if (ft.name !== 'verify_access_code' && financialToolNames.includes(ft.name)) {
          if (isEnabled(ft.name)) {
            enabledTools.push(ft);
          }
        }
      }
    } catch (error) {
      console.error('⚠️ Failed to load financial tools:', error);
    }
  }

  console.log(`🔧 Created ${enabledTools.length} dynamic tools`);
  return enabledTools;
}

// ============================================
// Tool Factory Functions
// ============================================

/**
 * Create Company Info tool with dynamic data from knowledge base
 */
function createCompanyInfoTool(knowledge: KnowledgeBase | null) {
  return tool({
    name: 'get_company_info',
    description: "Fornisce informazioni generali sull'azienda, i suoi servizi e i dettagli di contatto",
    parameters: z.object({}),
    execute: async () => {
      const services = (knowledge?.services as string[]) || [];
      const businessAreas = (knowledge?.businessAreas as string[]) || [];
      const partners = (knowledge?.partners as string[]) || [];

      return JSON.stringify({
        companyName: knowledge?.companyName || 'Azienda',
        tagline: knowledge?.companyTagline || '',
        description: knowledge?.companyDescription || '',
        mission: knowledge?.companyMission || '',
        services,
        businessAreas,
        partners,
        contact: {
          email: knowledge?.email || '',
          phone: knowledge?.phoneMain || '',
          supportPhone: knowledge?.phoneSupport || '',
          website: knowledge?.website || '',
        },
        location: {
          city: knowledge?.city || '',
          address: knowledge?.address || '',
          postalCode: knowledge?.postalCode || '',
          country: knowledge?.country || 'Italia',
        },
      });
    },
  });
}

/**
 * Create Business Hours tool with dynamic data
 */
function createBusinessHoursTool(knowledge: KnowledgeBase | null) {
  return tool({
    name: 'get_business_hours',
    description: "Fornisce gli orari di apertura dell'ufficio",
    parameters: z.object({}),
    execute: async () => {
      const defaultHours = {
        lunedi: '09:00 - 18:00',
        martedi: '09:00 - 18:00',
        mercoledi: '09:00 - 18:00',
        giovedi: '09:00 - 18:00',
        venerdi: '09:00 - 18:00',
        sabato: 'Chiuso',
        domenica: 'Chiuso',
      };

      return JSON.stringify({
        timezone: knowledge?.timezone || 'CET/CEST',
        orariRegolari: knowledge?.businessHours || defaultHours,
        telefono: knowledge?.phoneMain || '',
        note: knowledge?.holidayNote || 'Chiuso durante le festività nazionali',
      });
    },
  });
}

/**
 * Create Location tool with dynamic data
 */
function createLocationTool(knowledge: KnowledgeBase | null) {
  return tool({
    name: 'get_location',
    description: "Fornisce l'indirizzo fisico dell'ufficio e i dettagli sulla posizione",
    parameters: z.object({}),
    execute: async () => {
      const fullAddress = [
        knowledge?.address,
        knowledge?.postalCode,
        knowledge?.city,
        knowledge?.country || 'Italia',
      ]
        .filter(Boolean)
        .join(', ');

      let directions = {};
      if (knowledge?.directions) {
        try {
          directions = JSON.parse(knowledge.directions);
        } catch {
          directions = { note: knowledge.directions };
        }
      }

      return JSON.stringify({
        indirizzo: {
          via: knowledge?.address || '',
          citta: knowledge?.city || '',
          cap: knowledge?.postalCode || '',
          regione: knowledge?.region || '',
          paese: knowledge?.country || 'Italia',
        },
        indirizzoCompleto: fullAddress,
        comeRaggiungerci: directions,
      });
    },
  });
}

/**
 * Create Schedule Callback tool
 */
function createScheduleCallbackTool() {
  return tool({
    name: 'schedule_callback',
    description: 'Pianifica una richiesta di richiamata per un cliente',
    parameters: z.object({
      name: z.string().describe('Nome di chi chiama'),
      phoneNumber: z.string().describe('Numero di telefono per la richiamata'),
      preferredTime: z.string().describe('Orario preferito per la richiamata'),
      reason: z.string().nullable().optional().describe('Motivo della richiamata'),
      companyName: z.string().nullable().optional().describe("Nome dell'azienda del chiamante"),
      role: z.string().nullable().optional().describe('Ruolo del chiamante'),
    }),
    execute: async ({
      name,
      phoneNumber,
      preferredTime,
      reason,
      companyName,
      role,
    }: {
      name: string;
      phoneNumber: string;
      preferredTime: string;
      reason?: string | null;
      companyName?: string | null;
      role?: string | null;
    }) => {
      try {
        // Build reason string with lead info
        const reasonParts = [
          companyName && `Azienda: ${companyName}`,
          role && `Ruolo: ${role}`,
          reason,
        ].filter(Boolean);

        const callback = await callbackService.create({
          callerName: name,
          callerPhone: phoneNumber,
          preferredTime,
          reason: reasonParts.join(' | ') || undefined,
        });

        return JSON.stringify({
          success: true,
          callbackId: callback.referenceNumber,
          message: `Richiamata pianificata per ${name} ${preferredTime}. La richiameremo al numero ${phoneNumber}.`,
          numeroConferma: callback.referenceNumber,
        });
      } catch (error) {
        // Fallback to memory-only if database fails
        const callbackId = `RIC-${Date.now()}`;
        console.log('📋 Fallback callback (no DB):', { callbackId, name, phoneNumber, preferredTime });

        return JSON.stringify({
          success: true,
          callbackId,
          message: `Richiamata pianificata per ${name} ${preferredTime}.`,
          numeroConferma: callbackId,
        });
      }
    },
  });
}

/**
 * Create Take Message tool
 */
function createTakeMessageTool() {
  return tool({
    name: 'take_message',
    description: 'Prende un messaggio per un dipendente o un reparto',
    parameters: z.object({
      recipientName: z.string().describe('Nome del destinatario del messaggio'),
      callerName: z.string().describe('Nome di chi lascia il messaggio'),
      callerPhone: z.string().describe('Numero di telefono di chi chiama'),
      message: z.string().describe('Contenuto del messaggio'),
      urgent: z.boolean().nullable().optional().describe('Se il messaggio è urgente'),
    }),
    execute: async ({
      recipientName,
      callerName,
      callerPhone,
      message,
      urgent = false,
    }: {
      recipientName: string;
      callerName: string;
      callerPhone: string;
      message: string;
      urgent?: boolean | null;
    }) => {
      try {
        const savedMessage = await messageService.create({
          recipientName,
          callerName,
          callerPhone,
          content: message,
          urgent: urgent || false,
        });

        return JSON.stringify({
          success: true,
          messageId: savedMessage.referenceNumber,
          message: `Messaggio da ${callerName} registrato per ${recipientName}. ${urgent ? 'URGENTE.' : ''}`,
          numeroConferma: savedMessage.referenceNumber,
        });
      } catch (error) {
        // Fallback
        const messageId = `MSG-${Date.now()}`;
        console.log('📋 Fallback message (no DB):', { messageId, recipientName, callerName });

        return JSON.stringify({
          success: true,
          messageId,
          message: `Messaggio registrato per ${recipientName}.`,
          numeroConferma: messageId,
        });
      }
    },
  });
}

/**
 * Transfer destination structure (matches instruction-builder.ts)
 */
interface TransferDestination {
  id: string;
  department: string;
  name?: string;
  number: string;
  enabled: boolean;
}

/**
 * Find matching transfer destination from the destinations array
 */
function findTransferDestination(
  targetInput: string,
  destinations: TransferDestination[]
): TransferDestination | null {
  const lowerInput = targetInput.toLowerCase().trim();

  // Filter only enabled destinations
  const enabledDestinations = destinations.filter(d => d.enabled);

  // Try to find by exact department match first
  for (const dest of enabledDestinations) {
    if (dest.department.toLowerCase() === lowerInput) {
      return dest;
    }
  }

  // Try to find by partial department match
  for (const dest of enabledDestinations) {
    if (dest.department.toLowerCase().includes(lowerInput) ||
        lowerInput.includes(dest.department.toLowerCase())) {
      return dest;
    }
  }

  // Try to find by name match
  for (const dest of enabledDestinations) {
    if (dest.name && (
        dest.name.toLowerCase().includes(lowerInput) ||
        lowerInput.includes(dest.name.toLowerCase())
    )) {
      return dest;
    }
  }

  return null;
}

/**
 * Create Transfer Call tool with dynamic transfer numbers
 */
function createTransferCallTool(getCallState: () => CallState, knowledge: KnowledgeBase | null) {
  return tool({
    name: 'transfer_call',
    description: 'Trasferisce la chiamata attiva a un numero di telefono specifico o a un reparto configurato',
    parameters: z.object({
      targetNumber: z.string().describe('Numero di telefono, nome reparto o alias (es: "Supporto Tecnico", "vendite", "+390220527877")'),
      reason: z.string().nullable().optional().describe('Motivo del trasferimento'),
    }),
    execute: async ({ targetNumber, reason }: { targetNumber: string; reason?: string | null }) => {
      const callState = getCallState();
      const { callSid, streamSid, session, twilioWebSocket, storePendingTransfer } = callState;

      if (!callSid || !streamSid) {
        return JSON.stringify({ success: false, error: 'Call/Stream SID non disponibile' });
      }

      // Get transfer destinations from knowledge base
      const transferDestinations: TransferDestination[] =
        (knowledge?.transferDestinations as unknown as TransferDestination[]) || [];

      // Resolve transfer number - priority order:
      // 1. Check if it's already a valid phone number (starts with + or contains digits)
      // 2. Look up in dynamic transfer destinations
      // 3. Fall back to legacy aliases (support, vendite, etc.)
      let resolvedNumber = targetNumber;
      const lowerTarget = targetNumber.toLowerCase();

      // Check if input looks like a phone number
      const isPhoneNumber = /^[+\d]/.test(targetNumber.trim());

      if (!isPhoneNumber) {
        // Try to find in dynamic transfer destinations first
        const matchedDestination = findTransferDestination(targetNumber, transferDestinations);

        if (matchedDestination) {
          resolvedNumber = matchedDestination.number;
          console.log(`📍 Matched transfer destination: ${matchedDestination.department} → ${resolvedNumber}`);
        } else {
          // Fall back to legacy aliases
          if (lowerTarget.includes('support') || lowerTarget.includes('tecnico') || lowerTarget.includes('assistenza')) {
            resolvedNumber = knowledge?.transferNumberSupport || process.env.TRANSFER_NUMBER_SUPPORT || targetNumber;
          } else if (
            lowerTarget.includes('main') ||
            lowerTarget.includes('vendite') ||
            lowerTarget.includes('commerciale') ||
            lowerTarget.includes('generale')
          ) {
            resolvedNumber = knowledge?.transferNumberMain || process.env.TRANSFER_NUMBER_MAIN || targetNumber;
          }
        }
      }

      console.log('🔄 Transfer initiated:', { callSid, target: resolvedNumber, reason, originalInput: targetNumber });

      try {
        // Store the pending transfer
        storePendingTransfer(callSid, resolvedNumber);

        // Close WebSocket to trigger transfer-complete endpoint
        if (session && twilioWebSocket?.readyState === 1) {
          // Wait a moment for any pending audio
          await new Promise((resolve) => setTimeout(resolve, 3000));

          // Close the WebSocket
          twilioWebSocket.close(1000, 'Call transfer initiated');

          // Wait for close confirmation
          await new Promise<void>((resolve) => {
            const timeout = setTimeout(resolve, 3000);
            twilioWebSocket.once('close', () => {
              clearTimeout(timeout);
              resolve();
            });
          });
        }

        return JSON.stringify({
          success: true,
          message: `Trasferimento in corso a ${resolvedNumber}`,
          callSid,
          targetNumber: resolvedNumber,
        });
      } catch (error: any) {
        return JSON.stringify({
          success: false,
          error: 'Errore durante il trasferimento: ' + error.message,
        });
      }
    },
  });
}

/**
 * Create custom verify access code tool with user-defined codes
 */
function createCustomVerifyAccessCodeTool(validCodes: string[]) {
  return tool({
    name: 'verify_access_code',
    description: 'Verifica il codice di accesso fornito dal chiamante per accedere ai dati finanziari',
    parameters: z.object({
      accessCode: z.string().describe("Il codice di accesso fornito dall'utente"),
    }),
    execute: async ({ accessCode }: { accessCode: string }) => {
      const normalizedInput = accessCode.toUpperCase().trim();
      const isValid = validCodes.some((code) => code.toUpperCase().trim() === normalizedInput);

      if (isValid) {
        return JSON.stringify({
          success: true,
          verified: true,
          message: 'Codice verificato. Accesso ai dati finanziari autorizzato.',
        });
      } else {
        return JSON.stringify({
          success: true,
          verified: false,
          message: 'Codice non valido. Accesso negato.',
        });
      }
    },
  });
}

/**
 * Get list of all available tools with their descriptions
 */
export function getToolDefinitions(): Array<{ name: string; description: string; category: string }> {
  return [
    // General tools
    { name: 'get_company_info', description: "Fornisce informazioni sull'azienda", category: 'general' },
    { name: 'get_business_hours', description: 'Fornisce gli orari di apertura', category: 'general' },
    { name: 'get_location', description: "Fornisce l'indirizzo dell'ufficio", category: 'general' },
    { name: 'schedule_callback', description: 'Pianifica una richiamata', category: 'general' },
    { name: 'take_message', description: 'Prende un messaggio per un dipendente', category: 'general' },
    { name: 'transfer_call', description: 'Trasferisce la chiamata', category: 'general' },
    // Financial tools
    { name: 'verify_access_code', description: 'Verifica il codice di accesso', category: 'financial' },
    { name: 'get_financial_summary', description: 'Sintesi finanziaria', category: 'financial' },
    { name: 'get_balance_sheet', description: 'Stato patrimoniale', category: 'financial' },
    { name: 'get_income_statement', description: 'Conto economico', category: 'financial' },
    { name: 'get_financial_metrics', description: 'KPI finanziari', category: 'financial' },
    { name: 'get_business_lines', description: 'Linee di business', category: 'financial' },
    { name: 'get_cash_flow_statement', description: 'Rendiconto finanziario', category: 'financial' },
    { name: 'get_recent_events', description: 'Eventi recenti', category: 'financial' },
    { name: 'get_organizational_structure', description: 'Struttura organizzativa', category: 'financial' },
    { name: 'get_company_info_financial', description: 'Info istituzionali', category: 'financial' },
    { name: 'get_historical_comparison', description: 'Confronto storico', category: 'financial' },
    { name: 'get_outlook_2025', description: 'Outlook 2025', category: 'financial' },
    { name: 'get_highlights_criticalities', description: 'Highlights e criticità', category: 'financial' },
  ];
}
