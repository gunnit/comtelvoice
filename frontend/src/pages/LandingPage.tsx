import { useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import {
  Phone, PhoneCall, PhoneOff, PhoneMissed, PhoneForwarded,
  Calendar, MessageSquare, Shield, Zap,
  CheckCircle2, ChevronDown, Play,
  X, Menu, ArrowRight, Sparkles, Star
} from 'lucide-react'
import { AudioVisualizer } from '../components/landing/AudioVisualizer'
import { FloatingSoundToggle } from '../components/landing/SoundToggle'
import type { SoundLevel } from '../components/landing/SoundToggle'
import { LiveVoiceDemo } from '../components/landing/LiveVoiceDemo'

// ============================================
// FLOATING ORBS - Atmospheric Background
// ============================================

function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large gold orb - top right */}
      <motion.div
        className="orb orb-gold w-[600px] h-[600px] -top-48 -right-48"
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Rose orb - left side */}
      <motion.div
        className="orb orb-rose w-[500px] h-[500px] top-1/3 -left-64"
        animate={{
          x: [0, 20, 0],
          y: [0, 30, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      {/* Cream orb - bottom center */}
      <motion.div
        className="orb orb-cream w-[400px] h-[400px] bottom-0 left-1/2 -translate-x-1/2"
        animate={{
          y: [0, -40, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />

      {/* Small gold accent - mid right */}
      <motion.div
        className="orb orb-gold w-[200px] h-[200px] top-2/3 right-20 opacity-30"
        animate={{
          x: [0, -20, 0],
          y: [0, 20, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
    </div>
  )
}

// ============================================
// NAVIGATION
// ============================================

function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useState(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  })

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? 'bg-teatro-nero/80 backdrop-blur-2xl border-b border-white/5' : ''
      }`}
    >
      <div className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teatro-rosso to-teatro-bordeaux flex items-center justify-center shadow-lg shadow-teatro-rosso/20 group-hover:shadow-teatro-rosso/40 transition-shadow">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-display font-semibold text-white tracking-tight">Vocalis</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10">
            <a href="#come-funziona" className="text-sm text-white/60 hover:text-white transition-colors duration-300">
              Come Funziona
            </a>
            <a href="#demo" className="text-sm text-white/60 hover:text-white transition-colors duration-300">
              Demo
            </a>
            <a href="#prezzi" className="text-sm text-white/60 hover:text-white transition-colors duration-300">
              Prezzi
            </a>
            <a href="#faq" className="text-sm text-white/60 hover:text-white transition-colors duration-300">
              FAQ
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-5">
            <Link
              to="/login"
              className="text-sm text-white/60 hover:text-white transition-colors duration-300"
            >
              Accedi
            </Link>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2.5 btn-teatro-primary text-white text-sm font-medium rounded-full"
            >
              Prova Gratis
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white p-2 hover:bg-white/5 rounded-xl transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 pb-4 border-t border-white/10"
            >
              <div className="flex flex-col gap-4 pt-6">
                <a href="#come-funziona" className="text-white/70 hover:text-white py-2">Come Funziona</a>
                <a href="#demo" className="text-white/70 hover:text-white py-2">Demo</a>
                <a href="#prezzi" className="text-white/70 hover:text-white py-2">Prezzi</a>
                <a href="#faq" className="text-white/70 hover:text-white py-2">FAQ</a>
                <div className="gold-line my-2" />
                <Link to="/login" className="text-white/70 hover:text-white py-2">Accedi</Link>
                <button className="px-6 py-3 btn-teatro-primary text-white text-sm font-medium rounded-full mt-2">
                  Prova Gratis
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}

// ============================================
// HERO SECTION - "La Prima Serata"
// ============================================

function HeroSection({ onPlayDemo }: { onPlayDemo: () => void }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start']
  })

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 100])

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden teatro-bg spotlight-hero">
      {/* Floating orbs for atmosphere */}
      <FloatingOrbs />

      {/* Hero gradient mesh */}
      <div className="absolute inset-0 hero-gradient-mesh" />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '80px 80px'
      }} />

      <motion.div style={{ opacity, y }} className="container mx-auto px-6 pt-32 pb-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left: Typography */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass-teatro mb-10"
            >
              <span className="w-2 h-2 rounded-full bg-teatro-rosso shadow-lg shadow-teatro-rosso/50 animate-pulse" />
              <span className="text-sm text-white/80 font-medium tracking-wide">Intelligenza Artificiale Vocale</span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mb-8"
            >
              <span className="block teatro-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-white/80 mb-2">
                La voce
              </span>
              <span className="block teatro-display-bold text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-teatro-gold text-glow-gold">
                della tua azienda
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.7 }}
              className="text-lg sm:text-xl text-white/50 max-w-xl mx-auto lg:mx-0 mb-12 leading-relaxed"
            >
              Arthur risponde alle tue chiamate{' '}
              <span className="text-teatro-oro font-medium">24 ore su 24</span>,
              prende messaggi, programma appuntamenti e trasferisce le chiamate importanti.
              <span className="text-teatro-rosso font-medium"> In italiano perfetto.</span>
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start"
            >
              <motion.button
                onClick={onPlayDemo}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 btn-teatro-primary text-white font-semibold rounded-full flex items-center justify-center gap-3"
              >
                <Play className="w-5 h-5" />
                Ascolta Arthur
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 btn-teatro-secondary text-white font-medium rounded-full flex items-center justify-center gap-3"
              >
                <Calendar className="w-5 h-5" />
                Prenota Demo
              </motion.button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="flex flex-wrap items-center gap-8 mt-12 justify-center lg:justify-start"
            >
              {[
                { icon: Shield, text: 'GDPR Compliant' },
                { icon: Zap, text: 'Setup in 5 minuti' },
                { icon: CheckCircle2, text: 'Prova gratuita' },
              ].map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 + i * 0.1 }}
                  className="flex items-center gap-2.5 text-white/40"
                >
                  <item.icon className="w-4 h-4 text-teatro-oro" />
                  <span className="text-sm">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right: Audio Visualizer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center relative"
          >
            <AudioVisualizer size={350} isPlaying={false} />

            {/* Floating elements around visualizer */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-2 -right-2 px-5 py-2.5 glass-teatro rounded-2xl"
            >
              <span className="text-sm text-white/80 font-medium">24/7 Attivo</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -bottom-2 -left-2 px-5 py-2.5 rounded-2xl border border-teatro-rosso/30 bg-teatro-rosso/10 backdrop-blur-sm"
            >
              <span className="text-sm text-teatro-crema font-medium">Italiano Nativo</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, -8, 0], x: [0, 5, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
              className="absolute top-1/3 -right-16 hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-teatro-oro/10 border border-teatro-oro/20"
            >
              <Star className="w-4 h-4 text-teatro-oro fill-teatro-oro" />
              <span className="text-xs text-teatro-oro font-medium">4.9/5</span>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-3 text-white/30"
        >
          <span className="text-xs uppercase tracking-[0.2em] font-medium">Scorri</span>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </section>
  )
}

// ============================================
// IL DIALOGO SECTION - Problem/Solution Split
// ============================================

function IlDialogoSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const problems = [
    { icon: PhoneMissed, text: 'Chiamate perse fuori orario', time: '22:47' },
    { icon: PhoneOff, text: 'Clienti in attesa troppo a lungo', time: '14:23' },
    { icon: MessageSquare, text: 'Messaggi non registrati', time: '09:15' },
  ]

  const solutions = [
    { icon: PhoneCall, text: 'Risposta immediata 24/7', detail: 'Arthur risponde al primo squillo' },
    { icon: Calendar, text: 'Appuntamenti programmati', detail: 'Sincronizzazione automatica' },
    { icon: PhoneForwarded, text: 'Trasferimenti intelligenti', detail: 'Chiamate VIP riconosciute' },
  ]

  return (
    <section ref={ref} className="py-32 teatro-bg relative overflow-hidden">
      {/* Background orb */}
      <div className="orb orb-gold w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 badge-teatro rounded-full mb-6">Atto I</span>
          <h2 className="teatro-display-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-4">
            Il Dialogo
          </h2>
          <div className="gold-line w-32 mx-auto mt-6" />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-6">
          {/* SENZA - Problems */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 via-transparent to-transparent rounded-3xl" />
            <div className="relative p-8 lg:p-10 rounded-3xl border border-red-500/20 bg-red-500/[0.02]">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50 animate-pulse" />
                <span className="text-xl font-display font-semibold text-red-400">Senza Vocalis</span>
              </div>

              <div className="space-y-5">
                {problems.map((problem, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                    className="flex items-center gap-5 p-5 bg-red-500/5 rounded-2xl border border-red-500/10 hover:border-red-500/20 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center">
                      <problem.icon className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white/80 font-medium">{problem.text}</p>
                    </div>
                    <span className="text-xs text-red-400/50 font-mono">{problem.time}</span>
                  </motion.div>
                ))}
              </div>

              {/* Frustrated quote */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.7 }}
                className="mt-8 p-5 bg-red-500/5 rounded-2xl border-l-2 border-red-500/30"
              >
                <p className="text-white/40 italic">
                  "Ho provato a chiamare 3 volte ma nessuno risponde mai..."
                </p>
                <span className="text-xs text-red-400/40 mt-3 block font-medium">— Cliente perso</span>
              </motion.div>
            </div>
          </motion.div>

          {/* CON - Solutions */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teatro-oro/10 via-transparent to-transparent rounded-3xl" />
            <div className="relative p-8 lg:p-10 rounded-3xl border border-teatro-oro/30 spotlight-gold">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-3 h-3 rounded-full bg-teatro-oro shadow-lg shadow-teatro-oro/50 animate-pulse" />
                <span className="text-xl font-display font-semibold text-teatro-oro">Con Vocalis</span>
              </div>

              <div className="space-y-5">
                {solutions.map((solution, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                    className="flex items-center gap-5 p-5 bg-teatro-oro/5 rounded-2xl border border-teatro-oro/15 hover:border-teatro-oro/30 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-teatro-oro/15 flex items-center justify-center">
                      <solution.icon className="w-5 h-5 text-teatro-oro" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{solution.text}</p>
                      <p className="text-sm text-white/40 mt-0.5">{solution.detail}</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-teatro-oro/50" />
                  </motion.div>
                ))}
              </div>

              {/* Happy quote */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.8 }}
                className="mt-8 p-5 bg-teatro-oro/5 rounded-2xl border-l-2 border-teatro-oro/50"
              >
                <p className="text-white/60 italic">
                  "Arthur mi ha risposto subito e ha programmato l'appuntamento. Perfetto!"
                </p>
                <span className="text-xs text-teatro-oro/60 mt-3 block font-medium">— Cliente soddisfatto</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// DEMO SECTION - "Come Parla Arthur"
// ============================================

function DemoSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="demo" ref={ref} className="py-32 teatro-bg relative">
      {/* Background orbs */}
      <div className="orb orb-rose w-[300px] h-[300px] top-20 right-20 opacity-20" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 badge-teatro rounded-full mb-6">Atto II</span>
          <h2 className="teatro-display-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-4">
            La Dimostrazione
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-lg mt-6">
            Parla con Arthur dal vivo e scopri come gestisce le conversazioni in tempo reale.
          </p>
          <div className="gold-line w-32 mx-auto mt-8" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <LiveVoiceDemo />
        </motion.div>
      </div>
    </section>
  )
}

// ============================================
// FEATURES SECTION - "Le Capacità" (Script Format)
// ============================================

interface FeatureAct {
  number: string
  title: string
  direction: string
  dialogue: string
  features: string[]
}

const featureActs: FeatureAct[] = [
  {
    number: 'I',
    title: 'La Risposta',
    direction: 'ARTHUR entra in scena. Il telefono squilla.',
    dialogue: '"Buongiorno, [Nome Azienda]. Sono Arthur, come posso aiutarla?"',
    features: ['Risposta in 3 secondi', 'Disponibile 24/7', 'Voce naturale italiana']
  },
  {
    number: 'II',
    title: 'La Comprensione',
    direction: 'ARTHUR ascolta attentamente, annuendo.',
    dialogue: '"Capisco perfettamente. Mi permetta di verificare..."',
    features: ['Riconoscimento vocale avanzato', 'Comprensione del contesto', 'Gestione dialetti regionali']
  },
  {
    number: 'III',
    title: 'L\'Azione',
    direction: 'ARTHUR prende nota, efficiente e preciso.',
    dialogue: '"Ho prenotato l\'appuntamento per giovedì alle 15:00."',
    features: ['Prenotazione appuntamenti', 'Gestione messaggi', 'Integrazione calendario']
  },
  {
    number: 'IV',
    title: 'Il Trasferimento',
    direction: 'ARTHUR compone il numero interno con grazia.',
    dialogue: '"La trasferisco immediatamente al reparto competente."',
    features: ['Trasferimento intelligente', 'Riconoscimento VIP', 'Escalation automatica']
  },
]

function FeaturesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="come-funziona" ref={ref} className="py-32 teatro-bg relative">
      {/* Background elements */}
      <div className="orb orb-cream w-[500px] h-[500px] -bottom-64 left-1/2 -translate-x-1/2 opacity-15" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 badge-teatro rounded-full mb-6">Atto III</span>
          <h2 className="teatro-display-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-4">
            Le Capacità
          </h2>
          <p className="text-white/50 max-w-xl mx-auto text-lg mt-6">
            Il copione di Arthur, scena per scena
          </p>
          <div className="gold-line w-32 mx-auto mt-8" />
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-8">
          {featureActs.map((act, i) => (
            <motion.div
              key={act.number}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.6 }}
              className="teatro-card-glow p-8 lg:p-10"
            >
              {/* Act header */}
              <div className="flex items-start gap-6 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teatro-rosso/20 to-teatro-bordeaux/20 border border-teatro-rosso/20 flex items-center justify-center flex-shrink-0">
                  <span className="act-number text-2xl">Scena {act.number}</span>
                </div>
                <div>
                  <h3 className="teatro-display-bold text-2xl lg:text-3xl text-white mb-3">{act.title}</h3>
                  <p className="script-direction text-sm italic text-white/40">{act.direction}</p>
                </div>
              </div>

              {/* Dialogue */}
              <div className="pl-8 border-l-2 border-teatro-oro/30 mb-8">
                <p className="text-lg text-teatro-crema leading-relaxed">
                  <span className="text-teatro-oro font-semibold">ARTHUR: </span>
                  <span className="teatro-display-italic">{act.dialogue}</span>
                </p>
              </div>

              {/* Features as stage directions */}
              <div className="flex flex-wrap gap-3">
                {act.features.map((feature, j) => (
                  <span
                    key={j}
                    className="px-4 py-2 bg-white/[0.03] rounded-xl text-sm text-white/60 border border-white/5"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// PRICING SECTION - "Palcoscenico"
// ============================================

interface PricingPlan {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  highlighted?: boolean
  cta: string
}

const pricingPlans: PricingPlan[] = [
  {
    name: 'Starter',
    price: '€99',
    period: '/mese',
    description: 'Perfetto per iniziare',
    features: [
      'Fino a 100 chiamate/mese',
      'Orario ufficio (9-18)',
      'Presa messaggi',
      'Email notifiche',
      'Supporto email'
    ],
    cta: 'Inizia Gratis'
  },
  {
    name: 'Professional',
    price: '€249',
    period: '/mese',
    description: 'Per aziende in crescita',
    features: [
      'Chiamate illimitate',
      'Disponibilità 24/7',
      'Prenotazione appuntamenti',
      'Trasferimento chiamate',
      'Integrazione calendario',
      'Dashboard analytics',
      'Supporto prioritario'
    ],
    highlighted: true,
    cta: 'Più Popolare'
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Soluzioni personalizzate',
    features: [
      'Volume personalizzato',
      'API completa',
      'Integrazioni custom',
      'Training dedicato',
      'SLA garantito',
      'Account manager',
      'Supporto 24/7'
    ],
    cta: 'Contattaci'
  }
]

function PricingSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="prezzi" ref={ref} className="py-32 teatro-bg relative overflow-hidden">
      {/* Curtain effect */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-teatro-bordeaux/15 to-transparent pointer-events-none" />

      {/* Background orbs */}
      <div className="orb orb-gold w-[400px] h-[400px] -top-32 right-0 opacity-20" />
      <div className="orb orb-rose w-[300px] h-[300px] bottom-20 -left-32 opacity-20" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 badge-teatro rounded-full mb-6">Atto IV</span>
          <h2 className="teatro-display-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-4">
            Il Palcoscenico
          </h2>
          <p className="text-white/50 max-w-xl mx-auto text-lg mt-6">
            Tutti i piani includono una prova gratuita di 14 giorni. Nessuna carta di credito richiesta.
          </p>
          <div className="gold-line w-32 mx-auto mt-8" />
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.6 }}
              className={`relative rounded-3xl p-8 ${
                plan.highlighted
                  ? 'pricing-featured'
                  : 'teatro-card-glow'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-teatro-oro text-teatro-nero text-sm font-semibold rounded-full shadow-lg shadow-teatro-oro/30">
                  Più Popolare
                </div>
              )}

              <div className="text-center mb-10">
                <h3 className="text-xl font-display font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-white/40 text-sm mb-6">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className={`teatro-display-bold text-5xl ${plan.highlighted ? 'text-teatro-gold' : 'text-white'}`}>
                    {plan.price}
                  </span>
                  <span className="text-white/40 text-lg">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-10">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm text-white/60">
                    <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      plan.highlighted ? 'text-teatro-oro' : 'text-white/30'
                    }`} />
                    {feature}
                  </li>
                ))}
              </ul>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-4 rounded-2xl font-semibold transition-all duration-300 ${
                  plan.highlighted
                    ? 'bg-teatro-oro text-teatro-nero hover:shadow-lg hover:shadow-teatro-oro/30'
                    : 'btn-teatro-secondary'
                }`}
              >
                {plan.cta}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// FAQ SECTION - "Domande dal Pubblico"
// ============================================

const faqs = [
  {
    question: 'Come funziona la voce di Arthur?',
    answer: 'Arthur utilizza la più avanzata tecnologia di sintesi vocale di OpenAI, producendo una voce naturale e fluida in italiano. Può gestire accenti regionali e adattarsi al tono della conversazione.'
  },
  {
    question: 'Posso personalizzare le risposte di Arthur?',
    answer: 'Assolutamente! Puoi configurare il saluto, le informazioni aziendali, gli orari, e le istruzioni specifiche per ogni tipo di chiamata attraverso la dashboard.'
  },
  {
    question: 'Come gestisce Arthur le chiamate urgenti?',
    answer: 'Arthur può identificare chiamate urgenti o da clienti VIP e trasferirle immediatamente al numero desiderato, oppure inviare notifiche push istantanee.'
  },
  {
    question: 'È compatibile con il mio centralino esistente?',
    answer: 'Vocalis si integra con i principali sistemi telefonici aziendali via SIP trunk. Per integrazioni specifiche, il nostro team tecnico è disponibile per assistenza.'
  },
  {
    question: 'I dati delle chiamate sono sicuri?',
    answer: 'Tutti i dati sono crittografati e archiviati in conformità con il GDPR. I server sono situati in Europa e non condividiamo mai informazioni con terze parti.'
  },
  {
    question: 'Posso provare Vocalis gratuitamente?',
    answer: 'Sì! Offriamo 14 giorni di prova gratuita con tutte le funzionalità. Non richiediamo carta di credito per iniziare.'
  }
]

function FAQSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" ref={ref} className="py-32 teatro-bg">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 badge-teatro rounded-full mb-6">Atto V</span>
          <h2 className="teatro-display-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-4">
            Domande dal Pubblico
          </h2>
          <div className="gold-line w-32 mx-auto mt-8" />
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.5 }}
              className="teatro-card-glow overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full p-6 flex items-center justify-between text-left"
              >
                <span className="font-display font-semibold text-white pr-4">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-teatro-oro transition-transform duration-300 ${
                    openIndex === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-6 text-white/50 leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// CTA SECTION - "Il Finale"
// ============================================

function CTASection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="py-32 teatro-bg relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="orb orb-rose w-[400px] h-[400px] top-1/2 left-1/4 -translate-y-1/2 opacity-30" />
      <div className="orb orb-gold w-[300px] h-[300px] top-1/2 right-1/4 -translate-y-1/2 opacity-25" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
            className="w-24 h-24 mx-auto mb-10 rounded-3xl bg-gradient-to-br from-teatro-rosso to-teatro-bordeaux flex items-center justify-center shadow-2xl shadow-teatro-rosso/30"
          >
            <Phone className="w-10 h-10 text-white" />
          </motion.div>

          <h2 className="teatro-display-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-8">
            Pronto a trasformare le tue{' '}
            <span className="text-teatro-gold text-glow-gold">chiamate</span>?
          </h2>

          <p className="text-xl text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed">
            Inizia oggi con 14 giorni di prova gratuita. Arthur è pronto a rispondere alle tue chiamate.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-10 py-5 btn-teatro-primary text-white font-semibold rounded-full flex items-center justify-center gap-3 text-lg"
            >
              <Sparkles className="w-5 h-5" />
              Inizia la Prova Gratuita
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-10 py-5 btn-teatro-secondary text-white font-medium rounded-full flex items-center justify-center gap-3 text-lg"
            >
              <Phone className="w-5 h-5" />
              Parla con Noi
            </motion.button>
          </div>

          <p className="mt-10 text-sm text-white/30">
            Nessuna carta di credito richiesta • Setup in 5 minuti • Supporto italiano
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// ============================================
// FOOTER
// ============================================

function Footer() {
  return (
    <footer className="py-16 teatro-bg border-t border-white/5">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-10 mb-16">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teatro-rosso to-teatro-bordeaux flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-semibold text-white">Vocalis</span>
            </div>
            <p className="text-white/40 text-sm mb-5 leading-relaxed">
              La voce intelligente della tua azienda.
            </p>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-teatro-oro" />
              <span className="text-xs text-white/30">GDPR Compliant</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-display font-semibold text-white mb-5">Prodotto</h4>
            <ul className="space-y-3">
              <li><a href="#come-funziona" className="text-sm text-white/40 hover:text-white transition-colors">Come Funziona</a></li>
              <li><a href="#prezzi" className="text-sm text-white/40 hover:text-white transition-colors">Prezzi</a></li>
              <li><a href="#demo" className="text-sm text-white/40 hover:text-white transition-colors">Demo</a></li>
              <li><a href="#" className="text-sm text-white/40 hover:text-white transition-colors">API</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display font-semibold text-white mb-5">Azienda</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-white/40 hover:text-white transition-colors">Chi Siamo</a></li>
              <li><a href="#" className="text-sm text-white/40 hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="text-sm text-white/40 hover:text-white transition-colors">Lavora con Noi</a></li>
              <li><a href="#" className="text-sm text-white/40 hover:text-white transition-colors">Contatti</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display font-semibold text-white mb-5">Legale</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-white/40 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-white/40 hover:text-white transition-colors">Termini di Servizio</a></li>
              <li><a href="#" className="text-sm text-white/40 hover:text-white transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="gold-line mb-8" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/30">
            © 2024 Vocalis by Comtel Italia. Tutti i diritti riservati.
          </p>
          <p className="text-xs text-white/20">
            Powered by OpenAI
          </p>
        </div>
      </div>
    </footer>
  )
}

// ============================================
// MAIN LANDING PAGE
// ============================================

export function LandingPage() {
  const [soundLevel, setSoundLevel] = useState<SoundLevel>('muted')

  const toggleSound = useCallback(() => {
    setSoundLevel(prev => {
      switch (prev) {
        case 'muted': return 'ambient'
        case 'ambient': return 'full'
        case 'full': return 'muted'
      }
    })
  }, [])

  const handlePlayDemo = useCallback(() => {
    // Scroll to demo section
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <div className="min-h-screen teatro-bg text-white">
      <Navigation />
      <HeroSection onPlayDemo={handlePlayDemo} />
      <IlDialogoSection />
      <DemoSection />
      <FeaturesSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />

      {/* Floating sound toggle */}
      <FloatingSoundToggle level={soundLevel} onToggle={toggleSound} />
    </div>
  )
}
