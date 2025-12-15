import { motion, useInView, useScroll, useTransform } from "framer-motion"
import { ArrowRight, Check, Phone, Shield, Server, Users, Globe, Building2, Headphones, Lock, Network, Menu, X, Play, Sparkles, Zap, Clock, ChevronRight } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { Link } from "react-router-dom"

// Voice Waveform Animation Component
function VoiceWaveform({ className = "" }: { className?: string }) {
    const bars = 40
    return (
        <div className={`flex items-center justify-center gap-[3px] h-16 ${className}`}>
            {Array.from({ length: bars }).map((_, i) => (
                <motion.div
                    key={i}
                    className="w-1 bg-gradient-to-t from-violet-500 to-cyan-400 rounded-full"
                    animate={{
                        height: [8, Math.random() * 48 + 16, 8],
                    }}
                    transition={{
                        duration: 0.8 + Math.random() * 0.4,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                        delay: i * 0.02,
                    }}
                />
            ))}
        </div>
    )
}

// Animated Counter Component
function AnimatedCounter({ target, suffix = "", prefix = "" }: { target: number, suffix?: string, prefix?: string }) {
    const [count, setCount] = useState(0)
    const ref = useRef<HTMLSpanElement>(null)
    const isInView = useInView(ref, { once: true })

    useEffect(() => {
        if (isInView) {
            const duration = 2000
            const steps = 60
            const increment = target / steps
            let current = 0
            const timer = setInterval(() => {
                current += increment
                if (current >= target) {
                    setCount(target)
                    clearInterval(timer)
                } else {
                    setCount(Math.floor(current))
                }
            }, duration / steps)
            return () => clearInterval(timer)
        }
    }, [isInView, target])

    return <span ref={ref}>{prefix}{count}{suffix}</span>
}

// Glassmorphism Card
function GlassCard({ children, className = "", hover = true }: { children: React.ReactNode, className?: string, hover?: boolean }) {
    return (
        <motion.div
            className={`relative backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-3xl overflow-hidden ${className}`}
            whileHover={hover ? { scale: 1.02, borderColor: "rgba(255,255,255,0.15)" } : {}}
            transition={{ duration: 0.3 }}
        >
            {/* Noise texture overlay */}
            <div className="absolute inset-0 opacity-[0.015] bg-noise pointer-events-none" />
            {/* Gradient glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
            <div className="relative z-10">{children}</div>
        </motion.div>
    )
}

// Floating Phone Mockup
function PhoneMockup() {
    return (
        <motion.div
            className="relative"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
            {/* Phone frame */}
            <div className="relative w-[280px] h-[560px] bg-slate-900 rounded-[3rem] border-4 border-slate-700 shadow-2xl shadow-violet-500/20">
                {/* Notch */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-800 rounded-full" />

                {/* Screen content */}
                <div className="absolute inset-4 top-12 bg-gradient-to-b from-slate-800 to-slate-900 rounded-[2rem] overflow-hidden">
                    {/* Call UI */}
                    <div className="p-6 flex flex-col items-center justify-center h-full">
                        {/* Incoming call indicator */}
                        <motion.div
                            className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mb-4"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <Phone className="w-8 h-8 text-white" />
                        </motion.div>

                        <p className="text-slate-400 text-sm mb-1">Chiamata in arrivo</p>
                        <p className="text-white font-semibold text-lg mb-6">+39 02 2052781</p>

                        {/* Waveform */}
                        <div className="w-full mb-6">
                            <VoiceWaveform />
                        </div>

                        {/* Transcript bubble */}
                        <motion.div
                            className="bg-white/10 backdrop-blur rounded-2xl px-4 py-3 max-w-full"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1, duration: 0.5 }}
                        >
                            <p className="text-sm text-slate-300 italic">"Buongiorno, Comtel Italia..."</p>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Decorative elements */}
            <motion.div
                className="absolute -top-8 -right-8 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div
                className="absolute -bottom-8 -left-8 w-24 h-24 bg-cyan-500/20 rounded-full blur-3xl"
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 4, repeat: Infinity }}
            />
        </motion.div>
    )
}

// Bento Feature Card
function BentoCard({
    icon,
    title,
    description,
    className = "",
    gradient = "from-violet-500/20 to-transparent"
}: {
    icon: React.ReactNode
    title: string
    description: string
    className?: string
    gradient?: string
}) {
    return (
        <GlassCard className={`p-6 lg:p-8 group ${className}`}>
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className="mb-4 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/10 transition-all duration-300">
                {icon}
            </div>
            <h3 className="text-lg lg:text-xl font-semibold text-white mb-2">{title}</h3>
            <p className="text-slate-400 text-sm lg:text-base leading-relaxed">{description}</p>
        </GlassCard>
    )
}

// Magnetic Button
function MagneticButton({ children, className = "", variant = "primary" }: { children: React.ReactNode, className?: string, variant?: "primary" | "secondary" }) {
    const ref = useRef<HTMLButtonElement>(null)
    const [position, setPosition] = useState({ x: 0, y: 0 })

    const handleMouse = (e: React.MouseEvent<HTMLButtonElement>) => {
        const { clientX, clientY } = e
        const { left, top, width, height } = ref.current!.getBoundingClientRect()
        const x = (clientX - left - width / 2) * 0.15
        const y = (clientY - top - height / 2) * 0.15
        setPosition({ x, y })
    }

    const reset = () => setPosition({ x: 0, y: 0 })

    const baseStyles = "relative overflow-hidden font-semibold transition-all duration-300"
    const variants = {
        primary: "bg-white text-slate-950 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]",
        secondary: "bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20"
    }

    return (
        <motion.button
            ref={ref}
            className={`${baseStyles} ${variants[variant]} ${className}`}
            animate={{ x: position.x, y: position.y }}
            onMouseMove={handleMouse}
            onMouseLeave={reset}
            transition={{ type: "spring", stiffness: 150, damping: 15 }}
        >
            {children}
        </motion.button>
    )
}

export function LandingPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const heroRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"]
    })
    const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0])
    const heroY = useTransform(scrollYProgress, [0, 1], [0, 100])

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-slate-50 font-sans selection:bg-violet-500/30 overflow-x-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute top-0 left-1/4 w-[800px] h-[600px] bg-violet-500/10 rounded-full blur-[150px] animate-pulse-glow" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[500px] bg-cyan-500/10 rounded-full blur-[150px] animate-pulse-glow" style={{ animationDelay: "1s" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-radial from-violet-500/5 via-transparent to-transparent" />
                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5">
                <div className="absolute inset-0 bg-[#09090b]/80 backdrop-blur-xl" />
                <div className="relative container mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="relative">
                            <img src="/logo.png" alt="Vocalis" className="h-10 w-10 object-contain relative z-10" />
                            <div className="absolute inset-0 bg-violet-500/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                            Vocalis
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                        <a href="#features" className="hover:text-white transition-colors relative group">
                            Funzionalità
                            <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-violet-500 to-cyan-500 group-hover:w-full transition-all duration-300" />
                        </a>
                        <a href="#enterprise" className="hover:text-white transition-colors relative group">
                            Enterprise
                            <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-violet-500 to-cyan-500 group-hover:w-full transition-all duration-300" />
                        </a>
                        <a href="#pricing" className="hover:text-white transition-colors relative group">
                            Prezzi
                            <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-violet-500 to-cyan-500 group-hover:w-full transition-all duration-300" />
                        </a>
                        <Link to="/dashboard" className="text-white hover:text-violet-400 transition-colors">Dashboard</Link>
                        <MagneticButton className="px-5 py-2.5 rounded-full text-sm" variant="primary">
                            <span className="relative z-10 flex items-center gap-2">
                                Richiedi Demo <Sparkles className="w-4 h-4" />
                            </span>
                        </MagneticButton>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button className="md:hidden p-2 text-slate-300" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Nav */}
                {isMenuOpen && (
                    <motion.div
                        className="md:hidden border-t border-white/5 bg-[#09090b]/95 backdrop-blur-xl p-6 flex flex-col gap-4"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <a href="#features" className="text-slate-300 hover:text-white py-2">Funzionalità</a>
                        <a href="#enterprise" className="text-slate-300 hover:text-white py-2">Enterprise</a>
                        <a href="#pricing" className="text-slate-300 hover:text-white py-2">Prezzi</a>
                        <Link to="/dashboard" className="text-slate-300 hover:text-white py-2">Dashboard</Link>
                        <button className="bg-white text-slate-950 px-5 py-3 rounded-xl font-semibold w-full mt-2">
                            Richiedi Demo
                        </button>
                    </motion.div>
                )}
            </nav>

            {/* Hero Section */}
            <section ref={heroRef} className="relative min-h-screen flex items-center pt-20">
                <motion.div
                    className="container mx-auto px-6 py-20 lg:py-32"
                    style={{ opacity: heroOpacity, y: heroY }}
                >
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        {/* Left: Content */}
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="text-center lg:text-left"
                        >
                            {/* Badge */}
                            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-sm text-slate-300">Powered by OpenAI GPT-4 Realtime</span>
                            </motion.div>

                            {/* Headline */}
                            <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
                                <span className="text-white">Il Futuro delle</span>
                                <br />
                                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x">
                                    Comunicazioni AI
                                </span>
                            </motion.h1>

                            {/* Subheadline */}
                            <motion.p variants={itemVariants} className="text-lg lg:text-xl text-slate-400 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                                Voice AI <span className="text-white font-medium">enterprise-grade</span> per aziende italiane.
                                Receptionist virtuale, sicurezza on-premise, numeri +39 dedicati.
                            </motion.p>

                            {/* CTAs */}
                            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                                <MagneticButton className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base" variant="primary">
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        Inizia Ora <ArrowRight className="w-5 h-5" />
                                    </span>
                                </MagneticButton>
                                <MagneticButton className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base" variant="secondary">
                                    <span className="flex items-center justify-center gap-2">
                                        <Play className="w-5 h-5" /> Guarda la Demo
                                    </span>
                                </MagneticButton>
                            </motion.div>

                            {/* Trust indicators */}
                            <motion.div variants={itemVariants} className="mt-12 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-slate-500">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-emerald-500" />
                                    <span>GDPR Compliant</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Server className="w-4 h-4 text-violet-500" />
                                    <span>On-Premise Ready</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-cyan-500" />
                                    <span>Made in Italy</span>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Right: Phone Mockup */}
                        <motion.div
                            className="hidden lg:flex justify-center"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                        >
                            <PhoneMockup />
                        </motion.div>
                    </div>
                </motion.div>

                {/* Scroll indicator */}
                <motion.div
                    className="absolute bottom-8 left-1/2 -translate-x-1/2"
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
                        <motion.div
                            className="w-1.5 h-1.5 rounded-full bg-white/50"
                            animate={{ y: [0, 12, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </div>
                </motion.div>
            </section>

            {/* Stats Section */}
            <section className="py-20 relative">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { value: 100, suffix: "+", label: "Interni Instradabili", icon: Network },
                            { value: 24, suffix: "/7", label: "Disponibilità", icon: Clock },
                            { value: 100, suffix: "%", label: "Dati in Italia", icon: Shield },
                            { value: 39, prefix: "+", label: "Numeri Italiani", icon: Phone }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <GlassCard className="p-6 text-center" hover={false}>
                                    <stat.icon className="w-6 h-6 mx-auto mb-3 text-violet-400" />
                                    <div className="text-3xl lg:text-4xl font-bold text-white mb-1">
                                        <AnimatedCounter target={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                                    </div>
                                    <p className="text-slate-400 text-sm">{stat.label}</p>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Bento Features Grid */}
            <section id="features" className="py-24 relative">
                <div className="container mx-auto px-6">
                    <motion.div
                        className="text-center max-w-2xl mx-auto mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className="inline-block px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-6">
                            Funzionalità
                        </span>
                        <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
                            Tutto ciò che serve per l'
                            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">AI Vocale</span>
                        </h2>
                        <p className="text-slate-400 text-lg">
                            Tecnologia enterprise con semplicità d'uso consumer
                        </p>
                    </motion.div>

                    {/* Bento Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                        {/* Large card */}
                        <motion.div
                            className="md:col-span-2 lg:col-span-2"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <GlassCard className="p-8 h-full">
                                <div className="flex flex-col lg:flex-row gap-8 items-center">
                                    <div className="flex-1">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-4">
                                            <Headphones className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-3">Conversazione Naturale</h3>
                                        <p className="text-slate-400 leading-relaxed mb-4">
                                            Powered by GPT-4 Realtime. Il tuo receptionist AI risponde alle chiamate con voce naturale,
                                            capisce il contesto e gestisce conversazioni complesse in italiano.
                                        </p>
                                        <a href="#" className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 font-medium text-sm">
                                            Scopri di più <ChevronRight className="w-4 h-4" />
                                        </a>
                                    </div>
                                    <div className="flex-shrink-0 w-full lg:w-auto">
                                        <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
                                            <VoiceWaveform className="w-full lg:w-48" />
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>

                        <BentoCard
                            icon={<Users className="w-6 h-6 text-blue-400" />}
                            title="Receptionist 24/7"
                            description="Non perdi mai una chiamata. Gestisce appuntamenti, FAQ, prende messaggi."
                            gradient="from-blue-500/20"
                        />

                        <BentoCard
                            icon={<Network className="w-6 h-6 text-pink-400" />}
                            title="Routing Intelligente"
                            description="Instrada verso 100+ interni. IVR smart, code di attesa, trasferimenti."
                            gradient="from-pink-500/20"
                        />

                        <BentoCard
                            icon={<Building2 className="w-6 h-6 text-amber-400" />}
                            title="Personalizzazione"
                            description="Voce, personalità, knowledge base aziendale. Il tuo brand, sempre."
                            gradient="from-amber-500/20"
                        />

                        <BentoCard
                            icon={<Zap className="w-6 h-6 text-emerald-400" />}
                            title="Setup in 48h"
                            description="Vai live in due giorni. Integrazione BYOC con la tua infrastruttura."
                            gradient="from-emerald-500/20"
                        />
                    </div>
                </div>
            </section>

            {/* Enterprise Section */}
            <section id="enterprise" className="py-24 relative">
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left: Content */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
                                Enterprise
                            </span>
                            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                                Controllo Totale.<br />
                                <span className="text-slate-400">Sicurezza Assoluta.</span>
                            </h2>
                            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                                Progettato per aziende italiane che non scendono a compromessi.
                                I tuoi dati restano tuoi, sempre.
                            </p>

                            <div className="space-y-4">
                                {[
                                    { icon: Server, text: "Deployment On-Premise sui tuoi server" },
                                    { icon: Lock, text: "Crittografia end-to-end, audit completi" },
                                    { icon: Shield, text: "GDPR compliant by design" },
                                    { icon: Phone, text: "BYOC: porta i tuoi numeri esistenti" }
                                ].map((item, i) => (
                                    <motion.div
                                        key={i}
                                        className="flex items-center gap-4"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                            <item.icon className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <span className="text-slate-300">{item.text}</span>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="mt-10">
                                <MagneticButton className="px-8 py-4 rounded-2xl text-base" variant="primary">
                                    <span className="flex items-center gap-2">
                                        Parla con un Esperto <ArrowRight className="w-5 h-5" />
                                    </span>
                                </MagneticButton>
                            </div>
                        </motion.div>

                        {/* Right: Visual */}
                        <motion.div
                            className="relative"
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <GlassCard className="p-8" hover={false}>
                                <div className="space-y-4">
                                    {/* Security badge */}
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                <Shield className="w-5 h-5 text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">Sicurezza</p>
                                                <p className="text-slate-500 text-sm">Enterprise-grade</p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium">
                                            Attivo
                                        </span>
                                    </div>

                                    {/* Server status */}
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-slate-400 text-sm">Server Location</span>
                                            <span className="text-emerald-400 text-sm">Milano, IT</span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                                                initial={{ width: 0 }}
                                                whileInView={{ width: "100%" }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 1, delay: 0.5 }}
                                            />
                                        </div>
                                        <p className="text-slate-500 text-xs mt-2">Latenza: 12ms</p>
                                    </div>

                                    {/* Data flow */}
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                        <p className="text-slate-400 text-sm mb-3">Flusso Dati</p>
                                        <div className="flex items-center gap-3">
                                            <div className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm">Chiamata</div>
                                            <ChevronRight className="w-4 h-4 text-slate-600" />
                                            <div className="px-3 py-2 rounded-lg bg-violet-500/20 text-violet-300 text-sm border border-violet-500/30">AI</div>
                                            <ChevronRight className="w-4 h-4 text-slate-600" />
                                            <div className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm border border-emerald-500/30">On-Prem</div>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>

                            {/* Decorative glow */}
                            <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/10 to-emerald-500/10 rounded-3xl blur-3xl -z-10" />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 relative">
                <div className="container mx-auto px-6">
                    <motion.div
                        className="text-center max-w-2xl mx-auto mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6">
                            Pricing
                        </span>
                        <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
                            Piani Trasparenti
                        </h2>
                        <p className="text-slate-400 text-lg">
                            Prezzi in Euro. Fatturazione italiana. Nessun costo nascosto.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {[
                            {
                                name: "Business",
                                price: "€299",
                                description: "PMI e studi professionali",
                                features: ["500 minuti/mese", "1 numero italiano", "10 interni", "Dashboard base", "Support email"],
                                popular: false
                            },
                            {
                                name: "Professional",
                                price: "€799",
                                description: "Aziende in crescita",
                                features: ["2000 minuti/mese", "5 numeri italiani", "50 interni", "BYOC supportato", "Analytics avanzati", "Support prioritario"],
                                popular: true
                            },
                            {
                                name: "Enterprise",
                                price: "Custom",
                                description: "On-Premise & grandi volumi",
                                features: ["Minuti illimitati", "Numeri illimitati", "100+ interni", "On-Premise", "SLA garantito", "Account manager", "Integrazione CRM"],
                                popular: false
                            }
                        ].map((plan, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <GlassCard className={`p-8 h-full flex flex-col ${plan.popular ? 'ring-2 ring-violet-500/50' : ''}`}>
                                    {plan.popular && (
                                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-medium">
                                            Più Popolare
                                        </span>
                                    )}
                                    <div className="mb-6">
                                        <h3 className="text-xl font-semibold text-white mb-1">{plan.name}</h3>
                                        <p className="text-slate-500 text-sm">{plan.description}</p>
                                    </div>
                                    <div className="mb-6">
                                        <span className="text-4xl font-bold text-white">{plan.price}</span>
                                        {plan.price !== "Custom" && <span className="text-slate-500">/mese</span>}
                                    </div>
                                    <div className="flex-1 space-y-3 mb-8">
                                        {plan.features.map((feature, j) => (
                                            <div key={j} className="flex items-center gap-3 text-slate-300 text-sm">
                                                <Check className="w-4 h-4 text-violet-400 flex-shrink-0" />
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <MagneticButton
                                        className="w-full py-3 rounded-xl text-sm"
                                        variant={plan.popular ? "primary" : "secondary"}
                                    >
                                        {plan.price === "Custom" ? "Contattaci" : `Scegli ${plan.name}`}
                                    </MagneticButton>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                    >
                        <GlassCard className="p-12 lg:p-16 text-center relative overflow-hidden" hover={false}>
                            {/* Background decoration */}
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-cyan-500/10" />
                            <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-[120px]" />
                            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px]" />

                            <div className="relative z-10">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    whileInView={{ scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ type: "spring", delay: 0.2 }}
                                    className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center"
                                >
                                    <Phone className="w-8 h-8 text-white" />
                                </motion.div>

                                <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
                                    Pronto a Iniziare?
                                </h2>
                                <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
                                    Richiedi una demo personalizzata e scopri come Vocalis può trasformare le tue comunicazioni.
                                </p>

                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <MagneticButton className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base" variant="primary">
                                        <span className="flex items-center justify-center gap-2">
                                            Richiedi Demo Gratuita <Sparkles className="w-5 h-5" />
                                        </span>
                                    </MagneticButton>
                                    <MagneticButton className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base" variant="secondary">
                                        <span className="flex items-center justify-center gap-2">
                                            <Phone className="w-5 h-5" /> +39 02 2052781
                                        </span>
                                    </MagneticButton>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 border-t border-white/5 relative">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                        {/* Brand */}
                        <div>
                            <Link to="/" className="flex items-center gap-2 mb-4">
                                <img src="/logo.png" alt="Vocalis" className="h-8 w-8" />
                                <span className="font-bold text-white">Vocalis</span>
                            </Link>
                            <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                                Voice AI Enterprise per aziende italiane.<br />
                                Una partnership PugliAI × Comtel Italia.
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <Shield className="w-3.5 h-3.5" />
                                    <span>GDPR</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>ISO 27001</span>
                                </div>
                            </div>
                        </div>

                        {/* Links */}
                        <div>
                            <h4 className="font-semibold text-white mb-4">Prodotto</h4>
                            <ul className="space-y-3 text-slate-500 text-sm">
                                <li><a href="#features" className="hover:text-white transition-colors">Funzionalità</a></li>
                                <li><a href="#enterprise" className="hover:text-white transition-colors">Enterprise</a></li>
                                <li><a href="#pricing" className="hover:text-white transition-colors">Prezzi</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Azienda</h4>
                            <ul className="space-y-3 text-slate-500 text-sm">
                                <li><a href="https://pugliai.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">PugliAI</a></li>
                                <li><a href="https://comtelitalia.it" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Comtel Italia</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Chi Siamo</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Lavora con Noi</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Contatti</h4>
                            <ul className="space-y-3 text-slate-500 text-sm">
                                <li>Via Vittor Pisani, 10</li>
                                <li>20124 Milano, Italia</li>
                                <li className="text-white font-medium">+39 02 2052781</li>
                                <li>info@comtelitalia.it</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-white/5">
                        <p className="text-slate-600 text-sm">
                            © 2025 Vocalis AI. Tutti i diritti riservati.
                        </p>
                        <div className="flex gap-6 text-sm text-slate-500">
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Termini</a>
                            <a href="#" className="hover:text-white transition-colors">Cookie</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
