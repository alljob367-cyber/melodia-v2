"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Volume2, VolumeX, Video, VideoOff, ChevronDown } from "lucide-react";
import { MeloSVG } from "./melo-svg";
import { MeloAudio } from "./melo-audio";
import { MeloAvatar } from "./melo-avatar";
import { FAQ_DATA, FAQ_CATEGORIES, searchFAQ, MELO_DEFAULT_RESPONSE } from "./faq-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ===== TYPES =====
interface Message {
  id: string;
  role: "user" | "melo";
  text: string;
  faqId?: string;
  audioUrl?: string;
}

// ===== MELO CHAT WIDGET — Assistant flottant complet =====
export function MeloChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [meloExpression, setMeloExpression] = useState<"happy" | "thinking" | "talking" | "waving" | "dancing">("happy");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [currentAudioText, setCurrentAudioText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Message d'accueil
  useEffect(() => {
    if (open && messages.length === 0) {
      const timer = setTimeout(() => {
        setMessages([
          {
            id: "welcome",
            role: "melo",
            text: "Salut ! 🎵 Moi c'est Melo, ton assistant Melodia ! Je connais tout sur la plateforme : tarifs, styles musicaux, vidéo, distribution... Pose-moi n'importe quelle question !",
          },
        ]);
        setMeloExpression("waving");
        setTimeout(() => setMeloExpression("happy"), 2000);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [open, messages.length]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Envoyer un message
  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: text.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setShowSuggestions(false);
    setIsTyping(true);
    setMeloExpression("thinking");

    // Simuler le temps de "réflexion" de Melo
    setTimeout(() => {
      const results = searchFAQ(text);
      const bestMatch = results[0];
      const replyText = bestMatch ? bestMatch.answer : MELO_DEFAULT_RESPONSE;

      const meloMsg: Message = {
        id: `melo-${Date.now()}`,
        role: "melo",
        text: replyText,
        faqId: bestMatch?.id,
      };

      setMessages((prev) => [...prev, meloMsg]);
      setIsTyping(false);
      setMeloExpression("talking");
      setCurrentAudioText(replyText);

      setTimeout(() => {
        setMeloExpression("happy");
        setCurrentAudioText("");
      }, replyText.length * 30 + 1000);
    }, 800 + Math.random() * 600);
  };

  // Suggestions rapides
  const quickSuggestions = [
    "Comment ça fonctionne ?",
    "Quels sont les tarifs ?",
    "Styles musicaux ?",
    "Créer un clip vidéo ?",
    "Distribution Spotify ?",
  ];

  // FAQ par catégorie
  const filteredFAQ = activeCategory
    ? FAQ_DATA.filter((f) => f.category === activeCategory)
    : FAQ_DATA.slice(0, 5);

  return (
    <>
      {/* ===== BOUTON FLOTTANT ===== */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full btn-gradient shadow-lg shadow-purple-500/30 flex items-center justify-center group"
          >
            <MeloSVG expression="happy" size={36} />
            {/* Badge notification */}
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pink-500 text-[10px] font-bold text-white flex items-center justify-center animate-bounce">
              1
            </span>
            {/* Tooltip */}
            <span className="absolute right-full mr-3 bg-[#1a1a30] text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg border border-purple-500/20">
              Demande à Melo ! 🎵
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ===== FENÊTRE DE CHAT ===== */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] sm:w-[400px] max-h-[85vh] sm:max-h-[600px] flex flex-col bg-[#0a0a12] border border-purple-500/20 rounded-2xl shadow-2xl shadow-purple-500/10 overflow-hidden"
          >
            {/* ===== HEADER ===== */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <MeloSVG expression={meloExpression} size={40} />
                </motion.div>
                <div>
                  <h3 className="text-sm font-bold text-white">Melo</h3>
                  <p className="text-[10px] text-purple-400">
                    {isTyping ? "En train de réfléchir..." : "Assistant Melodia"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Audio toggle */}
                <button
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  title={audioEnabled ? "Désactiver l'audio" : "Activer l'audio"}
                >
                  {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
                {/* Video toggle */}
                <button
                  onClick={() => setVideoEnabled(!videoEnabled)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  title={videoEnabled ? "Désactiver la vidéo" : "Voir Melo en vidéo"}
                >
                  {videoEnabled ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                </button>
                {/* Close */}
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* ===== VIDEO AVATAR ===== */}
            {videoEnabled && (
              <div className="px-3 pt-3">
                <MeloAvatar
                  expression={meloExpression}
                  message={messages.length > 0 && messages[messages.length - 1].role === "melo" ? messages[messages.length - 1].text : undefined}
                  showVideo={videoEnabled}
                />
              </div>
            )}

            {/* ===== MESSAGES ===== */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px]">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "melo" && (
                    <div className="flex-shrink-0 mr-2 mt-1">
                      <MeloSVG expression="happy" size={24} />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-purple-500/20 text-white border border-purple-500/20"
                        : "bg-[#1a1a30] text-slate-200 border border-white/5"
                    }`}
                  >
                    {msg.text}
                    {/* Audio button pour les réponses de Melo */}
                    {msg.role === "melo" && audioEnabled && (
                      <div className="mt-2 pt-2 border-t border-white/5">
                        <MeloAudio text={msg.text} />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <MeloSVG expression="thinking" size={24} />
                  <div className="bg-[#1a1a30] rounded-2xl px-4 py-2.5 border border-white/5">
                    <div className="flex items-center gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-purple-400"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ===== QUICK SUGGESTIONS ===== */}
            {showSuggestions && messages.length <= 1 && (
              <div className="px-4 pb-2">
                <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wider font-medium">Questions rapides</p>
                <div className="flex flex-wrap gap-1.5">
                  {quickSuggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 hover:text-white transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ===== FAQ CATEGORIES ===== */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2">
                <button
                  onClick={() => setActiveCategory(activeCategory ? null : "general")}
                  className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <ChevronDown className={`w-3 h-3 transition-transform ${activeCategory ? "rotate-180" : ""}`} />
                  Parcourir par catégorie
                </button>
                <AnimatePresence>
                  {activeCategory !== null && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      {/* Catégorie tabs */}
                      <div className="flex flex-wrap gap-1 mt-2 mb-2">
                        {FAQ_CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                              activeCategory === cat.id
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                : "bg-white/5 text-slate-500 hover:text-slate-300 border border-white/5"
                            }`}
                          >
                            {cat.emoji} {cat.label}
                          </button>
                        ))}
                      </div>
                      {/* FAQ items */}
                      <div className="space-y-1 max-h-[150px] overflow-y-auto">
                        {filteredFAQ.map((faq) => (
                          <button
                            key={faq.id}
                            onClick={() => sendMessage(faq.question)}
                            className="w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-white/3 text-slate-400 hover:bg-white/5 hover:text-white transition-colors truncate"
                          >
                            {faq.question}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ===== INPUT ===== */}
            <div className="px-3 pb-3 pt-1 border-t border-white/5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(input);
                }}
                className="flex items-center gap-2"
              >
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Demande à Melo..."
                  className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50 text-sm h-9"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isTyping}
                  className="w-9 h-9 rounded-xl btn-gradient text-white border-0 shadow-md shadow-purple-500/20 disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
