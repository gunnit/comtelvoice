import 'dotenv/config';
import twilio from 'twilio';

/**
 * Script di test per outbound calls Twilio
 *
 * Uso:
 * 1. Assicurati che il server sia in esecuzione: npm run dev
 * 2. Esegui questo script: npx tsx test-outbound.ts +393331234567
 */

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const SERVER_URL = process.env.SERVER_URL!;
const FROM_NUMBER = process.env.TRANSFER_NUMBER_MAIN!;

// Numero da chiamare (preso da argomento command line)
const TO_NUMBER = process.argv[2];

if (!TO_NUMBER) {
  console.error('❌ Errore: Devi specificare un numero di telefono!');
  console.error('Uso: npx tsx test-outbound.ts +393331234567');
  process.exit(1);
}

// Verifica che le credenziali siano configurate
if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !SERVER_URL || !FROM_NUMBER) {
  console.error('❌ Errore: Variabili d\'ambiente mancanti!');
  console.error('Assicurati che .env contenga:');
  console.error('- TWILIO_ACCOUNT_SID');
  console.error('- TWILIO_AUTH_TOKEN');
  console.error('- SERVER_URL');
  console.error('- TRANSFER_NUMBER_MAIN');
  process.exit(1);
}

async function testOutboundCall() {
  console.log('📞 Test Outbound Call su Twilio\n');
  console.log(`Da: ${FROM_NUMBER}`);
  console.log(`A: ${TO_NUMBER}`);
  console.log(`Server: https://${SERVER_URL}\n`);

  try {
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    console.log('🚀 Avvio chiamata in uscita...');

    const call = await client.calls.create({
      from: FROM_NUMBER,
      to: TO_NUMBER,
      url: `https://${SERVER_URL}/outbound-call`,
      statusCallback: `https://${SERVER_URL}/call-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST'
    });

    console.log('✅ Chiamata creata con successo!\n');
    console.log('Dettagli:');
    console.log(`  - Call SID: ${call.sid}`);
    console.log(`  - Status: ${call.status}`);
    console.log(`  - Direction: ${call.direction}`);
    console.log(`  - From: ${call.from}`);
    console.log(`  - To: ${call.to}`);
    console.log(`\n📱 Controlla il telefono ${TO_NUMBER} per ricevere la chiamata!`);
    console.log(`\n🔗 Monitora lo status su: https://console.twilio.com/us1/monitor/logs/calls/${call.sid}`);

    // Opzionale: Monitora lo status della chiamata
    console.log('\n⏳ Monitoraggio status della chiamata (15 secondi)...\n');

    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const updatedCall = await client.calls(call.sid).fetch();
      console.log(`  [${new Date().toLocaleTimeString('it-IT')}] Status: ${updatedCall.status}`);

      if (updatedCall.status === 'completed' || updatedCall.status === 'failed') {
        console.log('\n✅ Chiamata terminata!');
        if (updatedCall.status === 'completed') {
          console.log(`  - Durata: ${updatedCall.duration} secondi`);
        }
        break;
      }
    }

  } catch (error: any) {
    console.error('\n❌ Errore durante la chiamata:');
    console.error(`  - Messaggio: ${error.message}`);
    if (error.code) {
      console.error(`  - Codice: ${error.code}`);
    }
    if (error.moreInfo) {
      console.error(`  - Info: ${error.moreInfo}`);
    }
    process.exit(1);
  }
}

// Esegui il test
testOutboundCall()
  .then(() => {
    console.log('\n✅ Test completato!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test fallito:', error);
    process.exit(1);
  });
