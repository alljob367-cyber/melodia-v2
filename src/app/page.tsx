"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Music,
  Mic,
  Image as ImageIcon,
  Video,
  Sparkles,
  ChevronDown,
  Check,
  X,
  Crown,
  Star,
  Play,
  ArrowRight,
  Shield,
  Headphones,
  Cloud,
  Share2,
  MessageCircle,
  FileText,
  Palette,
  Download,
  SkipBack,
  SkipForward,
  Volume2,
  Music2,
  Facebook,
  Instagram,
  Youtube,
  Globe,
  LogIn,
  Wand2,
  Mail,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// ===== ANIMATION VARIANTS =====
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

// ===== HEADER =====
function Header() {
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState("FR");
  const [loginOpen, setLoginOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#accueil" className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Music2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-white font-bold text-lg tracking-wide">MELODIA</span>
              <span className="text-[10px] text-purple-400 font-medium tracking-wider uppercase">UP TO AFRICA</span>
            </div>
          </a>

          {/* Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            <a href="#accueil" className="text-sm text-zinc-400 hover:text-white transition-colors">Accueil</a>
            <a href="#fonctionnalites" className="text-sm text-zinc-400 hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#tarifs" className="text-sm text-zinc-400 hover:text-white transition-colors">Tarifs</a>
            <a href="#a-propos" className="text-sm text-zinc-400 hover:text-white transition-colors">À propos</a>
            <a href="#faq" className="text-sm text-zinc-400 hover:text-white transition-colors">FAQ</a>
            <a href="#blog" className="text-sm text-zinc-400 hover:text-white transition-colors">Blog</a>
          </nav>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 text-sm text-zinc-400 border border-white/10 rounded-lg px-3 py-1.5 hover:border-white/20 hover:text-white transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{lang}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${langOpen ? "rotate-180" : ""}`} />
              </button>
              {langOpen && (
                <div className="absolute top-full right-0 mt-2 bg-[#12121a] border border-white/10 rounded-xl overflow-hidden shadow-xl z-50 min-w-[120px]">
                  {[
                    { code: "FR", label: "Français" },
                    { code: "EN", label: "English" },
                    { code: "AR", label: "العربية" },
                  ].map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setLangOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors ${lang === l.code ? "text-purple-400 bg-purple-500/5" : "text-zinc-400"}`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Se connecter */}
            <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="hidden sm:inline-flex border-white/10 text-zinc-300 hover:text-white hover:border-white/20 text-sm gap-2">
                  <LogIn className="w-4 h-4" />
                  Se connecter
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#12121a] border border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-white text-xl">Se connecter</DialogTitle>
                  <DialogDescription className="text-zinc-400">Accédez à ton compte Melodia</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300 flex items-center gap-2"><Mail className="w-4 h-4" /> Email</label>
                    <Input placeholder="ton@email.com" className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300 flex items-center gap-2"><Lock className="w-4 h-4" /> Mot de passe</label>
                    <Input type="password" placeholder="••••••••" className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600" />
                  </div>
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white py-5 rounded-xl border-0">
                    Se connecter
                  </Button>
                  <p className="text-center text-xs text-zinc-500">Pas encore de compte ? <span className="text-purple-400 cursor-pointer hover:underline">Créer un compte</span></p>
                </div>
              </DialogContent>
            </Dialog>

            {/* Créer ma chanson */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white text-sm border-0 shadow-lg shadow-purple-500/25 gap-2">
                  <Wand2 className="w-4 h-4" />
                  Créer ma chanson
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#12121a] border border-white/10 text-white sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-white text-xl flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-purple-400" />
                    Créer ma chanson
                  </DialogTitle>
                  <DialogDescription className="text-zinc-400">Décris ton idée et laisse l&apos;IA faire la magie</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">Décris ta chanson</label>
                    <textarea
                      placeholder="Ex: Une chanson afrobeat joyeuse sur l'amour et la danse..."
                      className="w-full h-24 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-600 p-3 text-sm resize-none focus:border-purple-500/50 focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">Style musical</label>
                    <div className="flex flex-wrap gap-2">
                      {["Afrobeats", "Amapiano", "Afropop", "Rap", "R&B", "Gospel", "Coupe Decale", "Ndombolo"].map((style) => (
                        <span key={style} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 hover:border-purple-500/30 hover:text-white cursor-pointer transition-colors">
                          {style}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white py-5 rounded-xl border-0 gap-2">
                    <Sparkles className="w-4 h-4" />
                    Générer ma chanson
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </header>
  );
}

// ===== HERO SECTION =====
function HeroSection() {
  return (
    <section id="accueil" className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0a0f]" />
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] rounded-full bg-purple-600/15 blur-[150px]" />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-pink-500/10 blur-[120px]" />
      <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] rounded-full bg-cyan-500/8 blur-[100px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-8">
            {/* Badge */}
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
              <span className="bg-pink-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">NOUVEAU</span>
              <span className="text-sm text-zinc-300">L&apos;IA qui comprend la vibe</span>
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Crée ta musique{" "}
              <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 bg-clip-text text-transparent">
                avec l&apos;IA
              </span>
              .
            </motion.h1>

            {/* Subheadline */}
            <motion.p variants={fadeUp} className="text-lg text-zinc-400 max-w-lg leading-relaxed">
              Décris ton idée, choisis ton style. Melodia crée ta chanson avec voix, pochette et plus encore.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <a href="#tarifs">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white text-base px-8 py-6 border-0 shadow-lg shadow-purple-500/25 rounded-xl">
                  ✨ Créer ma chanson
                </Button>
              </a>
              <a href="#fonctionnalites">
                <Button variant="outline" className="border-white/15 text-zinc-300 hover:text-white hover:border-white/25 text-base px-8 py-6 rounded-xl">
                  ▶ Découvrir Melodia
                </Button>
              </a>
            </motion.div>

            {/* Social Proof */}
            <motion.div variants={fadeUp} className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["E", "A", "S", "K"].map((initial, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-[#0a0a0f] flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: `hsl(${280 + i * 30}, 70%, 55%)` }}
                  >
                    {initial}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-xs sm:text-sm text-zinc-400">Déjà adopté par des milliers de créateurs en Afrique</span>
            </motion.div>
          </motion.div>

          {/* Right Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            {/* Glow behind mockup */}
            <div className="absolute -inset-10 bg-purple-500/10 blur-[80px] rounded-full" />
            <div className="absolute -inset-6 bg-pink-500/5 blur-[60px] rounded-full" />

            <div className="relative bg-[#12121a] rounded-2xl border border-white/8 shadow-2xl overflow-hidden" style={{ perspective: "1000px" }}>
              {/* Album Art */}
              <div className="relative h-48 overflow-hidden rounded-t-2xl">
                <img src="/images/album-art.png" alt="Album cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#12121a] via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <p className="text-white text-xl font-bold">MON RÊVE</p>
                  <p className="text-purple-300 text-sm font-medium">AFROPOP</p>
                </div>
              </div>

              {/* Checklist */}
              <div className="p-4 space-y-3">
                <p className="text-white font-semibold text-sm">Ta chanson est prête !</p>
                {[
                  "Paroles générées",
                  "Musique créée",
                  "Pochette générée",
                  "Mix & Master IA",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-purple-400" />
                    </div>
                    <span className="text-sm text-zinc-300">{item}</span>
                    <ArrowRight className="w-3 h-3 text-zinc-600 ml-auto" />
                  </div>
                ))}
              </div>

              {/* Audio Player */}
              <div className="border-t border-white/5 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs text-zinc-500">2:24</span>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-[65%] bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
                  </div>
                  <span className="text-xs text-zinc-500">3:45</span>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <SkipBack className="w-4 h-4 text-zinc-400 cursor-pointer hover:text-white transition-colors" />
                  <button className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                  </button>
                  <SkipForward className="w-4 h-4 text-zinc-400 cursor-pointer hover:text-white transition-colors" />
                  <Download className="w-4 h-4 text-zinc-400 cursor-pointer hover:text-white transition-colors" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ===== FEATURE BANNER =====
function FeatureBanner() {
  const features = [
    { icon: Shield, title: "Paiements sécurisés", subtitle: "100% sécurisés" },
    { icon: Headphones, title: "IA de nouvelle génération", subtitle: "Résultats premium" },
    { icon: Cloud, title: "Stockage cloud", subtitle: "Accéder partout" },
    { icon: Share2, title: "Partage facile", subtitle: "Partout dans le monde" },
  ];

  return (
    <section id="fonctionnalites" className="relative bg-[#0a0a0f] border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                <feat.icon className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{feat.title}</p>
                <p className="text-zinc-500 text-xs">{feat.subtitle}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== HOW IT WORKS =====
function HowItWorks() {
  const steps = [
    { icon: Music, title: "Décris ton idée", desc: "Choisis un style, une ambiance et décris ta chanson." },
    { icon: Sparkles, title: "L'IA crée la musique et tes paroles", desc: "Mélodie composée, écrit et arrange ton morceau." },
    { icon: ImageIcon, title: "Pochette générée automatiquement", desc: "Une pochette unique créée par l'IA." },
    { icon: Play, title: "Écoute & télécharge", desc: "Écoute instantanément et télécharge ton morceau." },
    { icon: Share2, title: "Partage la musique", desc: "Partage ta création avec tes fans partout." },
  ];

  return (
    <section className="relative bg-[#0a0a0f] py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16 scroll-mt-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Comment <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">ça marche</span> ?
          </h2>
        </motion.div>

        <div className="relative">
          {/* Dotted connector line */}
          <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] border-t-2 border-dashed border-white/10" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center relative"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-sm mb-4 relative z-10 shadow-lg shadow-purple-500/30">
                  {i + 1}
                </div>
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                  <step.icon className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-white font-semibold text-sm mb-2">{step.title}</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== FEATURES GRID =====
function FeaturesGrid() {
  const features = [
    { icon: Music, title: "Music Studio", desc: "Crée des chansons uniques dans tous les styles africains et internationaux.", color: "from-pink-500 to-rose-500" },
    { icon: Mic, title: "Voice Studio", desc: "Génère des voix réalistes et ajoute du chant à tes morceaux.", color: "from-blue-500 to-cyan-500" },
    { icon: ImageIcon, title: "Cover Studio", desc: "Obtiens des pochettes professionnelles créées par l'IA.", color: "from-emerald-500 to-green-500" },
    { icon: Video, title: "Video Studio", desc: "Transforme ta musique en clips vidéo avec l'IA (Pro & Studio).", color: "from-red-500 to-orange-500" },
    { icon: MessageCircle, title: "Assistant Melodia", desc: "Ton copilote créatif pour t'aider à créer plus vite et mieux.", color: "from-purple-500 to-violet-500" },
  ];

  return (
    <section id="a-propos" className="relative bg-[#0a0a0f] py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16 scroll-mt-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Tout ce qu&apos;il te faut pour créer <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">sans limites</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {features.map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-[#12121a] border border-white/6 hover:border-purple-500/30 transition-all duration-300 rounded-2xl p-6 h-full group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feat.color} flex items-center justify-center mb-4 opacity-80 group-hover:opacity-100 transition-opacity`}>
                  <feat.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{feat.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{feat.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== PRICING =====
function Pricing() {
  const [annual, setAnnual] = useState(true);

  // Prix mensuels de base
  const monthlyPrices: Record<string, number> = {
    Basic: 2000,
    Pro: 5000,
    Studio: 10000,
  };

  const formatPrice = (name: string) => {
    const base = monthlyPrices[name];
    const finalPrice = annual ? Math.round(base * 0.8) : base;
    if (name === "Studio") return `${finalPrice.toLocaleString("fr-FR")}+`;
    return finalPrice.toLocaleString("fr-FR");
  };

  const plans = [
    {
      name: "Basic",
      badge: "IDÉAL POUR DÉBUTER",
      badgeColor: "bg-zinc-700 text-zinc-300",
      features: [
        { text: "2 chansons IA", included: true },
        { text: "2 pochettes IA", included: true },
        { text: "Paroles assistées", included: true },
        { text: "Écoute & téléchargement", included: true },
        { text: "Partage", included: true },
        { text: "Stockage limité", included: true },
        { text: "Pas de vidéo", included: false },
      ],
      button: "Commencer avec Basic",
      buttonStyle: "bg-purple-600 hover:bg-purple-700 text-white",
      featured: false,
    },
    {
      name: "Pro",
      badge: "LE PLUS POPULAIRE",
      badgeColor: "bg-pink-500 text-white",
      features: [
        { text: "Plus de chansons IA", included: true },
        { text: "Plus de pochettes IA", included: true },
        { text: "Haute qualité audio", included: true },
        { text: "Voice Studio", included: true },
        { text: "Clips vidéo courts", included: true },
        { text: "Téléchargements illimités", included: true },
        { text: "Support prioritaire", included: true },
      ],
      button: "Passer à Pro",
      buttonStyle: "bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white",
      featured: true,
    },
    {
      name: "Studio",
      badge: "POUR LES PROFESSIONNELS",
      badgeColor: "bg-orange-600 text-white",
      features: [
        { text: "Tout dans Pro", included: true },
        { text: "Video Studio avancé", included: true },
        { text: "Clips vidéo longs", included: true },
        { text: "Outils professionnels", included: true },
        { text: "Modèles premium", included: true },
        { text: "Stockage étendu", included: true },
        { text: "Support VIP", included: true },
      ],
      button: "Passer à Studio",
      buttonStyle: "bg-purple-600 hover:bg-purple-700 text-white",
      featured: false,
    },
  ];

  return (
    <section id="tarifs" className="relative bg-[#0a0a0f] py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12 scroll-mt-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Choisis <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">ton plan</span>
          </h2>
        </motion.div>

        {/* Toggle */}
        <div className="flex items-center justify-center mb-12">
          <div className="bg-white/5 rounded-full p-1 flex items-center gap-1 border border-white/10">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${!annual ? "bg-purple-600 text-white" : "text-zinc-400 hover:text-white"}`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${annual ? "bg-purple-600 text-white" : "text-zinc-400 hover:text-white"}`}
            >
              Annuel <span className="text-pink-400 text-xs">(-20%)</span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative ${plan.featured ? "lg:-mt-4 lg:mb-4" : ""}`}
            >
              {plan.featured && (
                <div className="absolute -top-3 right-4 z-10">
                  <Crown className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                </div>
              )}
              <Card className={`bg-[#12121a] border rounded-2xl p-6 lg:p-8 transition-all duration-300 ${
                plan.featured
                  ? "border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.3)] scale-[1.02]"
                  : "border-white/6 hover:border-white/10"
              }`}>
                <div className="space-y-4">
                  <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${plan.badgeColor}`}>
                    {plan.badge}
                  </span>
                  <h3 className="text-white text-xl font-bold">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-white text-4xl font-bold">{formatPrice(plan.name)}</span>
                    <span className="text-zinc-400 text-sm">FCFA</span>
                    <span className="text-zinc-500 text-sm">/mois</span>
                  </div>
                  <div className="space-y-3 pt-2">
                    {plan.features.map((feat, j) => (
                      <div key={j} className="flex items-center gap-2">
                        {feat.included ? (
                          <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-purple-400" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                            <X className="w-3 h-3 text-zinc-600" />
                          </div>
                        )}
                        <span className={`text-sm ${feat.included ? "text-zinc-300" : "text-zinc-600"}`}>{feat.text}</span>
                      </div>
                    ))}
                  </div>
                  <Button className={`w-full mt-4 py-5 rounded-xl border-0 shadow-lg ${plan.buttonStyle}`}>
                    {plan.button}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== TESTIMONIALS =====
function Testimonials() {
  const testimonials = [
    {
      quote: "Melodia m'a permis de sortir mon premier single sans studio. C'est une révolution !",
      name: "Eryam",
      role: "Artiste Afrobeats",
      initial: "E",
      color: "from-pink-500 to-purple-500",
    },
    {
      quote: "Les pochettes sont incroyables et les clips courts m'aident à promouvoir ma musique.",
      name: "Aïcha",
      role: "Créatrice de contenu",
      initial: "A",
      color: "from-purple-500 to-blue-500",
    },
    {
      quote: "Le plan Studio est un vrai studio de poche. Je produit tout avec Melodia maintenant !",
      name: "Samy",
      role: "Producteur",
      initial: "S",
      color: "from-emerald-500 to-cyan-500",
    },
  ];

  return (
    <section id="blog" className="relative bg-[#0a0a0f] py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16 scroll-mt-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ils créent avec <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Melodia</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-[#12121a] border border-white/6 rounded-2xl p-6 h-full">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${t.color} flex items-center justify-center text-white font-bold text-sm`}>
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{t.name}</p>
                    <p className="text-zinc-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Pagination dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {[0, 1, 2, 3].map((d) => (
            <div key={d} className={`w-2 h-2 rounded-full ${d === 0 ? "bg-purple-500" : "bg-white/20"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== FAQ + CONTACT =====
function FAQSection() {
  const faqs = [
    {
      q: "Comment fonctionne Melodia ?",
      a: "Melodia utilise l'intelligence artificielle pour générer de la musique à partir de votre description. Vous décrivez votre idée, choisissez un style musical, et notre IA compose la mélodie, écrit les paroles, et produit un morceau complet avec pochette.",
    },
    {
      q: "Ai-je besoin d'expérience en musique ?",
      a: "Non, aucune expérience n'est requise ! Melodia est conçu pour les créateurs de tous niveaux. Décrivez simplement votre idée en langage naturel et l'IA s'occupe du reste.",
    },
    {
      q: "Puis-je utiliser ma musique à des fins commerciales ?",
      a: "Oui, avec les plans Pro et Studio, vous disposez d'une licence commerciale complète pour utiliser votre musique générée sur toutes les plateformes de streaming et réseaux sociaux.",
    },
    {
      q: "Quels sont les moyens de paiement acceptés ?",
      a: "Nous acceptons les cartes bancaires, Mobile Money (Orange Money, MTN Money, Wave), PayPal et les virements bancaires. Les paiements sont 100% sécurisés.",
    },
  ];

  return (
    <section id="faq" className="relative bg-[#0a0a0f] py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16 scroll-mt-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Questions <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">fréquentes</span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
          {/* FAQ */}
          <div className="lg:col-span-3">
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="bg-[#12121a] border border-white/6 rounded-xl px-6 data-[state=open]:border-purple-500/30 transition-colors"
                >
                  <AccordionTrigger className="text-white text-sm font-medium hover:no-underline py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-zinc-400 text-sm leading-relaxed pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Contact Box */}
          <div className="lg:col-span-2">
            <Card className="bg-[#12121a] border border-white/6 rounded-2xl p-8 flex flex-col items-center text-center h-full justify-center">
              <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mb-6 relative">
                <Headphones className="w-10 h-10 text-purple-400" />
                <div className="absolute inset-0 rounded-full bg-purple-500/10 blur-xl" />
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Tu as d&apos;autres questions ?</h3>
              <p className="text-zinc-400 text-sm mb-6">Notre équipe est là pour t&apos;aider.</p>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-5 rounded-xl border-0 shadow-lg shadow-purple-500/25">
                Nous contacter
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== BOTTOM CTA =====
function BottomCTA() {
  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img src="/images/concert-bg.png" alt="Concert" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-purple-900/80" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-transparent to-[#0a0a0f]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Prêt à créer le prochain <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">hit</span> ?
          </h2>
          <p className="text-zinc-300 text-lg mb-8 max-w-xl mx-auto">
            Rejoins des milliers de créateurs qui font déjà confiance à Melodia.
          </p>
          <a href="#tarifs">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white text-lg px-10 py-6 border-0 shadow-lg shadow-purple-500/30 rounded-xl">
              ✨ Créer ma chanson maintenant
            </Button>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

// ===== FOOTER =====
function Footer() {
  return (
    <footer className="bg-[#0a0a0f] border-t border-white/5 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Music2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-white font-bold text-lg tracking-wide">MELODIA</span>
                <span className="text-[10px] text-purple-400 font-medium tracking-wider uppercase">UP TO AFRICA</span>
              </div>
            </div>
            <p className="text-zinc-500 text-xs leading-relaxed mb-4">
              La plateforme africaine de création musicale et vidéo assistée par IA.
            </p>
            <div className="flex items-center gap-3">
              {[Facebook, Instagram, Music2, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Produit */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Produit</h4>
            <ul className="space-y-2">
              {["Fonctionnalités", "Tarifs", "Mises à jour", "API (bientôt)"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-zinc-500 text-xs hover:text-zinc-300 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Ressources</h4>
            <ul className="space-y-2">
              {["Blog", "FAQ", "Guides", "Contact"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-zinc-500 text-xs hover:text-zinc-300 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Légal</h4>
            <ul className="space-y-2">
              {["Conditions d'utilisation", "Politique de confidentialité", "Politique de remboursement"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-zinc-500 text-xs hover:text-zinc-300 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Télécharger l'app */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Télécharger l&apos;app</h4>
            <p className="text-zinc-500 text-xs mb-3">Bientôt disponible sur</p>
            <div className="space-y-2">
              {/* Google Play Badge */}
              <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 flex items-center gap-2">
                <Play className="w-4 h-4 text-white" />
                <div className="flex flex-col leading-none">
                  <span className="text-[8px] text-zinc-400">GET IT ON</span>
                  <span className="text-[10px] text-white font-medium">Google Play</span>
                </div>
              </div>
              {/* App Store Badge */}
              <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-white" />
                <div className="flex flex-col leading-none">
                  <span className="text-[8px] text-zinc-400">DOWNLOAD ON</span>
                  <span className="text-[10px] text-white font-medium">App Store</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/5 pt-6 text-center">
          <p className="text-zinc-600 text-xs">&copy; 2025 Melodia Up to Africa. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}

// ===== MAIN PAGE =====
export default function MelodiaLandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeatureBanner />
        <HowItWorks />
        <FeaturesGrid />
        <Pricing />
        <Testimonials />
        <FAQSection />
        <BottomCTA />
      </main>
      <Footer />
    </div>
  );
}
