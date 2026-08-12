"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Music, Mail, Lock, User, ArrowRight, Eye, EyeOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    if (password.length < 6) {
      toast.error("Le mot de passe doit avoir au moins 6 caractères");
      return;
    }

    setLoading(true);
    try {
      // Create account
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erreur lors de l'inscription");
        return;
      }

      // Auto sign in
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        toast.success("Bienvenue dans MELODIA ! 🎵");
        router.push("/dashboard");
      } else {
        toast.success("Compte créé ! Connecte-toi maintenant.");
        router.push("/login");
      }
    } catch (error) {
      toast.error("Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B14] flex items-center justify-center px-4">
      {/* Background effects */}
      <div className="absolute top-1/3 right-1/3 w-[400px] h-[400px] rounded-full bg-purple-600/8 blur-[100px]" />
      <div className="absolute bottom-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-pink-500/5 blur-[80px]" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl btn-gradient flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold text-white tracking-wider">MELODIA</span>
          </Link>
        </div>

        <Card className="glass p-8">
          <h1 className="text-2xl font-bold text-white text-center mb-2">Créer un compte</h1>
          <p className="text-slate-400 text-center text-sm mb-8">
            Commence à créer ta musique avec l&apos;IA
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300 text-sm">Nom</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Ton nom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ton@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300 text-sm">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="6 caractères minimum"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-white/3 rounded-lg p-4 space-y-2">
              {[
                "2 chansons IA gratuites pour commencer",
                "Accès à 10+ styles musicaux africains",
                "Pochettes et paroles IA incluses",
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                  <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-gradient text-white font-bold py-5 rounded-xl hover:scale-[1.02] transition-transform shadow-lg shadow-purple-500/25"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Création du compte...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Créer mon compte
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Déjà un compte ?{" "}
              <Link href="/login" className="text-purple-400 hover:text-purple-300 font-semibold">
                Se connecter
              </Link>
            </p>
          </div>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-6">
          🔒 Inscription sécurisée · 2 chansons gratuites incluses
        </p>
      </div>
    </div>
  );
}
