import { z } from 'zod';
import { tool } from '@openai/agents/realtime';
import twilio from 'twilio';

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
    const timestamp = new Date().toISOString();
    const callbackId = `RIC-${Date.now()}`;

    // In production, this would save to a database or CRM system
    console.log('Richiesta di Richiamata Registrata:', {
      callbackId,
      timestamp,
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
});

/**
 * Tool: Take Message
 * Records a message for a specific employee or department at Comtel Italia
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
    const timestamp = new Date().toISOString();
    const messageId = `MSG-${Date.now()}`;

    // In production, this would be saved to a database or sent via email/SMS
    console.log('Messaggio Registrato:', {
      messageId,
      timestamp,
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
});

/**
 * Tool: Transfer Call
 * Transfers the active call to another phone number
 * Requires a function to get the current Call SID
 */
export const createTransferCallTool = (getCallSid: () => string | null) => {
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
      const callSid = getCallSid();

      if (!callSid) {
        return JSON.stringify({
          success: false,
          error: 'Call SID non disponibile. Impossibile trasferire la chiamata.'
        });
      }

      console.log('🔄 Tentativo di trasferimento chiamata:', {
        callSid,
        numeroDestinazione: targetNumber,
        motivo: reason || 'Non specificato',
        timestamp: new Date().toISOString()
      });

      try {
        // Initialize Twilio client with extended timeout
        // Extended timeout needed because updating a call in an active media stream
        // requires Twilio to tear down the WebSocket connection first
        const client = twilio(
          process.env.TWILIO_ACCOUNT_SID!,
          process.env.TWILIO_AUTH_TOKEN!,
          {
            // Increase timeout to 90 seconds to allow Twilio time to process
            // the update while the media stream is still connected
            timeout: 90000  // 90 seconds (default is 30 seconds)
          }
        );

        // STEP 1: Verify the call still exists and is active
        console.log('🔍 Verifica stato chiamata...');
        let callInstance;
        try {
          callInstance = await client.calls(callSid).fetch();
          console.log('📊 Stato chiamata:', {
            status: callInstance.status,
            direction: callInstance.direction,
            duration: callInstance.duration || 0
          });
        } catch (fetchError: any) {
          if (fetchError.status === 404 || fetchError.code === 20404) {
            console.error('❌ Chiamata non trovata - probabilmente già terminata');
            return JSON.stringify({
              success: false,
              error: 'La chiamata è già terminata. Non è possibile trasferire.',
              reason: 'call_already_ended',
              message: 'Dica alla persona che la chiamata si è disconnessa. Può offrire di prendere un messaggio o pianificare una richiamata.'
            });
          }
          throw fetchError; // Re-throw other errors
        }

        // Check if call is in a transferable state
        const validStatuses = ['in-progress', 'ringing'];
        if (!validStatuses.includes(callInstance.status)) {
          console.error(`❌ Stato chiamata non valido per trasferimento: ${callInstance.status}`);
          return JSON.stringify({
            success: false,
            error: `La chiamata non può essere trasferita. Stato attuale: ${callInstance.status}`,
            reason: 'invalid_call_state',
            message: 'La chiamata non è più attiva. Offra di prendere un messaggio o pianificare una richiamata.'
          });
        }

        // STEP 2: Create TwiML to dial the target number
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>${targetNumber}</Dial>
</Response>`;

        // STEP 3: Update the active call with new TwiML
        // This will cause Twilio to disconnect the media stream and transfer the call
        console.log('📞 Esecuzione trasferimento...');
        await client.calls(callSid).update({
          twiml: twiml
        });

        console.log('✅ Chiamata trasferita con successo:', {
          callSid,
          numeroDestinazione: targetNumber,
          motivo: reason || 'Non specificato',
          timestamp: new Date().toISOString()
        });

        return JSON.stringify({
          success: true,
          message: `Chiamata trasferita con successo a ${targetNumber}`,
          callSid,
          targetNumber,
          reason: reason || 'Non specificato'
        });
      } catch (error: any) {
        // Handle specific Twilio errors
        if (error.status === 404 || error.code === 20404) {
          console.error('❌ Chiamata non trovata durante trasferimento - chiamata terminata');
          return JSON.stringify({
            success: false,
            error: 'La chiamata si è disconnessa durante il trasferimento.',
            reason: 'call_ended_during_transfer',
            message: 'La chiamata si è disconnessa. Dica alla persona di richiamare se necessario.'
          });
        }

        // Handle other errors
        console.error('❌ Errore durante il trasferimento della chiamata:', {
          errorType: error.constructor.name,
          message: error.message,
          code: error.code,
          status: error.status
        });

        return JSON.stringify({
          success: false,
          error: 'Errore tecnico durante il trasferimento: ' + (error.message || 'Errore sconosciuto'),
          reason: 'technical_error',
          message: 'Si è verificato un problema tecnico. Offra di prendere un messaggio o pianificare una richiamata.'
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
 * Note: Financial department transfers are handled via handoffs to Elena agent
 */
export const createComtelTools = (getCallSid: () => string | null) => [
  ...comtelTools,
  createTransferCallTool(getCallSid)
];
