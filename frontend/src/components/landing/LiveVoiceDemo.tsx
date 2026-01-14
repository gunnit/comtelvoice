import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Phone, PhoneOff, Volume2 } from 'lucide-react'

type DemoScenario = 'appointment' | 'message' | 'transfer'

interface DemoMessage {
  speaker: 'user' | 'agent'
  text: string
  delay: number // ms before this message appears
}

// Pre-defined demo conversations for each scenario
const DEMO_SCRIPTS: Record<DemoScenario, DemoMessage[]> = {
  appointment: [
    { speaker: 'agent', text: "Buongiorno, grazie per aver chiamato Comtel Italia. Sono Arthur, come posso aiutarla?", delay: 500 },
    { speaker: 'user', text: "Buongiorno, vorrei fissare un appuntamento con il reparto vendite.", delay: 3500 },
    { speaker: 'agent', text: "Certamente! Per quale giorno preferisce l'appuntamento?", delay: 2500 },
    { speaker: 'user', text: "Giovedì pomeriggio, se possibile.", delay: 2000 },
    { speaker: 'agent', text: "Perfetto. Giovedì alle 15:00 va bene? Posso avere il suo nome e numero di telefono?", delay: 2500 },
    { speaker: 'user', text: "Sì, sono Marco Rossi, 335 1234567.", delay: 2500 },
    { speaker: 'agent', text: "Grazie Signor Rossi. L'appuntamento è confermato per giovedì alle 15:00. Riceverà una conferma via SMS. Posso aiutarla in altro?", delay: 3500 },
  ],
  message: [
    { speaker: 'agent', text: "Buongiorno, grazie per aver chiamato Comtel Italia. Sono Arthur, come posso aiutarla?", delay: 500 },
    { speaker: 'user', text: "Devo lasciare un messaggio per l'ingegner Bianchi.", delay: 3500 },
    { speaker: 'agent', text: "Certamente. Mi dica pure il messaggio, lo trascrivo immediatamente.", delay: 2500 },
    { speaker: 'user', text: "Può dirgli che la configurazione del centralino è completata e può chiamarmi per il collaudo?", delay: 3000 },
    { speaker: 'agent', text: "Perfetto. Posso avere il suo nome e recapito?", delay: 2000 },
    { speaker: 'user', text: "Luigi Verdi, 02 9876543.", delay: 2000 },
    { speaker: 'agent', text: "Messaggio registrato con riferimento MSG-24837. L'ingegner Bianchi verrà avvisato immediatamente. Buona giornata!", delay: 3500 },
  ],
  transfer: [
    { speaker: 'agent', text: "Buongiorno, grazie per aver chiamato Comtel Italia. Sono Arthur, come posso aiutarla?", delay: 500 },
    { speaker: 'user', text: "Hi, I need to speak with technical support about a VoIP issue.", delay: 3500 },
    { speaker: 'agent', text: "Of course! I'll transfer you to our technical support team right away. May I have your name?", delay: 2500 },
    { speaker: 'user', text: "Yes, I'm John Smith from Acme Corp.", delay: 2000 },
    { speaker: 'agent', text: "Thank you Mr. Smith. Please hold while I connect you to our support specialist.", delay: 2500 },
    { speaker: 'agent', text: "Transferring now... You'll be connected shortly.", delay: 2000 },
  ],
}

const SCENARIO_TITLES: Record<DemoScenario, { it: string; subtitle: string }> = {
  appointment: { it: 'Prenota Appuntamento', subtitle: 'Arthur schedules a sales meeting' },
  message: { it: 'Lascia Messaggio', subtitle: 'Arthur takes a detailed message' },
  transfer: { it: 'Trasferimento', subtitle: 'Arthur handles multilingual transfer' },
}

interface LiveVoiceDemoProps {
  className?: string
}

export function LiveVoiceDemo({ className = '' }: LiveVoiceDemoProps) {
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [messages, setMessages] = useState<DemoMessage[]>([])
  const [currentMessageIndex, setCurrentMessageIndex] = useState(-1)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([])

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout)
    }
  }, [])

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, displayedText])

  const clearTimeouts = useCallback(() => {
    timeoutRefs.current.forEach(clearTimeout)
    timeoutRefs.current = []
  }, [])

  const typeText = useCallback((text: string, onComplete: () => void) => {
    let index = 0
    setDisplayedText('')
    setIsTyping(true)

    const typeChar = () => {
      if (index <= text.length) {
        setDisplayedText(text.slice(0, index))
        index++
        const timeout = setTimeout(typeChar, 35 + Math.random() * 25)
        timeoutRefs.current.push(timeout)
      } else {
        setIsTyping(false)
        onComplete()
      }
    }

    typeChar()
  }, [])

  const playScenario = useCallback((scenario: DemoScenario) => {
    clearTimeouts()
    setSelectedScenario(scenario)
    setIsPlaying(true)
    setMessages([])
    setCurrentMessageIndex(-1)
    setDisplayedText('')

    const script = DEMO_SCRIPTS[scenario]
    let totalDelay = 0

    script.forEach((message, index) => {
      totalDelay += message.delay

      const timeout = setTimeout(() => {
        setCurrentMessageIndex(index)

        if (index > 0) {
          // Add previous message to the list
          setMessages(prev => [...prev, script[index - 1]])
        }

        // Type out the current message
        typeText(message.text, () => {
          // If this is the last message, add it to the list after typing
          if (index === script.length - 1) {
            setTimeout(() => {
              setMessages(prev => [...prev, message])
              setDisplayedText('')
              setIsPlaying(false)
            }, 500)
          }
        })
      }, totalDelay)

      timeoutRefs.current.push(timeout)
    })
  }, [clearTimeouts, typeText])

  const stopDemo = useCallback(() => {
    clearTimeouts()
    setIsPlaying(false)
    setSelectedScenario(null)
    setMessages([])
    setCurrentMessageIndex(-1)
    setDisplayedText('')
    setIsTyping(false)
  }, [clearTimeouts])

  const handleScenarioClick = useCallback((scenario: DemoScenario) => {
    if (isPlaying && selectedScenario === scenario) {
      stopDemo()
    } else {
      playScenario(scenario)
    }
  }, [isPlaying, selectedScenario, stopDemo, playScenario])

  return (
    <div className={`${className}`}>
      {/* Scenario Selection */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {(Object.keys(DEMO_SCRIPTS) as DemoScenario[]).map((scenario) => (
          <motion.button
            key={scenario}
            onClick={() => handleScenarioClick(scenario)}
            className={`relative px-6 py-4 rounded-xl border-2 transition-all duration-300 ${
              selectedScenario === scenario
                ? 'border-teatro-rosso bg-teatro-rosso/10 text-white'
                : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-center">
              <div className="text-lg font-semibold mb-1">
                {SCENARIO_TITLES[scenario].it}
              </div>
              <div className="text-xs text-white/50">
                {SCENARIO_TITLES[scenario].subtitle}
              </div>
            </div>

            {selectedScenario === scenario && isPlaying && (
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-teatro-rosso rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Demo Area */}
      <div className="relative bg-teatro-nero/50 rounded-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-teatro-rosso animate-pulse' : 'bg-white/30'}`} />
            <span className="text-sm text-white/70">
              {isPlaying ? 'Chiamata in corso...' : 'Seleziona uno scenario'}
            </span>
          </div>

          {isPlaying && (
            <motion.button
              onClick={stopDemo}
              className="flex items-center gap-2 px-4 py-2 bg-teatro-rosso/20 hover:bg-teatro-rosso/30 rounded-lg text-teatro-rosso transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <PhoneOff className="w-4 h-4" />
              <span className="text-sm">Termina</span>
            </motion.button>
          )}
        </div>

        {/* Chat Area */}
        <div className="h-80 overflow-y-auto p-6 space-y-4">
          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => (
              <motion.div
                key={`${selectedScenario}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    message.speaker === 'user'
                      ? 'bg-white/10 text-white'
                      : 'bg-teatro-rosso/20 text-white border border-teatro-rosso/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {message.speaker === 'agent' ? (
                      <Volume2 className="w-3 h-3 text-teatro-oro" />
                    ) : (
                      <Mic className="w-3 h-3 text-white/50" />
                    )}
                    <span className="text-xs uppercase tracking-wider text-white/50">
                      {message.speaker === 'user' ? 'Cliente' : 'Arthur'}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
              </motion.div>
            ))}

            {/* Currently typing message */}
            {isTyping && currentMessageIndex >= 0 && selectedScenario && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${
                  DEMO_SCRIPTS[selectedScenario][currentMessageIndex]?.speaker === 'user'
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    DEMO_SCRIPTS[selectedScenario][currentMessageIndex]?.speaker === 'user'
                      ? 'bg-white/10 text-white'
                      : 'bg-teatro-rosso/20 text-white border border-teatro-rosso/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {DEMO_SCRIPTS[selectedScenario][currentMessageIndex]?.speaker === 'agent' ? (
                      <Volume2 className="w-3 h-3 text-teatro-oro animate-pulse" />
                    ) : (
                      <Mic className="w-3 h-3 text-white/50" />
                    )}
                    <span className="text-xs uppercase tracking-wider text-white/50">
                      {DEMO_SCRIPTS[selectedScenario][currentMessageIndex]?.speaker === 'user'
                        ? 'Cliente'
                        : 'Arthur'}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">
                    {displayedText}
                    <span className="animate-pulse text-teatro-oro">|</span>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {!isPlaying && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Phone className="w-12 h-12 text-white/20 mb-4" />
              <p className="text-white/40 text-sm">
                Clicca su uno scenario per vedere Arthur in azione
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Audio Visualizer (shown when playing) */}
        <AnimatePresence>
          {isPlaying && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-teatro-rosso rounded-full"
                      animate={{
                        height: isTyping && currentMessageIndex >= 0 && selectedScenario &&
                          DEMO_SCRIPTS[selectedScenario][currentMessageIndex]?.speaker === 'agent'
                          ? [8, 24, 8]
                          : 8
                      }}
                      transition={{
                        duration: 0.3,
                        repeat: Infinity,
                        delay: i * 0.05,
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs text-white/50">
                  {isTyping && currentMessageIndex >= 0 && selectedScenario &&
                    DEMO_SCRIPTS[selectedScenario][currentMessageIndex]?.speaker === 'agent'
                    ? 'Arthur sta parlando...'
                    : 'In ascolto...'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Live Demo Notice */}
      <motion.p
        className="text-center text-sm text-white/40 mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Demo simulata • La versione completa supporta conversazioni vocali in tempo reale
      </motion.p>
    </div>
  )
}
