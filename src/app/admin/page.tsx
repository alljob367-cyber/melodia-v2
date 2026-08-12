"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Music,
  Brain,
  DollarSign,
  Activity,
  Settings,
  TrendingUp,
  BarChart3,
  Shield,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Demo admin data
const demoUsers = [
  { id: "1", name: "Jean Paul", email: "jean@example.com", plan: "basic", songs: 3, createdAt: "10 août 2026", active: true },
  { id: "2", name: "Marie Kouam", email: "marie@example.com", plan: "pro", songs: 12, createdAt: "8 août 2026", active: true },
  { id: "3", name: "Ahmed Diallo", email: "ahmed@example.com", plan: "basic", songs: 1, createdAt: "12 août 2026", active: true },
  { id: "4", name: "Fatou Ndiaye", email: "fatou@example.com", plan: "studio", songs: 28, createdAt: "5 août 2026", active: true },
  { id: "5", name: "Kofi Asante", email: "kofi@example.com", plan: "pro", songs: 8, createdAt: "7 août 2026", active: false },
];

const demoSongs = [
  { id: "1", title: "Afro Dreams", style: "Afrobeat", user: "Jean Paul", status: "completed", createdAt: "12 août" },
  { id: "2", title: "Lumière de Douala", style: "Makossa", user: "Jean Paul", status: "completed", createdAt: "11 août" },
  { id: "3", title: "Savane Solitude", style: "Afro R&B", user: "Marie Kouam", status: "completed", createdAt: "10 août" },
  { id: "4", title: "Freedom Song", style: "Amapiano", user: "Ahmed Diallo", status: "generating", createdAt: "12 août" },
  { id: "5", title: "Célébration", style: "Afropop", user: "Fatou Ndiaye", status: "completed", createdAt: "9 août" },
];

const demoAIRequests = [
  { model: "melodia-v1", endpoint: "/api/generate", requests: 156, avgCost: 0.02, avgDuration: 25000 },
  { model: "lyrics-v2", endpoint: "/api/generate/lyrics", requests: 234, avgCost: 0.01, avgDuration: 8000 },
  { model: "cover-v1", endpoint: "/api/generate/cover", requests: 89, avgCost: 0.03, avgDuration: 15000 },
  { model: "voice-v1", endpoint: "/api/generate/voice", requests: 45, avgCost: 0.05, avgDuration: 30000 },
];

const planColors: Record<string, string> = {
  basic: "bg-slate-500/10 text-slate-400",
  pro: "bg-purple-500/10 text-purple-400",
  studio: "bg-amber-500/10 text-amber-400",
};

const statusColors: Record<string, string> = {
  completed: "bg-emerald-500/10 text-emerald-400",
  generating: "bg-amber-500/10 text-amber-400",
  failed: "bg-red-500/10 text-red-400",
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const stats = [
    { label: "Utilisateurs", value: "1 247", change: "+12%", icon: Users, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Chansons créées", value: "3 891", change: "+28%", icon: Music, color: "text-pink-400", bg: "bg-pink-500/10" },
    { label: "Requêtes IA", value: "12 456", change: "+45%", icon: Brain, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Revenus (FCFA)", value: "2.4M", change: "+18%", icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B14]">
      {/* Admin header */}
      <header className="h-16 border-b border-white/5 bg-[#0a0a12] flex items-center justify-between px-6 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-purple-400" />
          <h1 className="text-lg font-bold text-white">Admin MELODIA</h1>
          <Badge className="bg-red-500/10 text-red-400 text-[10px]">ADMIN</Badge>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 text-xs">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Système OK
          </Badge>
          <Badge variant="outline" className="border-amber-500/20 text-amber-400 text-xs">
            Mode démo
          </Badge>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border-white/10 mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
              <BarChart3 className="w-4 h-4 mr-2" />
              Vue d&apos;ensemble
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
              <Users className="w-4 h-4 mr-2" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="songs" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
              <Music className="w-4 h-4 mr-2" />
              Chansons
            </TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
              <Brain className="w-4 h-4 mr-2" />
              Coûts IA
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          {/* Overview tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className="glass p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />{stat.change}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Activity chart placeholder */}
            <Card className="glass p-6">
              <h3 className="text-lg font-bold text-white mb-4">Activité récente</h3>
              <div className="grid grid-cols-7 gap-2 h-40 items-end">
                {[65, 45, 78, 92, 55, 88, 70, 82, 60, 95, 72, 85, 48, 90, 75, 68, 92, 55, 83, 77, 96].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm bg-gradient-to-t from-purple-500/40 to-purple-500/10"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>Il y a 3 semaines</span>
                <span>Aujourd&apos;hui</span>
              </div>
            </Card>

            {/* Recent activity */}
            <Card className="glass p-6">
              <h3 className="text-lg font-bold text-white mb-4">Événements récents</h3>
              <div className="space-y-3">
                {[
                  { text: "Jean Paul a créé 'Afro Dreams'", time: "Il y a 2h", icon: Music, color: "text-purple-400" },
                  { text: "Marie Kouam a passé au plan PRO", time: "Il y a 3h", icon: Zap, color: "text-amber-400" },
                  { text: "Ahmed Diallo s'est inscrit", time: "Il y a 5h", icon: Users, color: "text-emerald-400" },
                  { text: "Fatou Ndiaye a partagé 'Rêves d'Afrique'", time: "Il y a 8h", icon: Activity, color: "text-pink-400" },
                ].map((event, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                      <event.icon className={`w-4 h-4 ${event.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{event.text}</p>
                    </div>
                    <span className="text-xs text-slate-500 flex-shrink-0">{event.time}</span>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Users tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="glass overflow-hidden">
              <div className="p-4 border-b border-white/5">
                <h3 className="text-lg font-bold text-white">Utilisateurs ({demoUsers.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-xs text-slate-500 font-medium p-3 px-4">Nom</th>
                      <th className="text-left text-xs text-slate-500 font-medium p-3">Email</th>
                      <th className="text-left text-xs text-slate-500 font-medium p-3">Plan</th>
                      <th className="text-left text-xs text-slate-500 font-medium p-3">Chansons</th>
                      <th className="text-left text-xs text-slate-500 font-medium p-3">Inscription</th>
                      <th className="text-left text-xs text-slate-500 font-medium p-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demoUsers.map((user) => (
                      <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="p-3 px-4 text-sm text-white font-medium">{user.name}</td>
                        <td className="p-3 text-sm text-slate-400">{user.email}</td>
                        <td className="p-3"><Badge className={cn("text-[10px]", planColors[user.plan])}>{user.plan.toUpperCase()}</Badge></td>
                        <td className="p-3 text-sm text-white">{user.songs}</td>
                        <td className="p-3 text-sm text-slate-400">{user.createdAt}</td>
                        <td className="p-3">
                          <Badge className={cn("text-[10px]", user.active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                            {user.active ? "Actif" : "Inactif"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Songs tab */}
          <TabsContent value="songs" className="space-y-6">
            <Card className="glass overflow-hidden">
              <div className="p-4 border-b border-white/5">
                <h3 className="text-lg font-bold text-white">Chansons récentes</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-xs text-slate-500 font-medium p-3 px-4">Titre</th>
                      <th className="text-left text-xs text-slate-500 font-medium p-3">Style</th>
                      <th className="text-left text-xs text-slate-500 font-medium p-3">Utilisateur</th>
                      <th className="text-left text-xs text-slate-500 font-medium p-3">Statut</th>
                      <th className="text-left text-xs text-slate-500 font-medium p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demoSongs.map((song) => (
                      <tr key={song.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="p-3 px-4 text-sm text-white font-medium">{song.title}</td>
                        <td className="p-3 text-sm text-slate-400">{song.style}</td>
                        <td className="p-3 text-sm text-slate-400">{song.user}</td>
                        <td className="p-3"><Badge className={cn("text-[10px]", statusColors[song.status])}>{song.status}</Badge></td>
                        <td className="p-3 text-sm text-slate-400">{song.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* AI Costs tab */}
          <TabsContent value="ai" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card className="glass p-5 text-center">
                <p className="text-2xl font-bold text-white">$24.56</p>
                <p className="text-xs text-slate-400 mt-1">Coût total IA ce mois</p>
              </Card>
              <Card className="glass p-5 text-center">
                <p className="text-2xl font-bold text-white">524</p>
                <p className="text-xs text-slate-400 mt-1">Requêtes aujourd&apos;hui</p>
              </Card>
              <Card className="glass p-5 text-center">
                <p className="text-2xl font-bold text-white">18.2s</p>
                <p className="text-xs text-slate-400 mt-1">Durée moyenne</p>
              </Card>
            </div>

            <Card className="glass overflow-hidden">
              <div className="p-4 border-b border-white/5">
                <h3 className="text-lg font-bold text-white">Coûts par modèle IA</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-xs text-slate-500 font-medium p-3 px-4">Modèle</th>
                      <th className="text-left text-xs text-slate-500 font-medium p-3">Endpoint</th>
                      <th className="text-left text-xs text-slate-500 font-medium p-3">Requêtes</th>
                      <th className="text-left text-xs text-slate-500 font-medium p-3">Coût moy.</th>
                      <th className="text-left text-xs text-slate-500 font-medium p-3">Durée moy.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demoAIRequests.map((req, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="p-3 px-4 text-sm text-white font-medium">{req.model}</td>
                        <td className="p-3 text-sm text-slate-400 font-mono text-xs">{req.endpoint}</td>
                        <td className="p-3 text-sm text-white">{req.requests}</td>
                        <td className="p-3 text-sm text-amber-400">${req.avgCost}</td>
                        <td className="p-3 text-sm text-slate-400">{(req.avgDuration / 1000).toFixed(1)}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Settings tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="glass p-6">
              <h3 className="text-lg font-bold text-white mb-6">Configuration système</h3>
              <div className="space-y-4">
                {[
                  { label: "Mode démo", value: "Activé", type: "badge", active: true },
                  { label: "Modèle IA par défaut", value: "melodia-v1", type: "text" },
                  { label: "Générations max. simultanées", value: "3", type: "text" },
                  { label: "Limite chansons Basic", value: "2/mois", type: "text" },
                  { label: "Limite chansons Pro", value: "20/mois", type: "text" },
                  { label: "Mode maintenance", value: "Désactivé", type: "badge", active: false },
                ].map((setting, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <span className="text-sm text-slate-300">{setting.label}</span>
                    {setting.type === "badge" ? (
                      <Badge className={cn("text-xs", setting.active ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400")}>
                        {setting.value}
                      </Badge>
                    ) : (
                      <span className="text-sm text-white font-medium">{setting.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
