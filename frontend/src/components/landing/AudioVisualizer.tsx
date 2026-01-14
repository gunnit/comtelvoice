import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

interface AudioVisualizerProps {
  size?: number
  isPlaying?: boolean
  audioElement?: HTMLAudioElement | null
  className?: string
}

export function AudioVisualizer({
  size = 280,
  isPlaying = false,
  audioElement,
  className = ''
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize audio context and analyser when audio element is provided
  useEffect(() => {
    if (audioElement && !isInitialized) {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const audioContext = new AudioContextClass()
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.8

        const source = audioContext.createMediaElementSource(audioElement)
        source.connect(analyser)
        analyser.connect(audioContext.destination)

        audioContextRef.current = audioContext
        analyserRef.current = analyser
        setIsInitialized(true)
      } catch (e) {
        console.warn('Audio visualization not supported:', e)
      }
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [audioElement, isInitialized])

  // Draw visualization
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 20

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Get audio data or generate idle animation
    let dataArray: Uint8Array
    const bufferLength = analyserRef.current?.frequencyBinCount || 64

    if (analyserRef.current && isPlaying) {
      dataArray = new Uint8Array(bufferLength)
      analyserRef.current.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>)
    } else {
      // Idle animation - gentle wave
      dataArray = new Uint8Array(bufferLength)
      const time = Date.now() / 1000
      for (let i = 0; i < bufferLength; i++) {
        const wave = Math.sin(time * 2 + i * 0.2) * 0.3 + 0.5
        const noise = Math.sin(time * 5 + i * 0.5) * 0.1
        dataArray[i] = Math.floor((wave + noise) * (isPlaying ? 180 : 80))
      }
    }

    // Draw outer glow circle
    const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.5, centerX, centerY, radius * 1.2)
    gradient.addColorStop(0, 'rgba(196, 30, 58, 0.1)')
    gradient.addColorStop(0.5, 'rgba(196, 30, 58, 0.05)')
    gradient.addColorStop(1, 'transparent')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 1.2, 0, Math.PI * 2)
    ctx.fill()

    // Draw frequency bars in a circle
    const barCount = 48
    const barWidth = 3
    const maxBarHeight = radius * 0.4

    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2
      const dataIndex = Math.floor((i / barCount) * bufferLength)
      const value = dataArray[dataIndex] / 255
      const barHeight = maxBarHeight * value + 5

      const x1 = centerX + Math.cos(angle) * (radius - 15)
      const y1 = centerY + Math.sin(angle) * (radius - 15)
      const x2 = centerX + Math.cos(angle) * (radius - 15 - barHeight)
      const y2 = centerY + Math.sin(angle) * (radius - 15 - barHeight)

      // Create gradient for each bar
      const barGradient = ctx.createLinearGradient(x1, y1, x2, y2)
      barGradient.addColorStop(0, '#C41E3A')
      barGradient.addColorStop(1, '#D4AF37')

      ctx.strokeStyle = barGradient
      ctx.lineWidth = barWidth
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }

    // Draw inner pulsing circle
    const pulseScale = isPlaying
      ? 1 + (dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255) * 0.1
      : 1 + Math.sin(Date.now() / 500) * 0.02

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 0.6 * pulseScale, 0, Math.PI * 2)
    ctx.stroke()

    // Draw innermost circle
    ctx.strokeStyle = 'rgba(196, 30, 58, 0.3)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 0.4 * pulseScale, 0, Math.PI * 2)
    ctx.stroke()

    // Draw center microphone icon
    const iconSize = 24
    ctx.fillStyle = isPlaying ? '#C41E3A' : 'rgba(255, 253, 208, 0.8)'
    ctx.beginPath()
    // Mic body
    ctx.roundRect(centerX - iconSize/4, centerY - iconSize/2, iconSize/2, iconSize * 0.7, 6)
    ctx.fill()
    // Mic base
    ctx.strokeStyle = ctx.fillStyle
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(centerX, centerY + iconSize * 0.1, iconSize/3, 0, Math.PI)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(centerX, centerY + iconSize * 0.1 + iconSize/3)
    ctx.lineTo(centerX, centerY + iconSize * 0.6)
    ctx.stroke()

    animationRef.current = requestAnimationFrame(draw)
  }, [isPlaying])

  // Start/stop animation
  useEffect(() => {
    draw()
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [draw])

  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-full"
        style={{ width: size, height: size }}
      />

      {/* Outer glow ring */}
      <div
        className="absolute inset-0 rounded-full animate-breathe pointer-events-none"
        style={{
          background: 'radial-gradient(circle, transparent 60%, rgba(196, 30, 58, 0.1) 100%)',
          boxShadow: isPlaying
            ? '0 0 60px rgba(196, 30, 58, 0.4), 0 0 120px rgba(196, 30, 58, 0.2)'
            : '0 0 40px rgba(196, 30, 58, 0.2), 0 0 80px rgba(196, 30, 58, 0.1)'
        }}
      />
    </motion.div>
  )
}
