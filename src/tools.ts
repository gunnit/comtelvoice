import { z } from 'zod';
import { tool } from '@openai/agents/realtime';
import { callbackService } from './db/services/callbacks.js';
import { messageService } from './db/services/messages.js';
import type { CallState } from './agent.js';

/**
 * Tool: Get Company Information
 * Returns basic information about Comtel Italia
 */
export const getCompanyInfo = tool({
  name: 'get_company_info',
  description: 'Fornisce informazioni generali su Comtel Italia, i suoi servizi e i dettagli di contatto',
  parameters: z.object({}),
  execute: async () => {
    return JSON.stringify({
      companyName: 'Comtel Italia',
      tagline: '#WEconnect',
      description: 'Leader nell\'integrazione di sistemi ICT in Italia da oltre 20 anni',
      mission: 'Uniamo persone, tecnologie e informazioni in un\'unica infrastruttura dinamica e scalabile',
      services: [
        'VoIP e Unified Communications',
        'Session Border Controller e Media Gateway',
        'Modern Work e Collaboration',
        'Data Networking',
        'Network Security e Cybersecurity',
        'Cloud e IT Transformation',
        'Infrastrutture Tecnologiche',
        'Audio e Video Solutions'
      ],
      businessAreas: [
        'Customer & User Interaction',
        'Networking & Security',
        'Infrastructure Technology',
        'Audio & Video'
      ],
      partners: [
        'Microsoft',
        'Huawei',
        'HPE'
      ],
      contact: {
        email: 'info@comtelitalia.it',
        phone: '+39 02 2052781',
        supportPhone: '+39 800 200 960',
        website: 'www.comtelitalia.it',
        linkedin: 'linkedin.com/company/comtel-italia',
        youtube: 'youtube.com/@comtelitalia'
      },
      location: {
        city: 'Milano',
        address: 'Via Vittor Pisani, 10',
        country: 'Italia'
      }
    });
  }
});

/**
 * Tool: Get Business Hours
 * Returns the operating hours for Comtel Italia office
 */
export const getBusinessHours = tool({
  name: 'get_business_hours',
  description: 'Fornisce gli orari di apertura dell\'ufficio Comtel Italia',
  parameters: z.object({}),
  execute: async () => {
    return JSON.stringify({
      timezone: 'CET/CEST (UTC+1/UTC+2)',
      orariRegolari: {
        lunedi: '09:00 - 18:00',
        martedi: '09:00 - 18:00',
        mercoledi: '09:00 - 18:00',
        giovedi: '09:00 - 18:00',
        venerdi: '09:00 - 18:00',
        sabato: 'Chiuso',
        domenica: 'Chiuso'
      },
      telefono: '+39 02 2052781',
      assistenzaClienti: '+39 800 200 960 (numero verde)',
      orariAssistenza: 'Assistenza disponibile durante gli orari d\'ufficio',
      festivita: 'Chiuso durante le festività nazionali italiane',
      note: 'Per assistenza urgente fuori orario, contattare il numero verde'
    });
  }
});

/**
 * Tool: Get Office Location
 * Returns the physical address and location details for Comtel Italia
 */
export const getLocation = tool({
  name: 'get_location',
  description: 'Fornisce l\'indirizzo fisico dell\'ufficio e i dettagli sulla posizione di Comtel Italia',
  parameters: z.object({}),
  execute: async () => {
    return JSON.stringify({
      indirizzo: {
        via: 'Via Vittor Pisani, 10',
        citta: 'Milano',
        cap: '20124',
        regione: 'Lombardia',
        paese: 'Italia'
      },
      indirizzoCompleto: 'Via Vittor Pisani, 10, 20124 Milano, Italia',
      comeRaggiungerci: {
        metro: 'Metro M2 (Linea Verde) - Fermata Centrale FS o Repubblica, a 5 minuti a piedi',
        treno: 'Stazione Milano Centrale - 10 minuti a piedi',
        auto: 'Facilmente raggiungibile dal centro di Milano',
        parcheggio: 'Parcheggi pubblici disponibili nelle vicinanze'
      },
      puntiDiRiferimento: 'Zona Porta Nuova, vicino alla Stazione Centrale di Milano',
      coordinate: {
        latitudine: 45.4773,
        longitudine: 9.2025
      }
    });
  }
});

/**
 * Tool: Schedule Callback
 * Records a callback request with caller details
 * Now saves to PostgreSQL database
 */
export const scheduleCallback = tool({
  name: 'schedule_callback',
  description: 'Pianifica una richiesta di richiamata per un cliente',
  parameters: z.object({
    name: z.string().describe('Nome di chi chiama'),
    phoneNumber: z.string().describe('Numero di telefono per la richiamata'),
    preferredTime: z.string().describe('Orario preferito per la richiamata (es: "domani mattina", "questo pomeriggio", "alle 14:00")'),
    reason: z.string().nullable().optional().describe('Motivo della richiamata o argomento da discutere')
  }),
  execute: async ({ name, phoneNumber, preferredTime, reason }: {
    name: string;
    phoneNumber: string;
    preferredTime: string;
    reason?: string | null;
  }) => {
    try {
      // Save to database
      const callback = await callbackService.create({
        callerName: name,
        callerPhone: phoneNumber,
        preferredTime,
        reason: reason || undefined,
      });

      console.log('📊 Callback saved to database:', callback.referenceNumber);

      return JSON.stringify({
        success: true,
        callbackId: callback.referenceNumber,
        message: `Richiamata pianificata per ${name} ${preferredTime}. La richiameremo al numero ${phoneNumber}.`,
        numeroConferma: callback.referenceNumber
      });
    } catch (error) {
      // Fallback: if database fails, still provide service with console logging
      console.error('⚠️  Database save failed, using fallback logging:', error);
      const callbackId = `RIC-${Date.now()}`;

      console.log('Richiesta di Richiamata Registrata (fallback):', {
        callbackId,
        nome: name,
        telefono: phoneNumber,
        orarioPreferito: preferredTime,
        motivo: reason || 'Non specificato'
      });

      return JSON.stringify({
        success: true,
        callbackId,
        message: `Richiamata pianificata per ${name} ${preferredTime}. La richiameremo al numero ${phoneNumber}.`,
        numeroConferma: callbackId
      });
    }
  }
});

/**
 * Tool: Take Message
 * Records a message for a specific employee or department at Comtel Italia
 * Now saves to PostgreSQL database
 */
export const takeMessage = tool({
  name: 'take_message',
  description: 'Prende un messaggio per un dipendente o un reparto di Comtel Italia',
  parameters: z.object({
    recipientName: z.string().describe('Nome della persona o del reparto per cui è il messaggio'),
    callerName: z.string().describe('Nome della persona che lascia il messaggio'),
    callerPhone: z.string().describe('Numero di telefono di chi chiama'),
    message: z.string().describe('Contenuto del messaggio'),
    urgent: z.boolean().nullable().optional().describe('Se il messaggio è urgente')
  }),
  execute: async ({ recipientName, callerName, callerPhone, message, urgent = false }: {
    recipientName: string;
    callerName: string;
    callerPhone: string;
    message: string;
    urgent?: boolean | null;
  }) => {
    try {
      // Save to database
      const savedMessage = await messageService.create({
        recipientName,
        callerName,
        callerPhone,
        content: message,
        urgent: urgent || false,
      });

      console.log('📊 Message saved to database:', savedMessage.referenceNumber);

      return JSON.stringify({
        success: true,
        messageId: savedMessage.referenceNumber,
        message: `Messaggio registrato per ${recipientName}. ${urgent ? 'È stato contrassegnato come urgente e verrà notificato immediatamente.' : 'Riceverà questo messaggio a breve.'}`,
        numeroConferma: savedMessage.referenceNumber
      });
    } catch (error) {
      // Fallback: if database fails, still provide service with console logging
      console.error('⚠️  Database save failed, using fallback logging:', error);
      const messageId = `MSG-${Date.now()}`;

      console.log('Messaggio Registrato (fallback):', {
        messageId,
        destinatario: recipientName,
        da: callerName,
        telefono: callerPhone,
        contenuto: message,
        urgente: urgent,
        priorita: urgent ? 'ALTA' : 'NORMALE'
      });

      return JSON.stringify({
        success: true,
        messageId,
        message: `Messaggio registrato per ${recipientName}. ${urgent ? 'È stato contrassegnato come urgente e verrà notificato immediatamente.' : 'Riceverà questo messaggio a breve.'}`,
        numeroConferma: messageId
      });
    }
  }
});

/**
 * Tool: Transfer Call
 * Transfers the active call to another phone number using TwiML update method
 * Compatible with SIP trunk setup and active WebSocket streams
 * @param getCallState - Function to retrieve current call state from memory
 */
export const createTransferCallTool = (getCallState: () => CallState) => {
  return tool({
    name: 'transfer_call',
    description: 'Trasferisce la chiamata attiva a un numero di telefono specifico (reparto tecnico, ufficio, dipendente)',
    parameters: z.object({
      targetNumber: z.string().describe('Numero di telefono di destinazione in formato internazionale (es: +39022052781)'),
      reason: z.string().nullable().optional().describe('Motivo del trasferimento (es: "assistenza tecnica", "parlare con Mario Rossi")')
    }),
    execute: async ({ targetNumber, reason }: {
      targetNumber: string;
      reason?: string | null;
    }) => {
      // Get call state from memory (not database)
      const callState = getCallState();
      const { callSid, callerNumber, twilioNumber, streamSid, session, storePendingTransfer } = callState;

      if (!callSid) {
        return JSON.stringify({
          success: false,
          error: 'Call SID non disponibile. Impossibile trasferire la chiamata.'
        });
      }

      if (!streamSid) {
        return JSON.stringify({
          success: false,
          error: 'Stream SID non disponibile. Impossibile trasferire la chiamata.'
        });
      }

      console.log('🔄 Tentativo di trasferimento chiamata:', {
        callSid,
        caller: callerNumber || 'unknown',
        twilioNumber: twilioNumber || 'unknown',
        numeroDestinazione: targetNumber,
        motivo: reason || 'Non specificato',
        timestamp: new Date().toISOString()
      });

      try {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔄 TRANSFER TOOL EXECUTION START');
        console.log('⏰ Timestamp:', new Date().toISOString());

        // STEP 1: Store pending transfer
        // This will be checked by /transfer-complete endpoint when Twilio calls it
        storePendingTransfer(callSid, targetNumber);
        console.log('✅ Transfer pending stored');
        console.log('   Call SID:', callSid);
        console.log('   Target:', targetNumber);
        console.log('   Reason:', reason || 'Non specificato');

        // STEP 2: Close session to trigger Twilio action URL callback
        // The SDK handles WebSocket closure properly - no manual intervention needed
        if (session) {
          console.log('🔌 Closing session...');
          console.log('   Stream SID:', streamSid);
          console.log('   Transport status before close:', (session.transport as any).status);

          const closeStartTime = Date.now();

          try {
            await session.close();

            const closeEndTime = Date.now();
            const closeDuration = closeEndTime - closeStartTime;

            console.log('✅ Session closed successfully');
            console.log('   Close duration:', closeDuration, 'ms');
            console.log('   Transport status after close:', (session.transport as any).status);
            console.log('   Twilio should now call /transfer-complete immediately');
          } catch (closeError: any) {
            console.error('❌ Error closing session:', {
              name: closeError.name,
              message: closeError.message,
              stack: closeError.stack
            });
            throw closeError; // Re-throw to see if this prevents transfer
          }
        } else {
          console.log('⚠️  No session available to close');
          return JSON.stringify({
            success: false,
            error: 'Session non disponibile per il trasferimento'
          });
        }

        console.log('✅ Transfer initiated successfully');
        console.log('   Method: action_url_callback');
        console.log('   Twilio will now call /transfer-complete to get TwiML');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        return JSON.stringify({
          success: true,
          message: `Trasferimento in corso a ${targetNumber}`,
          callSid,
          targetNumber,
          reason: reason || 'Non specificato',
          method: 'action_url_callback'
        });
      } catch (error: any) {
        // Handle errors during transfer
        console.error('❌ Errore durante il trasferimento della chiamata:', {
          errorType: error.constructor.name,
          message: error.message
        });

        // Provide user-friendly error message
        return JSON.stringify({
          success: false,
          error: 'Errore tecnico durante il trasferimento: ' + (error.message || 'Errore sconosciuto'),
          reason: 'technical_error',
          message: 'Si è verificato un problema tecnico con il trasferimento. Offra di prendere un messaggio o pianificare una richiamata.'
        });
      }
    }
  });
};

/**
 * Export all tools as an array for easy registration
 * Note: transferCall is created dynamically with getCallSid function
 */
export const comtelTools = [
  getCompanyInfo,
  getBusinessHours,
  getLocation,
  scheduleCallback,
  takeMessage
];

/**
 * Create all tools including transfer functionality
 * Note: Financial tools are imported separately and merged in agent.ts
 * @param getCallState - Function to retrieve current call state from memory
 */
export const createComtelTools = (getCallState: () => CallState) => [
  ...comtelTools,
  createTransferCallTool(getCallState)
];
