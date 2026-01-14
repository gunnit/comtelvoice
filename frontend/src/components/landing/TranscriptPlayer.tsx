import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TranscriptMessage {
  speaker: 'user' | 'agent'
  text: string
  delay?: number
}

interface TranscriptPlayerProps {
  messages: TranscriptMessage[]
  isPlaying: boolean
  onComplete?: () => void
  typingSpeed?: number
  className?: string
}

export function TranscriptPlayer({
  messages,
  isPlaying,
  onComplete,
  typingSpeed = 40,
  className = ''
}: TranscriptPlayerProps) {
  const [visibleMessages, setVisibleMessages] = useState<TranscriptMessage[]>([])
  const [currentText, setCurrentText] = useState('')
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)

  const typeMessage = useCallback(async (message: TranscriptMessage) => {
    setIsTyping(true)
    setCurrentText('')

    // Wait for delay if specified
    if (message.delay) {
      await new Promise(resolve => setTimeout(resolve, message.delay))
    }

    // Type out the message character by character
    for (let i = 0; i <= message.text.length; i++) {
      if (!isPlaying) break
      setCurrentText(message.text.slice(0, i))
      await new Promise(resolve => setTimeout(resolve, typingSpeed))
    }

    setIsTyping(false)
    setVisibleMessages(prev => [...prev, message])
    setCurrentText('')
  }, [isPlaying, typingSpeed])

  useEffect(() => {
    if (!isPlaying) {
      setVisibleMessages([])
      setCurrentText('')
      setCurrentMessageIndex(0)
      setIsTyping(false)
      return
    }

    const playMessages = async () => {
      for (let i = 0; i < messages.length; i++) {
        if (!isPlaying) break
        setCurrentMessageIndex(i)
        await typeMessage(messages[i])
        // Small pause between messages
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      onComplete?.()
    }

    playMessages()
  }, [isPlaying, messages, typeMessage, onComplete])

  return (
    <div className={`space-y-4 ${className}`}>
      <AnimatePresence>
        {visibleMessages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={message.speaker === 'user' ? 'transcript-user' : 'transcript-agent'}
          >
            <div className={`inline-block max-w-[80%] px-4 py-2 rounded-2xl ${
              message.speaker === 'user'
                ? 'bg-white/10 ml-auto'
                : 'bg-teatro-rosso/20 mr-auto'
            }`}>
              <span className="text-xs uppercase tracking-wider opacity-60 block mb-1">
                {message.speaker === 'user' ? 'Cliente' : 'Arthur'}
              </span>
              <p className="text-sm">{message.text}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Currently typing message */}
      {isTyping && currentMessageIndex < messages.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={messages[currentMessageIndex].speaker === 'user' ? 'transcript-user' : 'transcript-agent'}
        >
          <div className={`inline-block max-w-[80%] px-4 py-2 rounded-2xl ${
            messages[currentMessageIndex].speaker === 'user'
              ? 'bg-white/10 ml-auto'
              : 'bg-teatro-rosso/20 mr-auto'
          }`}>
            <span className="text-xs uppercase tracking-wider opacity-60 block mb-1">
              {messages[currentMessageIndex].speaker === 'user' ? 'Cliente' : 'Arthur'}
            </span>
            <p className="text-sm">
              {currentText}
              <span className="animate-pulse text-teatro-oro">|</span>
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Simplified single-line typewriter
interface TypewriterTextProps {
  text: string
  isPlaying: boolean
  speed?: number
  className?: string
  onComplete?: () => void
}

export function TypewriterText({
  text,
  isPlaying,
  speed = 50,
  className = '',
  onComplete
}: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!isPlaying) {
      setDisplayText('')
      setIsComplete(false)
      return
    }

    let index = 0
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index))
        index++
      } else {
        clearInterval(interval)
        setIsComplete(true)
        onComplete?.()
      }
    }, speed)

    return () => clearInterval(interval)
  }, [isPlaying, text, speed, onComplete])

  return (
    <span className={className}>
      {displayText}
      {isPlaying && !isComplete && (
        <span className="animate-pulse text-teatro-oro">|</span>
      )}
    </span>
  )
}
