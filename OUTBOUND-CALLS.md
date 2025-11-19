# Guida Outbound Calls - Twilio

Questa guida spiega come funzionano le chiamate in uscita (outbound calls) con Twilio e come testarle.

## 📋 Prerequisiti

1. **Server in esecuzione**: Il server deve essere attivo e raggiungibile pubblicamente
   ```bash
   npm run dev
   ```

2. **Ngrok/Tunnel pubblico**: Se testi in locale, assicurati che `SERVER_URL` nel `.env` punti al tunnel
   ```
   SERVER_URL=db1589ad3515.ngrok-free.app
   ```

3. **Credenziali Twilio**: Verifica che nel `.env` siano presenti:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TRANSFER_NUMBER_MAIN` (il numero Twilio che effettuerà la chiamata)

## 🚀 Come Testare

### Test Base (messaggio vocale semplice)

```bash
npx tsx test-outbound.ts +393331234567
```

Questo effettuerà una chiamata al numero specificato e riprodurrà un messaggio di test in italiano.

### Test con Agent Arthur

Per connettere la chiamata in uscita all'agent Arthur:

```typescript
// Modifica test-outbound.ts, riga ~45:
const call = await client.calls.create({
  from: FROM_NUMBER,
  to: TO_NUMBER,
  url: `https://${SERVER_URL}/outbound-call?mode=agent`,  // Aggiungi ?mode=agent
  statusCallback: `https://${SERVER_URL}/call-status`,
  statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
});
```

## 📊 Modalità Disponibili

### Mode: `simple` (default)
- Riproduce un messaggio pre-registrato in italiano
- Ideale per verificare che Twilio possa effettuare chiamate
- Non usa OpenAI Realtime API (nessun costo)

**TwiML generato:**
```xml
<Response>
  <Say language="it-IT" voice="alice">
    Ciao! Questo è un messaggio di test da Comtel Italia.
    Il sistema di chiamate in uscita funziona correttamente.
    Grazie e arrivederci!
  </Say>
  <Pause length="1"/>
  <Hangup/>
</Response>
```

### Mode: `agent`
- Connette la chiamata all'agent Arthur via WebSocket
- L'agent parlerà per primo (comportamento outbound)
- Usa OpenAI Realtime API (costa crediti)

**TwiML generato:**
```xml
<Response>
  <Say language="it-IT">Un momento prego.</Say>
  <Connect>
    <Stream url="wss://your-server.com/media-stream">
      <Parameter name="from" value="+390220527877" />
      <Parameter name="to" value="+393331234567" />
      <Parameter name="outbound" value="true" />
    </Stream>
  </Connect>
</Response>
```

## 🔍 Monitoraggio

### Logs del Server
Il server stamperà informazioni dettagliate:

```
📞 Outbound call webhook triggered
📞 Outbound call details: { callSid: 'CA...', from: '+39...', to: '+39...', mode: 'simple' }
💬 Playing simple test message
📄 TwiML response: ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Call Status Update
⏰ Time: 2025-01-19T...
📞 Call SID: CA...
📈 Status: initiated
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 Status: ringing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 Status: answered
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 Status: completed
⏱️  Duration: 15 seconds
✅ Call status updated in database
```

### Twilio Console
Puoi monitorare la chiamata anche dalla console Twilio:
```
https://console.twilio.com/us1/monitor/logs/calls/[CALL_SID]
```

Lo script `test-outbound.ts` stampa automaticamente questo link.

## 🏗️ Architettura

### Flow Chiamata Outbound

```
1. test-outbound.ts
   ↓ (REST API: client.calls.create)
2. Twilio
   ↓ (POST webhook)
3. /outbound-call endpoint
   ↓ (returns TwiML)
4. Twilio esegue TwiML
   ↓ (mode=simple: riproduce audio)
   ↓ (mode=agent: connette WebSocket)
5. /media-stream (se mode=agent)
   ↓ (OpenAI Realtime API)
6. Agent Arthur risponde
```

### Endpoints Aggiunti

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/outbound-call` | POST | Webhook TwiML per chiamate in uscita |
| `/call-status` | POST | Riceve aggiornamenti di status dalla chiamata |

## 💡 Use Cases

### 1. Callback Automatici
Richiamare clienti che hanno richiesto un callback:

```typescript
const callbacks = await db.callbacks.findMany({
  where: { status: 'pending' }
});

for (const callback of callbacks) {
  await client.calls.create({
    from: process.env.TRANSFER_NUMBER_MAIN,
    to: callback.phoneNumber,
    url: `https://${SERVER_URL}/outbound-call?mode=agent`
  });
}
```

### 2. Notifiche Proattive
Avvisare clienti di eventi importanti:

```typescript
await client.calls.create({
  from: process.env.TRANSFER_NUMBER_MAIN,
  to: '+393331234567',
  url: `https://${SERVER_URL}/outbound-call?mode=agent`
});
```

### 3. Survey/Feedback
Chiamare clienti per raccogliere feedback dopo un servizio.

## ⚙️ Configurazione Avanzata

### Personalizzare il Messaggio (mode=simple)

Modifica il TwiML in `src/index.ts`, endpoint `/outbound-call`:

```typescript
twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="it-IT" voice="alice">
    Il tuo messaggio personalizzato qui.
  </Say>
  <Hangup/>
</Response>`;
```

### Agent che Parla per Primo (mode=agent)

L'agent può essere configurato per iniziare la conversazione. Modifica `src/agent.ts`:

```typescript
// Nelle istruzioni di Arthur, aggiungi:
"Quando ricevi una chiamata in uscita (parametro outbound=true),
saluta il cliente per primo e spiega il motivo della chiamata."
```

## 🐛 Troubleshooting

### Errore: "The number you are trying to reach is not available"
- Verifica che `TRANSFER_NUMBER_MAIN` sia un numero Twilio attivo
- Controlla che il numero destinatario sia valido e raggiungibile

### Errore: "Unable to fetch content from https://..."
- Verifica che il server sia raggiungibile pubblicamente
- Controlla che `SERVER_URL` nel `.env` sia corretto
- Testa l'endpoint: `curl https://${SERVER_URL}/`

### La chiamata non si connette all'agent (mode=agent)
- Verifica che OpenAI API key sia valida
- Controlla i log del server per errori WebSocket
- Assicurati che `/media-stream` funzioni correttamente

### Database error durante call-status
- È normale se il database non è configurato
- L'app continua a funzionare e registra solo nei log

## 📚 Risorse

- [Twilio Voice API](https://www.twilio.com/docs/voice/api)
- [TwiML Reference](https://www.twilio.com/docs/voice/twiml)
- [Making Outbound Calls](https://www.twilio.com/docs/voice/make-calls)
- [Media Streams](https://www.twilio.com/docs/voice/media-streams)
