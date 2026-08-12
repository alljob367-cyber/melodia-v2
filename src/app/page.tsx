"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music,
  Mic,
  Image,
  Video,
  Sparkles,
  ChevronDown,
  Check,
  Zap,
  Crown,
  Star,
  Play,
  ArrowRight,
  Globe,
  Brain,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";

// ===== ANIMATION VARIANTS =====
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

// ===== HERO SECTION =====
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2e1065] via-[#1a0a3e] to-[#0B0B14]" />
      {/* Radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-purple-600/10 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-pink-500/8 blur-[100px]" />
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-8">
          {/* Badge */}
          <motion.div variants={fadeUp} className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-purple-300">
              <Sparkles className="w-4 h-4" />
              <span>Propulsé par l&apos;Intelligence Artificielle</span>
            </div>
          </motion.div>

          {/* Main heading */}
          <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            <span className="block text-white">CRÉE TA MUSIQUE</span>
            <span className="block gradient-text mt-2">AVEC L&apos;IA</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p variants={fadeUp} className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-300 leading-relaxed">
            Générez des chansons complètes, des pochettes et des clips vidéo en quelques clics.
            <span className="text-purple-400 font-semibold"> Le premier studio musical IA d&apos;Afrique.</span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button className="btn-gradient text-white font-bold text-lg px-8 py-6 rounded-xl hover:scale-105 transition-transform shadow-lg shadow-purple-500/25">
                Commencer gratuitement
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/5 font-semibold text-lg px-8 py-6 rounded-xl">
                <Play className="w-5 h-5 mr-2" />
                Voir la démo
              </Button>
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-6 pt-4">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="flex -space-x-2">
                {[0,1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0B0B14] bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs text-white font-bold">
                    {['JP','AK','MF','SN'][i]}
                  </div>
                ))}
              </div>
              <span>2 000+ créateurs</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-1 text-sm text-amber-400">
              {[0,1,2,3,4].map(i => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
              <span className="text-slate-400 ml-1">4.9/5</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <ChevronDown className="w-6 h-6 text-white/30" />
      </motion.div>
    </section>
  );
}

// ===== HOW IT WORKS =====
function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Choisis ton style",
      description: "Sélectionne parmi 10+ styles musicaux africains : Afrobeat, Amapiano, Afropop, Makossa, Bikutsi et plus.",
      icon: Music,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      number: "02",
      title: "Décris ta vision",
      description: "Indique le thème, l'ambiance et le message de ta chanson. L'IA s'occupe du reste.",
      icon: Brain,
      color: "text-pink-400",
      bg: "bg-pink-500/10",
    },
    {
      number: "03",
      title: "L'IA crée pour toi",
      description: "En 30 secondes, obtiens une chanson complète avec paroles, audio, pochette et clip vidéo.",
      icon: Sparkles,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 sm:py-32 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-purple-600/5 blur-[150px]" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}>
          <motion.div variants={fadeUp} className="text-center mb-16">
            <span className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Comment ça marche</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-3">
              3 étapes pour ta <span className="gradient-text">musique</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div key={i} variants={fadeUp} className="relative">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 right-0 translate-x-1/2 w-8 h-px bg-gradient-to-r from-white/10 to-transparent" />
                )}
                <Card className="glass p-8 text-center hover:border-purple-500/20 transition-all duration-300 group">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${step.bg} mb-6 group-hover:scale-110 transition-transform`}>
                    <step.icon className={`w-7 h-7 ${step.color}`} />
                  </div>
                  <span className="text-xs font-bold text-purple-400 tracking-widest">{step.number}</span>
                  <h3 className="text-xl font-bold text-white mt-2 mb-3">{step.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{step.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ===== FEATURES SECTION =====
function FeaturesSection() {
  const features = [
    {
      icon: Music,
      title: "Music Studio",
      description: "Génère des chansons complètes avec paroles, mélodie, harmonies et arrangement en un clic.",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
    {
      icon: Mic,
      title: "Voice Studio",
      description: "Voix IA réaliste avec chant en français, anglais et langues africaines. Ton style, ta voix.",
      color: "text-pink-400",
      bg: "bg-pink-500/10",
      border: "border-pink-500/20",
    },
    {
      icon: Image,
      title: "Cover Studio",
      description: "Pochettes d'album professionnelles générées par IA. Style afro-futuriste, urbain ou traditionnel.",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      icon: Video,
      title: "Video Studio",
      description: "Clips vidéo courts avec visuels IA synchronisés à ta musique. Parfait pour TikTok & Instagram.",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
  ];

  return (
    <section className="py-24 sm:py-32 relative">
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-pink-500/5 blur-[120px]" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}>
          <motion.div variants={fadeUp} className="text-center mb-16">
            <span className="text-sm font-semibold text-pink-400 uppercase tracking-wider">Fonctionnalités</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-3">
              4 studios <span className="gradient-text">créatifs</span>
            </h2>
            <p className="text-slate-400 mt-4 max-w-xl mx-auto">
              Tout ce dont tu as besoin pour créer de la musique professionnelle, de l&apos;idée au partage.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className={`glass p-8 hover:border-purple-500/30 transition-all duration-300 group h-full ${feature.border}`}>
                  <div className="flex items-start gap-5">
                    <div className={`flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl ${feature.bg} group-hover:scale-110 transition-transform`}>
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                      <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Extra features list */}
          <motion.div variants={fadeUp} className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Globe, text: "10+ styles africains" },
              { icon: Volume2, text: "Audio HD 320kbps" },
              { icon: Zap, text: "Génération en 30s" },
              { icon: Crown, text: "Modèles IA premium" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-300 glass rounded-xl px-4 py-3">
                <item.icon className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ===== PRICING SECTION =====
function PricingSection() {
  const plans = [
    {
      name: "BASIC",
      price: "2 000",
      period: "/mois",
      description: "Pour découvrir la création musicale IA",
      features: [
        { text: "2 chansons IA / mois", included: true },
        { text: "2 pochettes IA / mois", included: true },
        { text: "Audio standard (128 kbps)", included: true },
        { text: "Jusqu'à 3 min par chanson", included: true },
        { text: "Téléchargement MP3", included: true },
        { text: "Partage sur réseaux", included: true },
        { text: "Voix IA", included: false },
        { text: "Clips vidéo IA", included: false },
        { text: "Générations parallèles", included: false },
      ],
      popular: false,
      cta: "Commencer avec BASIC",
    },
    {
      name: "PRO",
      price: "5 000",
      period: "/mois",
      description: "Pour les créateurs sérieux",
      features: [
        { text: "20 chansons IA / mois", included: true },
        { text: "20 pochettes IA / mois", included: true },
        { text: "Haute qualité (320 kbps)", included: true },
        { text: "Jusqu'à 6 min par chanson", included: true },
        { text: "Téléchargement MP3 + WAV", included: true },
        { text: "Partage sur réseaux", included: true },
        { text: "Voix & chant IA", included: true },
        { text: "Clips vidéo courts inclus", included: true },
        { text: "3 générations parallèles", included: true },
      ],
      popular: true,
      cta: "Passer à PRO",
    },
    {
      name: "STUDIO",
      price: "10 000+",
      period: "/mois",
      description: "Pour les pros et labels",
      features: [
        { text: "Production avancée illimitée", included: true },
        { text: "Pochettes premium illimitées", included: true },
        { text: "Haute qualité (320 kbps)", included: true },
        { text: "Jusqu'à 10 min par chanson", included: true },
        { text: "Tous formats audio", included: true },
        { text: "Partage + pages cadeaux", included: true },
        { text: "Voix IA premium", included: true },
        { text: "Studio vidéo complet", included: true },
        { text: "Modèles IA exclusifs", included: true },
      ],
      popular: false,
      cta: "Contacter l'équipe",
    },
  ];

  return (
    <section id="pricing" className="py-24 sm:py-32 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-purple-600/5 blur-[150px]" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}>
          <motion.div variants={fadeUp} className="text-center mb-16">
            <span className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Tarifs</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-3">
              Choisis ton <span className="gradient-text">pack</span>
            </h2>
            <p className="text-slate-400 mt-4 max-w-xl mx-auto">
              Des prix en FCFA, pensés pour les créateurs d&apos;Afrique. Pas de carte bancaire requise pour essayer.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className={`relative glass p-8 h-full flex flex-col ${plan.popular ? 'border-purple-500/30 ring-1 ring-purple-500/20' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-purple-600 to-pink-500 text-white">
                        Le plus populaire
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className={`text-lg font-bold ${plan.popular ? 'text-purple-400' : 'text-white'}`}>
                      PACK {plan.name}
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">{plan.description}</p>
                  </div>

                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-amber-400">{plan.price}</span>
                    <span className="text-slate-400 text-sm ml-1">FCFA{plan.period}</span>
                  </div>

                  <div className="flex-1 space-y-3 mb-8">
                    {plan.features.map((feature, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${feature.included ? 'bg-emerald-500/10' : 'bg-white/5'}`}>
                          <Check className={`w-3 h-3 ${feature.included ? 'text-emerald-400' : 'text-slate-600'}`} />
                        </div>
                        <span className={`text-sm ${feature.included ? 'text-slate-300' : 'text-slate-500 line-through'}`}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Link href="/signup" className="block">
                    <Button
                      className={`w-full py-5 rounded-xl font-bold text-sm ${
                        plan.popular
                          ? 'btn-gradient text-white shadow-lg shadow-purple-500/25 hover:scale-[1.02] transition-transform'
                          : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Launch offer */}
          <motion.div variants={fadeUp} className="mt-8">
            <Card className="glass p-6 text-center">
              <span className="text-2xl mr-2">🎉</span>
              <span className="text-white font-semibold">Offre de lancement</span>
              <span className="text-slate-400 mx-2">—</span>
              <span className="text-slate-300">Premier mois à <span className="line-through text-slate-500">5 000 FCFA</span> <span className="text-amber-400 font-bold">4 000 FCFA</span></span>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ===== FAQ SECTION =====
function FAQSection() {
  const faqs = [
    {
      q: "Comment fonctionne la génération de musique ?",
      a: "Notre IA analyse vos préférences de style, thème et ambiance, puis génère une chanson complète avec paroles, mélodie, harmonies et arrangement en moins de 30 secondes.",
    },
    {
      q: "Quels styles musicaux sont disponibles ?",
      a: "Nous proposons 10+ styles africains : Afrobeat, Afropop, Amapiano, Afro-R&B, Makossa, Bikutsi, Zouk, Gospel, Rap africain, Highlife et plus. De nouveaux styles sont ajoutés régulièrement.",
    },
    {
      q: "Puis-je utiliser les chansons commercialement ?",
      a: "Oui ! Toutes les chansons générées avec les plans PRO et STUDIO peuvent être utilisées commercialement. Le plan BASIC est réservé à un usage personnel.",
    },
    {
      q: "Comment fonctionne le système de crédits ?",
      a: "Chaque plan vous donne un nombre de crédits mensuels pour créer des chansons et pochettes. Les crédits se renouvellent chaque mois. Les crédits non utilisés ne sont pas reportés.",
    },
    {
      q: "Quels moyens de paiement acceptez-vous ?",
      a: "Nous acceptons Mobile Money (MTN, Orange, Wave), cartes bancaires, et PayPal. Tous les paiements sont en FCFA et 100% sécurisés.",
    },
    {
      q: "Puis-je annuler mon abonnement à tout moment ?",
      a: "Absolument. Vous pouvez annuler votre abonnement à tout moment depuis les paramètres. Vous conservez l'accès jusqu'à la fin de la période payée.",
    },
  ];

  return (
    <section className="py-24 sm:py-32 relative">
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}>
          <motion.div variants={fadeUp} className="text-center mb-16">
            <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">FAQ</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3">
              Questions <span className="gradient-text">fréquentes</span>
            </h2>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="glass rounded-xl px-6 border-none data-[state=open]:border-purple-500/20 data-[state=open]:bg-purple-500/5 transition-colors"
                >
                  <AccordionTrigger className="text-left text-white font-semibold hover:no-underline py-5">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-400 leading-relaxed pb-5">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ===== FINAL CTA SECTION =====
function FinalCTASection() {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B14] via-[#1a0a3e] to-[#0B0B14]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-purple-600/10 blur-[120px]" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp} className="space-y-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              Prêt à créer ta <span className="gradient-text">prochaine chanson</span> ?
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Rejoins des milliers de créateurs qui utilisent MELODIA pour donner vie à leur musique. Aucune carte requise pour commencer.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/signup">
                <Button className="btn-gradient text-white font-bold text-lg px-10 py-6 rounded-xl hover:scale-105 transition-transform shadow-lg shadow-purple-500/25">
                  Créer ma première chanson
                  <Sparkles className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-slate-500">
              🔒 Paiement 100% sécurisé · Annulation à tout moment
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ===== FOOTER =====
function Footer() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center">
                <Music className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-extrabold text-white tracking-wider">MELODIA</span>
            </div>
            <p className="text-sm text-slate-500">L&apos;IA qui crée ta musique. Made in Africa 🌍</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Produit</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Comment ça marche</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Tarifs</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Styles musicaux</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-white transition-colors">Centre d&apos;aide</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Communauté</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Légal</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-white transition-colors">CGU</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Confidentialité</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Licences</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">© 2026 MELODIA. Tous droits réservés.</p>
          <p className="text-sm text-slate-500">Fait avec 💜 en Afrique</p>
        </div>
      </div>
    </footer>
  );
}

// ===== MAIN LANDING PAGE =====
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B0B14]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center">
              <Music className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-extrabold text-white tracking-wider">MELODIA</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors">Comment ça marche</a>
            <a href="#pricing" className="text-sm text-slate-400 hover:text-white transition-colors">Tarifs</a>
            <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-sm text-slate-400 hover:text-white">
                Connexion
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="btn-gradient text-white text-sm font-semibold rounded-lg px-5">
                S&apos;inscrire
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Page sections */}
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <PricingSection />
      <FAQSection />
      <FinalCTASection />
      <Footer />
    </div>
  );
}
