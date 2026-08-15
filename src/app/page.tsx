"use client";

import { useState, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
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
  User,
  Eye,
  EyeOff,
  Loader2,
  PenTool,
  Layers,
  Clapperboard,
  Disc3,
  Radio,
  Users,
  Zap,
  Menu,
} from "lucide-react";
import { MobileMenu } from "@/components/mobile-nav";
import { Logo } from "@/components/logo";
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

// ===== HEADER =====
function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState("FR");
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup form state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Create song state
  const [songDesc, setSongDesc] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    setLoginLoading(true);
    try {
      const result = await signIn("credentials", {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      });
      if (result?.error) {
        toast.error("Email ou mot de passe incorrect");
      } else {
        toast.success("Connexion réussie ! 🎵");
        setLoginOpen(false);
        setTimeout(() => { window.location.href = "/dashboard"; }, 500);
      }
    } catch (error) {
      toast.error("Erreur de connexion");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    if (signupPassword.length < 6) {
      toast.error("Le mot de passe doit avoir au moins 6 caractères");
      return;
    }
    setSignupLoading(true);
    try {
      // Create account via API
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur lors de l'inscription");
        return;
      }
      // Auto sign in
      const result = await signIn("credentials", {
        email: signupEmail,
        password: signupPassword,
        redirect: false,
      });
      if (result?.ok) {
        toast.success("Bienvenue dans Melodia Up To Africa ! 🎵");
        setSignupOpen(false);
        setTimeout(() => { window.location.href = "/dashboard"; }, 500);
      } else {
        toast.success("Compte créé ! Connecte-toi maintenant.");
        setSignupOpen(false);
        setLoginOpen(true);
      }
    } catch (error) {
      toast.error("Erreur lors de l'inscription");
    } finally {
      setSignupLoading(false);
    }
  };

  const handleCreateSong = () => {
    if (session) {
      // User is logged in, go to dashboard/create
      setCreateOpen(false);
      router.push("/create");
    } else {
      // Not logged in, close create dialog and open signup
      setCreateOpen(false);
      setSignupOpen(true);
    }
  };

  const isLoggedIn = !!session;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#accueil" className="flex items-center gap-2 cursor-pointer">
            <Logo size="sm" showSubtitle link={false} />
          </a>

          {/* Nav Desktop */}
          <nav className="hidden lg:flex items-center gap-6">
            <a href="#accueil" className="text-sm text-zinc-400 hover:text-white transition-colors">Accueil</a>
            <a href="#pipeline" className="text-sm text-zinc-400 hover:text-white transition-colors">Pipeline</a>
            <a href="#fonctionnalites" className="text-sm text-zinc-400 hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#tarifs" className="text-sm text-zinc-400 hover:text-white transition-colors">Tarifs</a>
            <a href="#a-propos" className="text-sm text-zinc-400 hover:text-white transition-colors">À propos</a>
            <a href="#faq" className="text-sm text-zinc-400 hover:text-white transition-colors">FAQ</a>
          </nav>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Hamburger */}
            <MobileMenu isLoggedIn={isLoggedIn} userName={session?.user?.name ?? undefined} />
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

            {isLoggedIn ? (
              <>
                {/* Logged in: show user + dashboard */}
                <Button
                  variant="outline"
                  className="hidden sm:inline-flex border-white/10 text-zinc-300 hover:text-white hover:border-white/20 text-sm gap-2"
                  onClick={() => router.push("/dashboard")}
                >
                  <User className="w-4 h-4" />
                  {session?.user?.name || "Dashboard"}
                </Button>
                <Button
                  className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white text-sm border-0 shadow-lg shadow-purple-500/25 gap-2"
                  onClick={() => router.push("/create")}
                >
                  <Wand2 className="w-4 h-4" />
                  Créer ma chanson
                </Button>
              </>
            ) : (
              <>
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
                      <DialogDescription className="text-zinc-400">Accédez à ton compte Melodia Up To Africa</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleLogin} className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <label className="text-sm text-zinc-300 flex items-center gap-2"><Mail className="w-4 h-4" /> Email</label>
                        <Input
                          type="email"
                          placeholder="ton@email.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-zinc-300 flex items-center gap-2"><Lock className="w-4 h-4" /> Mot de passe</label>
                        <div className="relative">
                          <Input
                            type={showLoginPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                          >
                            {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        disabled={loginLoading}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white py-5 rounded-xl border-0"
                      >
                        {loginLoading ? (
                          <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Connexion...</span>
                        ) : (
                          "Se connecter"
                        )}
                      </Button>
                      <p className="text-center text-xs text-zinc-500">
                        Pas encore de compte ?{" "}
                        <span
                          className="text-purple-400 cursor-pointer hover:underline"
                          onClick={() => { setLoginOpen(false); setSignupOpen(true); }}
                        >
                          Créer un compte
                        </span>
                      </p>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Créer ma chanson (opens signup if not logged in) */}
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
                      <DialogDescription className="text-zinc-400">Inscris-toi gratuitement pour créer ta première chanson IA</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <p className="text-sm text-zinc-300">Pour créer ta chanson avec l&apos;IA, tu dois d&apos;abord créer un compte gratuit. Tu recevras <span className="text-purple-400 font-semibold">2 chansons gratuites</span> pour commencer !</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white py-4 rounded-xl border-0"
                          onClick={() => { setCreateOpen(false); setSignupOpen(true); }}
                        >
                          Créer un compte
                        </Button>
                        <Button
                          variant="outline"
                          className="border-white/10 text-zinc-300 hover:text-white hover:border-white/20 py-4 rounded-xl"
                          onClick={() => { setCreateOpen(false); setLoginOpen(true); }}
                        >
                          Se connecter
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {/* Signup Dialog */}
            <Dialog open={signupOpen} onOpenChange={setSignupOpen}>
              <DialogContent className="bg-[#12121a] border border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-white text-xl">Créer un compte</DialogTitle>
                  <DialogDescription className="text-zinc-400">Commence à créer ta musique avec l&apos;IA</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSignup} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300 flex items-center gap-2"><User className="w-4 h-4" /> Nom</label>
                    <Input
                      type="text"
                      placeholder="Ton nom"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300 flex items-center gap-2"><Mail className="w-4 h-4" /> Email</label>
                    <Input
                      type="email"
                      placeholder="ton@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300 flex items-center gap-2"><Lock className="w-4 h-4" /> Mot de passe</label>
                    <div className="relative">
                      <Input
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="6 caractères minimum"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                      >
                        {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={signupLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white py-5 rounded-xl border-0"
                  >
                    {signupLoading ? (
                      <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Création...</span>
                    ) : (
                      "Créer mon compte"
                    )}
                  </Button>
                  <p className="text-center text-xs text-zinc-500">
                    Déjà un compte ?{" "}
                    <span
                      className="text-purple-400 cursor-pointer hover:underline"
                      onClick={() => { setSignupOpen(false); setLoginOpen(true); }}
                    >
                      Se connecter
                    </span>
                  </p>
                </form>
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
              <span className="bg-pink-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">AFRICA</span>
              <span className="text-sm text-zinc-300">Le studio IA complet des artistes africains</span>
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Le Studio IA des{" "}
              <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 bg-clip-text text-transparent">
                Artistes Africains
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p variants={fadeUp} className="text-lg text-zinc-400 max-w-lg leading-relaxed">
              Crée ta musique, tes clips vidéo et tes pochettes avec l&apos;IA. De l&apos;idée à la distribution, Melodia Up To Africa accompagne chaque étape de ta création.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <a href="/signup">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white text-base px-8 py-6 border-0 shadow-lg shadow-purple-500/25 rounded-xl">
                  ✨ Commencer à créer
                </Button>
              </a>
              <a href="#fonctionnalites">
                <Button variant="outline" className="border-white/15 text-zinc-300 hover:text-white hover:border-white/25 text-base px-8 py-6 rounded-xl">
                  ▶ Découvrir le Studio
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
                  "Paroles IA générées",
                  "Composition & Voix IA",
                  "Pochette Design IA",
                  "Mix & Master IA",
                  "Clip vidéo IA",
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
    { icon: Shield, title: "Paiements en FCFA", subtitle: "100% sécurisés" },
    { icon: Headphones, title: "IA de nouvelle génération", subtitle: "Résultats premium" },
    { icon: Cloud, title: "Stockage cloud", subtitle: "Accéder partout" },
    { icon: Share2, title: "Distribution & Partage", subtitle: "Partout en Afrique" },
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

// ===== ARTIST PIPELINE =====
function ArtistPipeline() {
  const steps = [
    { icon: Sparkles, title: "Idée", desc: "Décris ton concept, ton ambiance, ton message." },
    { icon: FileText, title: "Paroles", desc: "L'IA écrit des paroles adaptées aux styles africains." },
    { icon: Music, title: "Composition", desc: "Mélodie, harmonie et arrangement générés par l'IA." },
    { icon: Mic, title: "Voix", desc: "Voix IA réalistes ou enregistre ta propre voix." },
    { icon: Layers, title: "Production", desc: "Arrangement complet, instruments et effets." },
    { icon: Headphones, title: "Mix & Master", desc: "Mixage et mastering professionnels par l'IA." },
    { icon: Palette, title: "Pochette", desc: "Design de pochette d'album unique par l'IA." },
    { icon: Clapperboard, title: "Storyboard", desc: "Scénarisation visuelle pour ton clip vidéo." },
    { icon: Video, title: "Clip IA", desc: "Génère ton clip vidéo complet avec l'IA." },
    { icon: Share2, title: "Distribution", desc: "Partage sur toutes les plateformes africaines et mondiales." },
  ];

  return (
    <section id="pipeline" className="relative bg-[#0a0a0f] py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16 scroll-mt-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Le pipeline <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">complet</span> de l&apos;artiste
          </h2>
          <p className="text-zinc-400 mt-4 max-w-2xl mx-auto">
            De l&apos;idée à la distribution, chaque étape de ta création musicale et audiovisuelle est couverte par l&apos;IA.
          </p>
        </motion.div>

        <div className="relative">
          {/* Dotted connector line - desktop */}
          <div className="hidden xl:block absolute top-12 left-[5%] right-[5%] border-t-2 border-dashed border-white/10" />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 lg:gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex flex-col items-center text-center relative"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-sm mb-4 relative z-10 shadow-lg shadow-purple-500/30">
                  {i + 1}
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3">
                  <step.icon className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">{step.title}</h3>
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
    { icon: PenTool, title: "Paroles IA", desc: "Songwriting intelligent adapté aux cultures et styles africains : Afrobeats, Amapiano, Ndombolo, Highlife et plus.", color: "from-pink-500 to-rose-500" },
    { icon: Music, title: "Composition & Voix IA", desc: "Génère mélodies, harmonies et voix réalistes. Chante en français, anglais, lingala, wolof et plus.", color: "from-purple-500 to-violet-500" },
    { icon: Palette, title: "Pochette & Design IA", desc: "Crée des pochettes d'album professionnelles et visuels de promotion uniques pour ta musique.", color: "from-emerald-500 to-green-500" },
    { icon: Video, title: "Clip Vidéo IA", desc: "Transforme ta musique en clips vidéo complets avec storyboard, scènes et montage IA.", color: "from-red-500 to-orange-500" },
    { icon: Headphones, title: "Mix & Master", desc: "Mixage et mastering professionnels pilotés par l'IA pour un son studio ready.", color: "from-blue-500 to-cyan-500" },
    { icon: Share2, title: "Distribution & Partage", desc: "Distribue ta musique sur Spotify, Boomplay, Audiomack et partage sur les réseaux sociaux.", color: "from-amber-500 to-yellow-500" },
  ];

  return (
    <section id="a-propos" className="relative bg-[#0a0a0f] py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16 scroll-mt-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Le studio complet pour créer <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">sans limites</span>
          </h2>
          <p className="text-zinc-400 mt-4 max-w-2xl mx-auto">
            Paroles, composition, voix, pochette, clip, mix, distribution — tout dans un seul studio IA.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
    Découverte: 2000,
    "Production Musicale": 5000,
    "Artiste Actif": 10000,
    Vidéo: 15000,
    "Artiste Professionnel": 25000,
    "Label / Studio": 50000,
  };

  const formatPrice = (name: string) => {
    const base = monthlyPrices[name];
    const finalPrice = annual ? Math.round(base * 0.8) : base;
    return finalPrice.toLocaleString("fr-FR");
  };

  const plans = [
    {
      name: "Découverte",
      badge: "POUR DÉCOUVRIR",
      badgeColor: "bg-zinc-700 text-zinc-300",
      features: [
        { text: "3 chansons/mois", included: true },
        { text: "3 pochettes IA", included: true },
        { text: "Paroles IA", included: true },
        { text: "Audio 128kbps", included: true },
        { text: "Format MP3", included: true },
        { text: "Partage", included: true },
        { text: "Clip vidéo", included: false },
      ],
      button: "Commencer",
      buttonStyle: "bg-purple-600 hover:bg-purple-700 text-white",
      featured: false,
    },
    {
      name: "Production Musicale",
      badge: "CRÉER TA MUSIQUE",
      badgeColor: "bg-zinc-700 text-zinc-300",
      features: [
        { text: "8 chansons/mois", included: true },
        { text: "8 pochettes IA", included: true },
        { text: "Composition IA", included: true },
        { text: "Audio 320kbps", included: true },
        { text: "Voix IA", included: true },
        { text: "MP3 + WAV", included: true },
        { text: "Mix basique", included: true },
        { text: "5 Go stockage", included: true },
        { text: "Clip vidéo", included: false },
      ],
      button: "Passer à Production",
      buttonStyle: "bg-purple-600 hover:bg-purple-700 text-white",
      featured: false,
    },
    {
      name: "Artiste Actif",
      badge: "LE PLUS POPULAIRE",
      badgeColor: "bg-pink-500 text-white",
      features: [
        { text: "15 chansons/mois", included: true },
        { text: "15 pochettes IA", included: true },
        { text: "Voix premium", included: true },
        { text: "Mix avancé", included: true },
        { text: "Pochettes premium", included: true },
        { text: "2 tâches parallèles", included: true },
        { text: "15 Go stockage", included: true },
        { text: "Support prioritaire", included: true },
        { text: "Clip vidéo long", included: false },
      ],
      button: "Passer à Artiste Actif",
      buttonStyle: "bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white",
      featured: true,
    },
    {
      name: "Vidéo",
      badge: "MUSIQUE + VIDÉO",
      badgeColor: "bg-orange-600 text-white",
      features: [
        { text: "20 chansons/mois", included: true },
        { text: "20 pochettes IA", included: true },
        { text: "3 clips vidéo IA", included: true },
        { text: "Storyboard IA", included: true },
        { text: "Audio 320kbps", included: true },
        { text: "Voix premium", included: true },
        { text: "Mix avancé", included: true },
        { text: "3 tâches parallèles", included: true },
        { text: "25 Go stockage", included: true },
      ],
      button: "Passer à Vidéo",
      buttonStyle: "bg-purple-600 hover:bg-purple-700 text-white",
      featured: false,
    },
    {
      name: "Artiste Professionnel",
      badge: "STUDIO COMPLET",
      badgeColor: "bg-violet-600 text-white",
      features: [
        { text: "50 chansons/mois", included: true },
        { text: "50 pochettes IA", included: true },
        { text: "10 clips vidéo IA", included: true },
        { text: "Studio vidéo complet", included: true },
        { text: "Voix + harmonies", included: true },
        { text: "Mix professionnel", included: true },
        { text: "Modèles exclusifs", included: true },
        { text: "Pages cadeaux", included: true },
        { text: "5 tâches parallèles", included: true },
        { text: "50 Go stockage", included: true },
        { text: "Support VIP", included: true },
      ],
      button: "Passer à Pro",
      buttonStyle: "bg-purple-600 hover:bg-purple-700 text-white",
      featured: false,
    },
    {
      name: "Label / Studio",
      badge: "POUR LES STRUCTURES",
      badgeColor: "bg-gradient-to-r from-purple-600 to-pink-500 text-white",
      features: [
        { text: "Chansons illimitées", included: true },
        { text: "Pochettes illimitées", included: true },
        { text: "30 clips vidéo/mois", included: true },
        { text: "Multi-artistes (10)", included: true },
        { text: "Tous les modèles IA", included: true },
        { text: "API complète", included: true },
        { text: "10 tâches parallèles", included: true },
        { text: "100 Go stockage", included: true },
        { text: "Account manager", included: true },
        { text: "Support 24/7", included: true },
      ],
      button: "Contacter l'équipe",
      buttonStyle: "bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white",
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
          <p className="text-zinc-400 mt-4 max-w-xl mx-auto">
            Tous les prix sont en FCFA. Paiement par Mobile Money, carte bancaire ou PayPal.
          </p>
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

        {/* Cards - 6 plans in 2 rows of 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
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
      quote: "Melodia Up To Africa m'a permis de sortir mon premier single sans studio. C'est une révolution pour les artistes africains !",
      name: "Eryam",
      role: "Artiste Afrobeats",
      initial: "E",
      color: "from-pink-500 to-purple-500",
    },
    {
      quote: "Les pochettes sont incroyables et les clips IA m'aident à promouvoir ma musique sur TikTok et Instagram.",
      name: "Aïcha",
      role: "Créatrice de contenu",
      initial: "A",
      color: "from-purple-500 to-blue-500",
    },
    {
      quote: "Le plan Artiste Professionnel est un vrai studio de poche. Je produis tout de l'idée au clip avec l'IA !",
      name: "Samy",
      role: "Producteur",
      initial: "S",
      color: "from-emerald-500 to-cyan-500",
    },
  ];

  return (
    <section className="relative bg-[#0a0a0f] py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16 scroll-mt-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ils créent avec <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Melodia Up To Africa</span>
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
      q: "Comment fonctionne Melodia Up To Africa ?",
      a: "Melodia Up To Africa utilise l'intelligence artificielle pour générer de la musique, des clips vidéo et des pochettes à partir de votre description. Vous décrivez votre idée, choisissez un style musical, et notre IA compose la mélodie, écrit les paroles, produit le morceau, crée la pochette et peut même générer un clip vidéo.",
    },
    {
      q: "Ai-je besoin d'expérience en musique ?",
      a: "Non, aucune expérience n'est requise ! Melodia Up To Africa est conçu pour les créateurs de tous niveaux. Décrivez simplement votre idée en langage naturel et l'IA s'occupe du reste.",
    },
    {
      q: "Puis-je utiliser ma musique à des fins commerciales ?",
      a: "Oui, avec les plans Production Musicale et supérieurs, vous disposez d'une licence commerciale complète pour utiliser votre musique générée sur toutes les plateformes de streaming et réseaux sociaux.",
    },
    {
      q: "Quels sont les moyens de paiement acceptés ?",
      a: "Nous acceptons Mobile Money (Orange Money, MTN Money, Wave), les cartes bancaires, PayPal et les virements bancaires. Tous les paiements sont en FCFA et 100% sécurisés.",
    },
    {
      q: "Comment fonctionne la génération de clips vidéo ?",
      a: "À partir des plans Vidéo et supérieurs, l'IA crée un storyboard, génère les scènes visuelles et assemble un clip vidéo synchronisé avec votre musique. Vous pouvez personnaliser le style et l'ambiance du clip.",
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
            Prêt à créer le prochain <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">hit africain</span> ?
          </h2>
          <p className="text-zinc-300 text-lg mb-8 max-w-xl mx-auto">
            Rejoins des milliers de créateurs qui font déjà confiance à Melodia Up To Africa.
          </p>
          <a href="/signup">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white text-lg px-10 py-6 border-0 shadow-lg shadow-purple-500/30 rounded-xl">
              ✨ Commencer à créer maintenant
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
            <div className="mb-4">
              <Logo size="sm" showSubtitle link={false} />
            </div>
            <p className="text-zinc-500 text-xs leading-relaxed mb-4">
              Le studio de création musicale et audiovisuelle IA des artistes africains.
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
              {["Fonctionnalités", "Tarifs", "Pipeline", "API (bientôt)"].map((item) => (
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
          <p className="text-zinc-600 text-xs">&copy; 2025 Melodia Up To Africa. Tous droits réservés.</p>
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
        <ArtistPipeline />
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
