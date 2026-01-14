import { motion } from 'framer-motion'
import { Volume2, VolumeX, Volume1 } from 'lucide-react'

export type SoundLevel = 'muted' | 'ambient' | 'full'

interface SoundToggleProps {
  level: SoundLevel
  onToggle: () => void
  className?: string
}

export function SoundToggle({ level, onToggle, className = '' }: SoundToggleProps) {
  const getIcon = () => {
    switch (level) {
      case 'muted':
        return <VolumeX className="w-5 h-5" />
      case 'ambient':
        return <Volume1 className="w-5 h-5" />
      case 'full':
        return <Volume2 className="w-5 h-5" />
    }
  }

  const getLabel = () => {
    switch (level) {
      case 'muted':
        return 'Audio disattivato'
      case 'ambient':
        return 'Audio ambientale'
      case 'full':
        return 'Audio completo'
    }
  }

  return (
    <motion.button
      onClick={onToggle}
      className={`sound-toggle flex items-center justify-center cursor-pointer ${
        level !== 'muted' ? 'active' : ''
      } ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
      title={getLabel()}
      aria-label={getLabel()}
    >
      <motion.div
        key={level}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className={level === 'muted' ? 'text-gray-400' : 'text-white'}
      >
        {getIcon()}
      </motion.div>

      {/* Sound wave indicators */}
      {level !== 'muted' && (
        <div className="absolute -right-1 -top-1">
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teatro-rosso opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-teatro-rosso" />
          </span>
        </div>
      )}
    </motion.button>
  )
}

// Floating sound toggle for fixed positioning
interface FloatingSoundToggleProps extends SoundToggleProps {
  showLabel?: boolean
}

export function FloatingSoundToggle({ level, onToggle, showLabel = true }: FloatingSoundToggleProps) {
  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.5, duration: 0.4 }}
    >
      {showLabel && level === 'muted' && (
        <motion.span
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-sm text-teatro-crema/60 hidden sm:block"
        >
          Clicca per attivare l'audio
        </motion.span>
      )}
      <SoundToggle level={level} onToggle={onToggle} />
    </motion.div>
  )
}
