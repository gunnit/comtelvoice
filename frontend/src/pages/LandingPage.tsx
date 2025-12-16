import { motion, useInView, useScroll, useTransform } from "framer-motion"
import { ArrowRight, Check, Phone, Shield, Server, Users, Globe, Building2, Headphones, Lock, Network, Menu, X, Play, Sparkles, Zap, Clock, ChevronRight, ChevronDown, MessageSquare, BarChart3, Settings, PhoneCall } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { Link } from "react-router-dom"

// Demo Request Modal Component
function DemoModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        company: "",
        phone: "",
        employees: "",
        message: ""
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        // Simulate form submission - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1500))

        setIsSubmitting(false)
        setIsSubmitted(true)

        // Reset after showing success
        setTimeout(() => {
            setIsSubmitted(false)
            setFormData({ name: "", email: "", company: "", phone: "", employees: "", message: "" })
            onClose()
        }, 3000)
    }

    if (!isOpen) return null

    return (
        <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                className="relative w-full max-w-lg bg-[#0f0f12] border border-white/10 rounded-3xl p-8 shadow-2xl"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {isSubmitted ? (
                    <div className="text-center py-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center"
                        >
                            <Check className="w-8 h-8 text-emerald-400" />
                        </motion.div>
                        <h3 className="text-xl font-semibold text-white mb-2">Richiesta Inviata!</h3>
                        <p className="text-slate-400">Ti contatteremo entro 24 ore lavorative.</p>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-bold text-white mb-2">Richiedi una Demo</h3>
                            <p className="text-slate-400">Compila il form e ti contatteremo per una demo personalizzata.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">Nome *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
                                        placeholder="Mario Rossi"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">Email *</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
                                        placeholder="mario@azienda.it"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">Azienda *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.company}
                                        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
                                        placeholder="Azienda Srl"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">Telefono</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
                                        placeholder="+39 02 1234567"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1.5">Numero dipendenti</label>
                                <select
                                    value={formData.employees}
                                    onChange={(e) => setFormData(prev => ({ ...prev, employees: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                                >
                                    <option value="" className="bg-slate-900">Seleziona...</option>
                                    <option value="1-10" className="bg-slate-900">1-10</option>
                                    <option value="11-50" className="bg-slate-900">11-50</option>
                                    <option value="51-200" className="bg-slate-900">51-200</option>
                                    <option value="201-500" className="bg-slate-900">201-500</option>
                                    <option value="500+" className="bg-slate-900">500+</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1.5">Messaggio (opzionale)</label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
                                    placeholder="Raccontaci le tue esigenze..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 bg-white text-slate-950 font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Invio in corso...
                                    </span>
                                ) : (
                                    "Richiedi Demo Gratuita"
                                )}
                            </button>

                            <p className="text-xs text-slate-500 text-center">
                                Inviando questo form accetti la nostra{" "}
                                <a href="/privacy" className="text-violet-400 hover:underline">Privacy Policy</a>
                            </p>
                        </form>
                    </>
                )}
            </motion.div>
        </motion.div>
    )
}

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
                        <p className="text-white font-semibold text-lg mb-6">La Tua Azienda</p>

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
                            <p className="text-xs text-violet-400 mb-1">Assistente AI</p>
                            <p className="text-sm text-slate-300 italic">"Buongiorno, come posso aiutarla?"</p>
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
function MagneticButton({
    children,
    className = "",
    variant = "primary",
    onClick
}: {
    children: React.ReactNode,
    className?: string,
    variant?: "primary" | "secondary",
    onClick?: () => void
}) {
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
            onClick={onClick}
            transition={{ type: "spring", stiffness: 150, damping: 15 }}
        >
            {children}
        </motion.button>
    )
}

// FAQ Accordion Item
function FAQItem({ question, answer, isOpen, onClick }: { question: string, answer: string, isOpen: boolean, onClick: () => void }) {
    return (
        <motion.div
            className="border-b border-white/10"
            initial={false}
        >
            <button
                className="w-full py-5 flex items-center justify-between text-left"
                onClick={onClick}
            >
                <span className="text-white font-medium pr-8">{question}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                </motion.div>
            </button>
            <motion.div
                initial={false}
                animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
            >
                <p className="pb-5 text-slate-400 leading-relaxed">{answer}</p>
            </motion.div>
        </motion.div>
    )
}

export function LandingPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isDemoModalOpen, setIsDemoModalOpen] = useState(false)
    const [openFAQ, setOpenFAQ] = useState<number | null>(0)
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

    const openDemoModal = () => setIsDemoModalOpen(true)

    const faqs = [
        {
            question: "Come funziona l'integrazione con il mio centralino esistente?",
            answer: "Vocalis supporta l'integrazione BYOC (Bring Your Own Carrier), permettendoti di mantenere i tuoi numeri telefonici e il tuo operatore. L'integrazione avviene tramite SIP trunk e richiede modifiche minime alla tua infrastruttura esistente. Il nostro team ti guiderà nell'intero processo."
        },
        {
            question: "I dati delle conversazioni dove vengono archiviati?",
            answer: "Con il piano Enterprise, i dati restano completamente sui tuoi server (on-premise). Per i piani Business e Professional, i dati sono archiviati in data center italiani certificati, in piena conformità GDPR. Non condividiamo mai i dati con terze parti."
        },
        {
            question: "Quanto tempo richiede l'attivazione?",
            answer: "Per i piani Business e Professional, l'attivazione tipica richiede 48-72 ore dalla firma del contratto. Per soluzioni Enterprise on-premise, il tempo varia in base alla complessità dell'infrastruttura (solitamente 2-4 settimane)."
        },
        {
            question: "L'assistente AI può gestire conversazioni complesse?",
            answer: "Sì. Il nostro AI è basato sui modelli più avanzati di OpenAI ed è ottimizzato per conversazioni naturali in italiano. Può gestire FAQ, prendere messaggi, schedulare callback, trasferire chiamate e persino accedere a dati aziendali (con autenticazione). Puoi personalizzare completamente la knowledge base e le istruzioni."
        },
        {
            question: "Cosa succede se l'AI non riesce a rispondere?",
            answer: "L'assistente è configurato per riconoscere i propri limiti. Quando non è in grado di rispondere adeguatamente, trasferisce automaticamente la chiamata a un operatore umano o prende un messaggio dettagliato. Puoi configurare le regole di escalation nel pannello di controllo."
        },
        {
            question: "Posso provare il servizio prima di acquistare?",
            answer: "Certamente! Offriamo una demo gratuita personalizzata dove potrai vedere il sistema in azione con scenari reali del tuo business. Durante la demo, configureremo insieme le prime impostazioni e potrai testare una chiamata dal vivo."
        }
    ]

    return (
        <div className="min-h-screen bg-[#09090b] text-slate-50 font-sans selection:bg-violet-500/30 overflow-x-hidden">
            {/* Demo Modal */}
            <DemoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />

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
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                                <Phone className="w-5 h-5 text-white" />
                            </div>
                            <div className="absolute inset-0 bg-violet-500/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                            Vocalis
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                        <a href="#come-funziona" className="hover:text-white transition-colors relative group">
                            Come Funziona
                            <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-violet-500 to-cyan-500 group-hover:w-full transition-all duration-300" />
                        </a>
                        <a href="#features" className="hover:text-white transition-colors relative group">
                            Funzionalità
                            <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-violet-500 to-cyan-500 group-hover:w-full transition-all duration-300" />
                        </a>
                        <a href="#pricing" className="hover:text-white transition-colors relative group">
                            Prezzi
                            <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-violet-500 to-cyan-500 group-hover:w-full transition-all duration-300" />
                        </a>
                        <a href="#faq" className="hover:text-white transition-colors relative group">
                            FAQ
                            <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-violet-500 to-cyan-500 group-hover:w-full transition-all duration-300" />
                        </a>
                        <MagneticButton className="px-5 py-2.5 rounded-full text-sm" variant="primary" onClick={openDemoModal}>
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
                        <a href="#come-funziona" className="text-slate-300 hover:text-white py-2" onClick={() => setIsMenuOpen(false)}>Come Funziona</a>
                        <a href="#features" className="text-slate-300 hover:text-white py-2" onClick={() => setIsMenuOpen(false)}>Funzionalità</a>
                        <a href="#pricing" className="text-slate-300 hover:text-white py-2" onClick={() => setIsMenuOpen(false)}>Prezzi</a>
                        <a href="#faq" className="text-slate-300 hover:text-white py-2" onClick={() => setIsMenuOpen(false)}>FAQ</a>
                        <button
                            className="bg-white text-slate-950 px-5 py-3 rounded-xl font-semibold w-full mt-2"
                            onClick={() => { setIsMenuOpen(false); openDemoModal(); }}
                        >
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
                                <span className="text-sm text-slate-300">Receptionist AI di Nuova Generazione</span>
                            </motion.div>

                            {/* Headline */}
                            <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
                                <span className="text-white">Il Tuo Centralino</span>
                                <br />
                                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x">
                                    Diventa Intelligente
                                </span>
                            </motion.h1>

                            {/* Subheadline */}
                            <motion.p variants={itemVariants} className="text-lg lg:text-xl text-slate-400 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                                Assistente vocale AI che risponde alle chiamate 24/7, prende messaggi,
                                gestisce appuntamenti e trasferisce ai giusti reparti.
                                <span className="text-white font-medium"> Tutto in italiano.</span>
                            </motion.p>

                            {/* CTAs */}
                            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                                <MagneticButton className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base" variant="primary" onClick={openDemoModal}>
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        Richiedi Demo Gratuita <ArrowRight className="w-5 h-5" />
                                    </span>
                                </MagneticButton>
                                <MagneticButton className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base" variant="secondary" onClick={() => document.getElementById('come-funziona')?.scrollIntoView({ behavior: 'smooth' })}>
                                    <span className="flex items-center justify-center gap-2">
                                        <Play className="w-5 h-5" /> Scopri Come Funziona
                                    </span>
                                </MagneticButton>
                            </motion.div>

                            {/* Trust indicators */}
                            <motion.div variants={itemVariants} className="mt-12 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-slate-500">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-emerald-500" />
                                    <span>Conforme GDPR</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Server className="w-4 h-4 text-violet-500" />
                                    <span>Dati in Italia</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-cyan-500" />
                                    <span>Numeri +39</span>
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

            {/* Social Proof / Clients */}
            <section className="py-16 border-y border-white/5">
                <div className="container mx-auto px-6">
                    <p className="text-center text-slate-500 text-sm mb-8">Scelto da aziende italiane per la gestione delle comunicazioni</p>
                    <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16 opacity-50">
                        {/* Placeholder client logos - replace with actual logos */}
                        {["Studio Legale", "Clinica Medica", "Concessionaria Auto", "Hotel & Hospitality", "E-commerce"].map((client, i) => (
                            <div key={i} className="text-slate-500 font-semibold text-lg">
                                {client}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 relative">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { value: 99, suffix: "%", label: "Uptime Garantito", icon: Server },
                            { value: 24, suffix: "/7", label: "Sempre Attivo", icon: Clock },
                            { value: 100, suffix: "+", label: "Interni Gestibili", icon: Network },
                            { value: 3, suffix: "sec", label: "Tempo di Risposta", icon: Zap }
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
                                        <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                                    </div>
                                    <p className="text-slate-400 text-sm">{stat.label}</p>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it Works Section */}
            <section id="come-funziona" className="py-24 relative">
                <div className="container mx-auto px-6">
                    <motion.div
                        className="text-center max-w-2xl mx-auto mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
                            Come Funziona
                        </span>
                        <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
                            Attivo in <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">3 Semplici Passi</span>
                        </h2>
                        <p className="text-slate-400 text-lg">
                            Dall'integrazione al go-live in meno di una settimana
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {/* Connection line */}
                        <div className="hidden md:block absolute top-24 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

                        {[
                            {
                                step: "01",
                                icon: <Settings className="w-6 h-6 text-violet-400" />,
                                title: "Configurazione",
                                description: "Colleghi il tuo numero telefonico esistente o ne attivi uno nuovo. Personalizzi voce, personalità e knowledge base dell'assistente."
                            },
                            {
                                step: "02",
                                icon: <MessageSquare className="w-6 h-6 text-fuchsia-400" />,
                                title: "Addestramento",
                                description: "Carichi FAQ, procedure, contatti dei reparti. L'AI impara le specifiche del tuo business e come gestire ogni tipo di richiesta."
                            },
                            {
                                step: "03",
                                icon: <PhoneCall className="w-6 h-6 text-cyan-400" />,
                                title: "Vai Live",
                                description: "Attivi il servizio. L'assistente risponde alle chiamate, prende messaggi, trasferisce ai colleghi e ti invia report giornalieri."
                            }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2 }}
                                className="relative"
                            >
                                <GlassCard className="p-8 h-full text-center">
                                    {/* Step number */}
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-sm font-bold">
                                        {item.step}
                                    </div>
                                    <div className="mt-4 mb-4 w-14 h-14 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                        {item.icon}
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                                    <p className="text-slate-400 leading-relaxed">{item.description}</p>
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
                            Tutto ciò che serve per{" "}
                            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">gestire le chiamate</span>
                        </h2>
                        <p className="text-slate-400 text-lg">
                            Tecnologia avanzata, semplicità d'uso
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
                                        <h3 className="text-2xl font-bold text-white mb-3">Conversazioni Naturali in Italiano</h3>
                                        <p className="text-slate-400 leading-relaxed mb-4">
                                            L'assistente AI risponde con voce naturale, comprende il contesto
                                            e gestisce conversazioni complesse. Riconosce automaticamente
                                            la lingua del chiamante e si adatta di conseguenza.
                                        </p>
                                        <button
                                            onClick={openDemoModal}
                                            className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 font-medium text-sm"
                                        >
                                            Ascolta una demo <ChevronRight className="w-4 h-4" />
                                        </button>
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
                            description="Non perdi mai una chiamata. Risponde a qualsiasi ora, gestisce FAQ, prende messaggi dettagliati."
                            gradient="from-blue-500/20"
                        />

                        <BentoCard
                            icon={<Network className="w-6 h-6 text-pink-400" />}
                            title="Trasferimento Intelligente"
                            description="Instrada le chiamate ai giusti reparti o colleghi. Gestisce code di attesa e failover automatici."
                            gradient="from-pink-500/20"
                        />

                        <BentoCard
                            icon={<Building2 className="w-6 h-6 text-amber-400" />}
                            title="Completamente Personalizzabile"
                            description="Voce, tono, knowledge base: configura l'assistente per rappresentare al meglio la tua azienda."
                            gradient="from-amber-500/20"
                        />

                        <BentoCard
                            icon={<BarChart3 className="w-6 h-6 text-emerald-400" />}
                            title="Analytics e Report"
                            description="Dashboard con metriche chiamate, trascrizioni complete e insight per migliorare il servizio."
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
                                Per aziende che richiedono il massimo livello di controllo e sicurezza.
                                I tuoi dati restano tuoi, sempre.
                            </p>

                            <div className="space-y-4">
                                {[
                                    { icon: Server, text: "Installazione sui tuoi server (on-premise)" },
                                    { icon: Lock, text: "Crittografia end-to-end, audit completi" },
                                    { icon: Shield, text: "Conforme GDPR e normative italiane" },
                                    { icon: Phone, text: "BYOC: mantieni i tuoi numeri esistenti" }
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
                                <MagneticButton className="px-8 py-4 rounded-2xl text-base" variant="primary" onClick={openDemoModal}>
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
                                                <p className="text-slate-500 text-sm">Livello Enterprise</p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium">
                                            Attivo
                                        </span>
                                    </div>

                                    {/* Server status */}
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-slate-400 text-sm">Data Center</span>
                                            <span className="text-emerald-400 text-sm">Milano, Italia</span>
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
                                            <div className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm border border-emerald-500/30">Server IT</div>
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

            {/* Testimonials Section */}
            <section className="py-24 relative">
                <div className="container mx-auto px-6">
                    <motion.div
                        className="text-center max-w-2xl mx-auto mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className="inline-block px-4 py-1.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-sm font-medium mb-6">
                            Testimonianze
                        </span>
                        <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
                            Cosa Dicono i <span className="bg-gradient-to-r from-fuchsia-400 to-violet-400 bg-clip-text text-transparent">Nostri Clienti</span>
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                quote: "Da quando abbiamo attivato Vocalis, non perdiamo più nessuna chiamata fuori orario. L'assistente gestisce le urgenze e ci invia report dettagliati ogni mattina.",
                                author: "Marco B.",
                                role: "Titolare, Studio Legale",
                                avatar: "MB"
                            },
                            {
                                quote: "I pazienti apprezzano la possibilità di prenotare appuntamenti a qualsiasi ora. Il sistema si integra perfettamente con la nostra agenda e riduce il carico sulla segreteria.",
                                author: "Dr.ssa Laura T.",
                                role: "Direttrice, Clinica Medica",
                                avatar: "LT"
                            },
                            {
                                quote: "L'installazione on-premise era fondamentale per noi. I dati dei clienti non escono mai dalla nostra infrastruttura e rispettiamo tutti i requisiti di compliance.",
                                author: "Giuseppe R.",
                                role: "IT Manager, Azienda Manifatturiera",
                                avatar: "GR"
                            }
                        ].map((testimonial, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <GlassCard className="p-6 h-full flex flex-col">
                                    <div className="flex-1">
                                        <div className="flex gap-1 mb-4">
                                            {[...Array(5)].map((_, j) => (
                                                <svg key={j} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                        <p className="text-slate-300 leading-relaxed mb-6">"{testimonial.quote}"</p>
                                    </div>
                                    <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-sm font-semibold">
                                            {testimonial.avatar}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium text-sm">{testimonial.author}</p>
                                            <p className="text-slate-500 text-xs">{testimonial.role}</p>
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ))}
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
                            Prezzi
                        </span>
                        <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
                            Piani Trasparenti
                        </h2>
                        <p className="text-slate-400 text-lg">
                            Prezzi in Euro, fatturazione italiana, nessun costo nascosto.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {[
                            {
                                name: "Business",
                                price: "€299",
                                period: "/mese",
                                description: "PMI e studi professionali",
                                features: [
                                    "500 minuti di conversazione/mese",
                                    "1 numero telefonico italiano",
                                    "Fino a 10 interni",
                                    "Dashboard e trascrizioni",
                                    "Supporto via email"
                                ],
                                popular: false
                            },
                            {
                                name: "Professional",
                                price: "€799",
                                period: "/mese",
                                description: "Aziende in crescita",
                                features: [
                                    "2.000 minuti di conversazione/mese",
                                    "5 numeri telefonici italiani",
                                    "Fino a 50 interni",
                                    "Integrazione BYOC",
                                    "Analytics avanzati",
                                    "Supporto prioritario"
                                ],
                                popular: true
                            },
                            {
                                name: "Enterprise",
                                price: "Su misura",
                                period: "",
                                description: "On-premise e grandi volumi",
                                features: [
                                    "Minuti illimitati",
                                    "Numeri illimitati",
                                    "Interni illimitati",
                                    "Installazione on-premise",
                                    "SLA garantito 99.9%",
                                    "Account manager dedicato",
                                    "Integrazione CRM/ERP"
                                ],
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
                                        {plan.period && <span className="text-slate-500">{plan.period}</span>}
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
                                        onClick={openDemoModal}
                                    >
                                        {plan.name === "Enterprise" ? "Contattaci" : "Inizia Ora"}
                                    </MagneticButton>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>

                    <p className="text-center text-slate-500 text-sm mt-8">
                        Tutti i piani includono: configurazione iniziale gratuita, formazione, aggiornamenti automatici.
                        <br />
                        I minuti si riferiscono al tempo effettivo di conversazione AI.
                    </p>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-24 relative">
                <div className="container mx-auto px-6">
                    <motion.div
                        className="text-center max-w-2xl mx-auto mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-6">
                            FAQ
                        </span>
                        <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
                            Domande Frequenti
                        </h2>
                        <p className="text-slate-400 text-lg">
                            Tutto quello che devi sapere su Vocalis
                        </p>
                    </motion.div>

                    <div className="max-w-3xl mx-auto">
                        <GlassCard className="p-6 lg:p-8" hover={false}>
                            {faqs.map((faq, i) => (
                                <FAQItem
                                    key={i}
                                    question={faq.question}
                                    answer={faq.answer}
                                    isOpen={openFAQ === i}
                                    onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                                />
                            ))}
                        </GlassCard>
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
                                    Richiedi una demo gratuita e scopri come Vocalis può trasformare la gestione delle tue chiamate.
                                </p>

                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <MagneticButton className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base" variant="primary" onClick={openDemoModal}>
                                        <span className="flex items-center justify-center gap-2">
                                            Richiedi Demo Gratuita <Sparkles className="w-5 h-5" />
                                        </span>
                                    </MagneticButton>
                                    <a href="tel:+390220527810" className="w-full sm:w-auto">
                                        <MagneticButton className="w-full px-8 py-4 rounded-2xl text-base" variant="secondary">
                                            <span className="flex items-center justify-center gap-2">
                                                <Phone className="w-5 h-5" /> Chiamaci
                                            </span>
                                        </MagneticButton>
                                    </a>
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
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                                    <Phone className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-bold text-white">Vocalis</span>
                            </Link>
                            <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                                Assistente vocale AI per aziende italiane.<br />
                                Sviluppato da Comtel Italia.
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <Shield className="w-3.5 h-3.5" />
                                    <span>GDPR</span>
                                </div>
                            </div>
                        </div>

                        {/* Links */}
                        <div>
                            <h4 className="font-semibold text-white mb-4">Prodotto</h4>
                            <ul className="space-y-3 text-slate-500 text-sm">
                                <li><a href="#come-funziona" className="hover:text-white transition-colors">Come Funziona</a></li>
                                <li><a href="#features" className="hover:text-white transition-colors">Funzionalità</a></li>
                                <li><a href="#pricing" className="hover:text-white transition-colors">Prezzi</a></li>
                                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Azienda</h4>
                            <ul className="space-y-3 text-slate-500 text-sm">
                                <li><a href="https://www.comtelitalia.it" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Comtel Italia</a></li>
                                <li><a href="https://www.comtelitalia.it/chi-siamo" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Chi Siamo</a></li>
                                <li><a href="https://www.comtelitalia.it/contatti" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Contatti</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Contatti</h4>
                            <ul className="space-y-3 text-slate-500 text-sm">
                                <li>Via Vittor Pisani, 10</li>
                                <li>20124 Milano, Italia</li>
                                <li><a href="tel:+390220527810" className="text-white font-medium hover:text-violet-400 transition-colors">+39 02 2052781</a></li>
                                <li><a href="mailto:info@comtelitalia.it" className="hover:text-white transition-colors">info@comtelitalia.it</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-white/5">
                        <p className="text-slate-600 text-sm">
                            © 2025 Vocalis - Comtel Italia S.r.l. Tutti i diritti riservati. P.IVA 12345678901
                        </p>
                        <div className="flex gap-6 text-sm text-slate-500">
                            <a href="https://www.comtelitalia.it/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Privacy Policy</a>
                            <a href="https://www.comtelitalia.it/cookie-policy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Cookie Policy</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
