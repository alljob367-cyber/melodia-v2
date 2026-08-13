// ===== MELO FAQ KNOWLEDGE BASE =====
// Melo connaît TOUTE la FAQ de Melodia Up To Africa

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "general" | "pricing" | "music" | "technical" | "payment" | "video" | "legal";
  keywords: string[];
}

export const FAQ_DATA: FAQItem[] = [
  // === GÉNÉRAL ===
  {
    id: "faq-1",
    question: "Comment fonctionne Melodia Up To Africa ?",
    answer:
      "Melodia Up To Africa est un studio IA conçu pour les artistes africains. Tu décris ta chanson (titre, style, humeur), et l'IA génère tout automatiquement : paroles, composition musicale, voix, pochette d'album, et même des clips vidéo. Le tout en 10 étapes guidées : Idée → Paroles → Composition → Voix → Production → Mix & Master → Pochette → Storyboard → Clip IA → Distribution. Chaque étape est personnalisable — tu gardes le contrôle créatif total.",
    category: "general",
    keywords: ["fonctionne", "comment", "pipeline", "étapes", "processus", "studio"],
  },
  {
    id: "faq-2",
    question: "Ai-je besoin d'expérience en musique ?",
    answer:
      "Absolument pas ! Melodia est conçu pour tout le monde : du débutant qui n'a jamais touché un micro au professionnel qui veut accélérer sa production. L'IA s'occupe de la technique — composition, mixage, mastering — pendant que tu te concentres sur ta créativité. Nos artistes débutants créent des morceaux complets en moins de 10 minutes dès la première session.",
    category: "general",
    keywords: ["expérience", "débutant", "apprendre", "savoir", "facile", "simple"],
  },
  {
    id: "faq-3",
    question: "Puis-je utiliser ma musique à des fins commerciales ?",
    answer:
      "Oui ! Tous les morceaux générés sur Melodia t'appartiennent. Tu peux les distribuer sur Spotify, Apple Music, YouTube Music, Deezer et toutes les plateformes. Tu conserves 100% des droits d'auteur et des revenus. C'est ta musique, ta création, ton talent — Melodia est juste ton outil de production.",
    category: "legal",
    keywords: ["commercial", "droits", "copyright", "spotify", "distribution", "revenus", "propriété"],
  },
  {
    id: "faq-4",
    question: "Quels sont les moyens de paiement acceptés ?",
    answer:
      "Nous acceptons les paiements en FCFA via Fpay, Wave, et les cartes Visa/Mastercard. Pas besoin de compte en euros ou dollars — tout est pensé pour l'Afrique. Les paiements sont sécurisés et instantanés. Tu peux aussi payer en espèces via nos points de vente partenaires dans les grandes villes africaines.",
    category: "payment",
    keywords: ["paiement", "payer", "fcfa", "wave", "fpay", "visa", "carte", "prix"],
  },
  {
    id: "faq-5",
    question: "Comment fonctionne la génération de clips vidéo ?",
    answer:
      "Notre IA vidéo utilise des modèles comme Veo 3.1 Lite, Kling v3.0 et Grok Imagine Video. La facturation est à la durée : un clip de 10 secondes coûte environ 30 crédits (économie), 75 crédits (standard) ou 100 crédits (premium). Le processus : l'IA analyse ta pochette, génère un storyboard, puis produit des séquences vidéo de 4-15 secondes qui sont assemblées en clip final. Pour les clips longs (1-3 min), le système découpe automatiquement en scènes et les assemble. Tu vois toujours le coût en crédits avant de générer !",
    category: "video",
    keywords: ["vidéo", "clip", "storyboard", "animation", "visuel", "clip ia", "durée", "coût"],
  },
  {
    id: "faq-6",
    question: "Quelle est la différence entre les packs ?",
    answer:
      "Melodia utilise un modèle Pay As You Go — tu paies uniquement ce que tu utilises ! 6 packs : 🌱 Basic (2 000 FCFA, pack fixe : 2 chansons + 2 pochettes), 🎤 Artist Starter (5 000 FCFA, 600 crédits, best-seller), 🎛️ Artist Production (10 000 FCFA, 1 400 crédits + AI Producer), 🎬 Video Creator (15 000 FCFA, 2 500 crédits orienté clips), ⭐ Artist Pro (25 000 FCFA, 4 500 crédits production pro), 🏢 Label (50 000 FCFA, 10 000 crédits multi-artistes). Les crédits ne sont jamais perdus — ils sont reportés d'un mois à l'autre !",
    category: "pricing",
    keywords: ["pack", "plan", "abonnement", "tarif", "différence", "comparer", "prix", "pay as you go", "à l'usage"],
  },
  {
    id: "faq-7",
    question: "Combien coûte une chanson complète ?",
    answer:
      "Avec le système Pay As You Go : paroles IA = 5 crédits, pochette = 15 crédits, musique standard = 80 crédits, mix IA = 40 crédits, master IA = 30 crédits. Une chanson complète standard coûte environ 170 crédits. Avec Artist Starter (600 crédits), tu peux créer 3-4 chansons complètes. Avec Artist Production (1 400 crédits), tu peux en créer 8+. Et tu vois toujours le coût en crédits avant de lancer la génération — pas de surprise !",
    category: "pricing",
    keywords: ["coût", "chanson", "crédits", "prix", "combien", "tarif", "consommation"],
  },
  {
    id: "faq-8",
    question: "Les crédits expirent-ils ?",
    answer:
      "Non ! Tes crédits ne sont jamais perdus. Ils sont reportables d'un mois à l'autre. Si tu n'utilises pas tous tes crédits ce mois-ci, ils s'ajoutent au mois suivant. Et si tu n'as plus assez de crédits, pas besoin d'abonnement — achète juste un recharge de crédits (2 000, 5 000, 10 000 ou 25 000 FCFA) et continue immédiatement. C'est le modèle Pay As You Go — tu paies uniquement ce que tu utilises, sans pression de temps.",
    category: "pricing",
    keywords: ["crédits", "expiration", "report", "gaspillage", "perdre", "recharge", "plus de crédits"],
  },
  {
    id: "faq-9",
    question: "Puis-je annuler mon abonnement à tout moment ?",
    answer:
      "Absolument ! Aucun engagement, aucune pénalité. Tu peux annuler ton abonnement à tout moment depuis ton tableau de bord. Tes créations existantes restent accessibles indéfiniment. Tu peux aussi changer de pack à tout moment — la différence sera calculée au prorata.",
    category: "payment",
    keywords: ["annuler", "annulation", "engagement", "résilier", "arrêter"],
  },
  {
    id: "faq-10",
    question: "Quels styles musicaux sont disponibles ?",
    answer:
      "Melodia supporte tous les styles africains et internationaux : Afrobeat, Amapiano, Afropop, Afrobeats, Highlife, Soukous, Ndombolo, Coupé-Décalé, Bongo Flava, Kizomba, Semba, Raï, Chaabi, mais aussi Pop, R&B, Hip-Hop, Rap, Reggae, Dancehall, Gospel et bien d'autres. Tu peux même combiner les styles pour créer des fusions uniques !",
    category: "music",
    keywords: ["style", "genre", "afrobeat", "amapiano", "afropop", "musique", "type"],
  },
  {
    id: "faq-11",
    question: "Comment fonctionne le Mix & Master ?",
    answer:
      "Notre IA de Mix & Master analyse ta composition et applique automatiquement les standards professionnels : équilibrage des fréquences, compression, réverbération, limiting, et normalisation loudness (LUFS -14). Le résultat est un son prêt pour la distribution sur toutes les plateformes streaming. Tu peux aussi ajuster manuellement les paramètres si tu veux un son plus personnalisé.",
    category: "technical",
    keywords: ["mix", "master", "son", "qualité", "audio", "production", "mastering"],
  },
  {
    id: "faq-12",
    question: "En quelles langues puis-je générer des paroles ?",
    answer:
      "Melodia génère des paroles en Français, Anglais, Wolof, Lingala, Swahili, Bambara, Hausa, Yoruba, Twi, et bien d'autres langues africaines. Notre IA comprend les structures linguistiques et les expressions culturelles de chaque langue. Tu peux même mixer les langues dans une même chanson — parfait pour les artistes multilingues !",
    category: "music",
    keywords: ["langue", "paroles", "français", "wolof", "lingala", "swahili", "langues"],
  },
  {
    id: "faq-13",
    question: "Comment distribuer ma musique sur Spotify ?",
    answer:
      "Après avoir créé et finalisé ta chanson, utilise l'étape Distribution du pipeline. Melodia s'occupe de l'encodage aux normes ISRC/UPC, de la soumission aux plateformes (Spotify, Apple Music, Deezer, YouTube Music, Tidal, Boomplay, Audiomack), et du suivi des revenus. Tes royalties te sont reversées directement — Melodia ne prend aucun pourcentage.",
    category: "technical",
    keywords: ["distribution", "spotify", "apple music", "deezer", "plateforme", "streaming"],
  },
  {
    id: "faq-14",
    question: "Y a-t-il un essai gratuit ?",
    answer:
      "Oui ! Chaque nouvel utilisateur bénéficie de 7 jours d'essai gratuit sur le pack Artiste Actif. Tu peux créer jusqu'à 3 chansons complètes pendant l'essai, sans carte bancaire requise. Si tu aimes l'expérience (et on est confiants !), tu peux choisir ton pack à la fin de l'essai.",
    category: "pricing",
    keywords: ["essai", "gratuit", "test", "demo", "démonstration", "7 jours"],
  },
  {
    id: "faq-15a",
    question: "Comment fonctionnent les crédits ?",
    answer:
      "Les crédits sont l'unité de consommation de Melodia. Chaque opération a un coût en crédits : paroles IA (5), pochette (15), musique standard (80), voix (30), mix IA (40), master IA (30), clip 10s éco (30). Tu achètes un pack de crédits et les utilises à ton rythme. Les crédits sont reportables — pas de date d'expiration ! Si tu n'as plus assez de crédits, tu peux recharger immédiatement sans abonnement.",
    category: "pricing",
    keywords: ["crédits", "comment", "fonctionnement", "unité", "consommation", "système"],
  },
  {
    id: "faq-15b",
    question: "Quels modèles IA utilise Melodia ?",
    answer:
      "Melodia utilise plusieurs modèles IA via OpenRouter, adaptés à chaque plan : Basic utilise DeepSeek V4 Flash (ultra économique), Artist Studio utilise GLM 5.2 (puissant, raisonnement long) avec DeepSeek en fallback, Video Studio utilise GLM 5.2 + Nemotron Nano Omni (multimodal gratuit) + Kling/Veo/Grok pour la vidéo, Label utilise GLM 5.2 comme agent principal. Cette architecture multi-modèles permet d'optimiser coût et qualité selon ton plan.",
    category: "technical",
    keywords: ["modèle", "ia", "openrouter", "glm", "deepseek", "kling", "veo", "llm", "moteur"],
  },
  {
    id: "faq-15c",
    question: "Que se passe-il si je n'ai plus de crédits ?",
    answer:
      "Pas de panique ! On ne te bloque pas et on ne t'impose pas d'abonnement. Melodia affiche simplement : 'Tu n'as plus assez de crédits pour cette production.' avec un bouton 'Acheter des crédits'. Tu peux recharger avec 2 000, 5 000, 10 000 ou 25 000 FCFA et continuer immédiatement là où tu en étais. Tes créations en cours ne sont jamais perdues.",
    category: "pricing",
    keywords: ["plus de crédits", "fini", "recharger", "recharge", "bloqué", "racheter"],
  },
  {
    id: "faq-15",
    question: "Mes données sont-elles sécurisées ?",
    answer:
      "Absolument. Nous utilisons le chiffrement AES-256 pour toutes les données, l'authentification NextAuth sécurisée, et nos serveurs sont hébergés en Europe (RGPD compliant). Tes créations sont stockées de façon privée — personne d'autre n'y a accès. Nous ne partageons jamais tes données avec des tiers. La sécurité de tes créations est notre priorité absolue.",
    category: "technical",
    keywords: ["sécurité", "données", "privé", "chiffrement", "protection", "rgpd"],
  },
];

// Catégories avec émojis et labels
export const FAQ_CATEGORIES = [
  { id: "general", label: "Général", emoji: "🎵" },
  { id: "pricing", label: "Tarifs", emoji: "💰" },
  { id: "music", label: "Musique", emoji: "🎤" },
  { id: "technical", label: "Technique", emoji: "⚙️" },
  { id: "payment", label: "Paiement", emoji: "💳" },
  { id: "video", label: "Vidéo", emoji: "🎬" },
  { id: "legal", label: "Légal", emoji: "📜" },
] as const;

// Fonction de recherche dans la FAQ
export function searchFAQ(query: string): FAQItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return FAQ_DATA.slice(0, 5);

  const scored = FAQ_DATA.map((item) => {
    let score = 0;
    // Match dans la question
    if (item.question.toLowerCase().includes(q)) score += 10;
    // Match dans la réponse
    if (item.answer.toLowerCase().includes(q)) score += 5;
    // Match sur les mots-clés
    for (const kw of item.keywords) {
      if (kw.includes(q) || q.includes(kw)) score += 8;
      if (q.split(" ").some((w) => kw.includes(w))) score += 3;
    }
    return { item, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.item);
}

// Réponse par défaut quand Melo ne trouve pas
export const MELO_DEFAULT_RESPONSE =
  "Hmm, je n'ai pas la réponse exacte à cette question, mais je peux t'aider ! Essaie de me demander sur les tarifs, les styles musicaux, la vidéo, le Mix & Master, ou la distribution. Tu peux aussi contacter notre équipe support via le bouton 'Nous contacter' en bas de page. 🎵";
