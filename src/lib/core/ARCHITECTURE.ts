/**
 * MELODIA CORE — Architecture Unifiée v2.0
 * ============================================================
 * 
 * PRINCIPE FONDAMENTAL: Tout passe par MelodiaCore. Rien ne le contourne.
 * 
 * Ce fichier définit l'architecture complète de la plateforme Melodia
 * après transformation en Core Central Platform.
 */

// ============================================================
// 1. MELDODIA CORE — Coordinateur Central
// ============================================================
//
// MelodiaCore est LE point d'entrée unique pour TOUTE opération.
// Aucun module ne peut effectuer d'opération sensible sans passer par Core.
//
// Flow: User Action → MelodiaCore → Permission → Credits → Execute → Register → Emit
//
// class MelodiaCore {
//   // Initialisation
//   static async forUser(userId: string): Promise<MelodiaCore>
//   
//   // Permissions
//   canPerform(operation: MelodiaOperation): boolean
//   requirePermission(operation: MelodiaOperation): void
//   
//   // Credits
//   async hasCredits(operation: CreditOperation): Promise<boolean>
//   async getWallet(): Promise<CreditWallet>
//   async purchaseCredits(packId: string): Promise<PurchaseResult>
//   
//   // AI Generation (THE way to generate)
//   async generate(ctx: GenerationContext): Promise<OrchestratorResult>
//   async getGenerationStatus(id: string): Promise<Generation>
//   async cancelGeneration(id: string): Promise<void>
//   
//   // Projects
//   async createProject(data): Promise<Project>
//   async updateProject(id, data): Promise<Project>
//   async archiveProject(id): Promise<Project>
//   async listProjects(): Promise<Project[]>
//   
//   // Media Library
//   async uploadMedia(file, meta): Promise<Media>
//   async deleteMedia(id): Promise<void>
//   async getProjectMedia(projectId): Promise<Media[]>
//   
//   // Artist Identity
//   async createArtist(data): Promise<Artist>
//   async updateArtistIdentity(id, data): Promise<Artist>
//   async getArtistIdentity(id): Promise<ArtistIdentity>
//   
//   // Notifications
//   async getNotifications(): Promise<Notification[]>
//   async markNotificationRead(id): Promise<void>
//   async getUnreadCount(): Promise<number>
//   
//   // Subscriptions
//   async changePlan(newPlan: MelodiaPlan): Promise<PlanChangeResult>
//   async getCurrentSubscription(): Promise<Subscription>
//   
//   // Context
//   getContext(): UserContext
//   setActiveContext(projectId?, artistId?): void
// }

// ============================================================
// 2. USER CONTEXT — Contexte Utilisateur
// ============================================================
//
// Construit pour CHAQUE action utilisateur. Contient tout ce dont
// le Core a besoin pour prendre des décisions.
//
// interface UserContext {
//   // Identité
//   userId: string
//   email: string
//   name: string | null
//   role: "user" | "admin"
//   plan: MelodiaPlan
//   locale: string
//   
//   // Organisation
//   organizationId: string | null
//   organizationRole: string | null
//   
//   // Abonnement
//   subscriptionStatus: "active" | "expired" | "trial" | "cancelled"
//   subscriptionId: string | null
//   planExpiresAt: Date | null
//   
//   // Crédits
//   creditBalance: number
//   creditsReserved: number
//   creditsEffective: number  // balance - reserved
//   songsRemaining: number
//   coversRemaining: number
//   videosRemaining: number
//   
//   // Permissions (pré-calculées pour ce plan)
//   permissions: MelodiaOperation[]
//   
//   // Limites d'utilisation
//   usageLimits: UsageLimits
//   
//   // Contexte actif
//   activeProjectId: string | null
//   activeArtistId: string | null
// }

// ============================================================
// 3. UNIFIED ACTION PIPELINE
// ============================================================
//
// TOUTE action suit ce pipeline:
//
// 1. AUTH    → Vérifier l'utilisateur est authentifié
// 2. CONTEXT → Construire le UserContext
// 3. PERM    → Vérifier la permission (PermissionEngine)
// 4. CREDIT  → Estimer + Vérifier + Réserver les crédits
// 5. EXECUTE → Exécuter l'action (AI, CRUD, etc.)
// 6. REGISTER→ Enregistrer les résultats (Media, Generation, etc.)
// 7. CONSUME → Consommer les crédits (ou rembourser si échec)
// 8. EMIT    → Émettre les événements (EventBus)
// 9. NOTIFY  → Notifier l'utilisateur si nécessaire

// ============================================================
// 4. PERMISSION ENGINE
// ============================================================
//
// 25 opérations, 6 plans + admin:
//
// type MelodiaOperation =
//   // Song / Audio
//   | "CREATE_SONG" | "CREATE_LYRICS" | "CREATE_AUDIO"
//   | "CREATE_COMPOSITION" | "CREATE_COVER"
//   // Video
//   | "CREATE_VIDEO" | "CREATE_STORYBOARD" | "EXPORT_VIDEO"
//   // Artist
//   | "CREATE_ARTIST" | "UPDATE_ARTIST_IDENTITY" | "VIEW_ARTIST"
//   // Project
//   | "CREATE_PROJECT" | "UPDATE_PROJECT" | "DELETE_PROJECT" | "VIEW_PROJECT"
//   // Media
//   | "UPLOAD_MEDIA" | "DELETE_MEDIA" | "VIEW_MEDIA"
//   // Studios
//   | "USE_AI_PRODUCER" | "USE_VOICE_STUDIO" | "USE_MIX_MASTER"
//   // Organization
//   | "MANAGE_ORGANIZATION" | "MANAGE_MEMBERS"
//   // Sharing
//   | "SHARE_CONTENT"
//   // Billing
//   | "PURCHASE_CREDITS" | "CHANGE_PLAN"
//   // Admin
//   | "ADMIN_ACCESS" | "ADMIN_ANALYTICS"

// ============================================================
// 5. CREDIT ENGINE — Pipeline Idempotent
// ============================================================
//
// Pipeline: estimate → check → reserve → execute → consume/refund
//
// RÈGLES:
// - Une génération ne consomme JAMAIS deux fois (idempotencyKey)
// - Si la génération échoue, les crédits sont TOUJOURS remboursés
// - Les crédits réservés sont visibles dans creditsEffective
// - Le seuil de crédits bas déclenche CREDITS_LOW event
//
// Coûts (en crédits):
//   generate_lyrics:         1
//   generate_composition:    1
//   generate_cover:          3
//   generate_audio:          2
//   generate_video_economy:  20 per 10s
//   generate_video_standard: 50 per 10s
//   generate_video_premium:  75 per 10s
//   generate_storyboard:     5
//   use_ai_producer:         3
//   use_voice_studio:        5
//   use_mix_master:          4
//   full_song:               7

// ============================================================
// 6. AI ORCHESTRATOR
// ============================================================
//
// Reçoit un GenerationContext → sélectionne modèle → génère → enregistre.
//
// interface GenerationContext {
//   user: UserContext
//   operation: CreditOperation
//   projectId?: string
//   artistId?: string
//   input: {
//     title?: string
//     style?: string
//     mood?: string
//     theme?: string
//     language?: string
//     lyrics?: string
//     additionalPrompt?: string
//     coverUrl?: string
//   }
//   quality?: "economy" | "standard" | "premium"
//   durationSeconds?: number
//   availableMediaIds?: string[]
//   artistIdentity?: ArtistIdentity
// }
//
// Provider Chain (fallback automatique):
//   TTS:    OpenAI → ElevenLabs → Mistral Voxtral → z-ai CLI
//   Cover:  DALL-E 3 → Stability AI → z-ai image
//   Video:  Replicate SVD → Luma AI → z-ai video

// ============================================================
// 7. GENERATION OBJECT — Schéma Complet
// ============================================================
//
// interface Generation {
//   id: string
//   userId: string
//   organizationId?: string
//   projectId?: string
//   artistId?: string
//   
//   // Quoi
//   operation: string        // generate_lyrics, full_song, etc.
//   provider: string         // openai, elevenlabs, mistral, etc.
//   model: string            // tts-1-hd, dall-e-3, etc.
//   
//   // Entrée
//   inputPrompt?: string
//   inputMediaIds?: string[]
//   inputParams?: Record<string, unknown>
//   
//   // Sortie
//   outputMediaIds?: string[]
//   
//   // Statut
//   status: "pending" | "processing" | "completed" | "failed" | "cancelled"
//   error?: string
//   progress: number         // 0-100
//   
//   // Crédits
//   estimatedCost: number
//   actualCost: number
//   creditsReserved: number
//   creditsConsumed: boolean
//   idempotencyKey: string   // unique
//   
//   // Timing
//   startedAt?: Date
//   completedAt?: Date
//   duration?: number        // ms
// }

// ============================================================
// 8. OUTPUT REGISTRATION
// ============================================================
//
// CHAQUE génération crée des Media records.
// Règle: Aucun output AI n'existe sans Media record.
//
// Generation → AI Output → MediaService.create() → Media record
//   → update Project.totalMedia
//   → update Generation.outputMediaIds
//   → emit MEDIA_CREATED event
//   → emit NOTIFICATION_SENT event

// ============================================================
// 9. SINGLE SOURCE OF TRUTH
// ============================================================
//
// Chaque type de données a UN service autoritatif:
//
// | Data Type     | Authoritative Service | Read From  |
// |---------------|----------------------|------------|
// | Projects      | ProjectService       | Prisma DB  |
// | Media         | MediaService         | Prisma DB  |
// | Artists       | ArtistService        | Prisma DB  |
// | Generations   | GenerationService    | Prisma DB  |
// | Credits       | CreditEngine         | Prisma DB  |
// | Notifications | NotificationService  | Prisma DB  |
// | Events        | EventBus             | Prisma DB  |
// | Permissions   | PermissionEngine     | Config + DB|
// | User Context  | buildUserContext()   | Prisma DB  |

// ============================================================
// 10. EVENT BUS
// ============================================================
//
// 26 event types (ajout de SUBSCRIPTION_CHANGED, CREDITS_PURCHASED):
//
// type CoreEvent =
//   | "GENERATION_STARTED" | "GENERATION_COMPLETED" 
//   | "GENERATION_FAILED" | "GENERATION_CANCELLED"
//   | "MEDIA_CREATED" | "MEDIA_UPLOADED" | "MEDIA_DELETED"
//   | "CREDITS_RESERVED" | "CREDITS_CONSUMED" 
//   | "CREDITS_REFUNDED" | "CREDITS_LOW" | "CREDITS_PURCHASED"
//   | "PROJECT_CREATED" | "PROJECT_UPDATED" | "PROJECT_ARCHIVED"
//   | "ARTIST_CREATED" | "ARTIST_IDENTITY_UPDATED"
//   | "SONG_CREATED" | "SONG_COMPLETED"
//   | "PLAN_CHANGED" | "PLAN_EXPIRED"
//   | "SUBSCRIPTION_CREATED" | "SUBSCRIPTION_CANCELLED"
//   | "NOTIFICATION_SENT"
//   | "EXPORT_COMPLETED" | "EXPORT_FAILED"
//
// Auto-wiring (EventBus → NotificationService):
//   GENERATION_COMPLETED → "Génération terminée"
//   GENERATION_FAILED   → "Génération échouée" + crédit remboursé
//   CREDITS_LOW         → "Crédits faibles"
//   PLAN_CHANGED        → "Plan modifié"
//   PLAN_EXPIRED        → "Plan expiré"

// ============================================================
// 11. API ARCHITECTURE
// ============================================================
//
// Toutes les routes passent par MelodiaCore:
//
// /api/core/
//   POST /generate         → Core.generate()
//   GET  /generate/[id]    → Core.getGenerationStatus()
//   POST /generate/[id]/cancel → Core.cancelGeneration()
//   
//   GET  /context          → Core.getContext()
//   GET  /permissions      → PermissionEngine.getPermissionsForPlan()
//   
//   POST /credits/purchase → Core.purchaseCredits()
//   GET  /credits/wallet   → Core.getWallet()
//   GET  /credits/history  → CreditEngine.getHistory()
//   
//   GET/POST /projects     → Core.listProjects() / Core.createProject()
//   GET/PATCH/DELETE /projects/[id] → Core.getProject() / update / archive
//   
//   POST /media/upload     → Core.uploadMedia()
//   GET  /media/project/[id] → Core.getProjectMedia()
//   DELETE /media/[id]     → Core.deleteMedia()
//   
//   GET/POST /artists      → Core.createArtist()
//   GET/PATCH /artists/[id] → Core.getArtistIdentity() / updateIdentity
//   
//   GET  /notifications    → Core.getNotifications()
//   PATCH /notifications/[id]/read → Core.markNotificationRead()
//   GET  /notifications/unread → Core.getUnreadCount()
//   
//   POST /subscriptions/change → Core.changePlan()
//   GET  /subscriptions/current → Core.getCurrentSubscription()
//
// Routes dépréciées (redirigées vers Core):
//   POST /api/generate → 308 → POST /api/core/generate

// ============================================================
// 12. FRONTEND ARCHITECTURE
// ============================================================
//
// Provider Hierarchy:
//   ThemeProvider → AuthProvider → MelodiaProvider → children
//
// Context Hooks:
//   useMelodia()     → { context, loading, error, refresh, canPerform, ... }
//   usePermissions() → { canPerform, permissions, plan, usageLimits }
//   useCredits()     → { balance, reserved, effective, ... }
//   useGenerations() → { active, recent, subscribe, unsubscribe }
//
// UI Gates:
//   <PermissionGate operation="CREATE_VIDEO">
//     <VideoStudio />
//   </PermissionGate>
//   
//   <PlanGate minPlan="artist_production">
//     <AIProducer />
//   </PlanGate>
//   
//   <CreditsGate required={20}>
//     <GenerateButton />
//   </CreditsGate>

// ============================================================
// 13. SECURITY
// ============================================================
//
// - Auth: NextAuth JWT + Middleware protection
// - Rate Limiting: Wired to ALL routes via middleware
//   - /api/core/generate: 5/min
//   - /api/core/credits/purchase: 3/min
//   - /api/auth: 10/min
//   - /api/signup: 3/hour
//   - default: 100/min
// - Ownership: PermissionEngine.checkOwnership() on every mutation
// - Idempotency: Every credit operation has unique idempotencyKey
// - Input Validation: Zod schemas on every API route
// - Audit Trail: Every action logged via EventBus → EventLog

// ============================================================
// 14. PLAN FIX — Unified Plan Names
// ============================================================
//
// OLD (seed):     decouverte, production, artiste, video, professionnel, label
// NEW (unified):  basic, artist_starter, artist_production, video_creator, artist_pro, label
//
// Migration: UPDATE "User" SET plan = CASE
//   WHEN plan = 'decouverte' THEN 'basic'
//   WHEN plan = 'artiste' THEN 'artist_starter'
//   WHEN plan = 'production' THEN 'artist_production'
//   WHEN plan = 'video' THEN 'video_creator'
//   WHEN plan = 'professionnel' THEN 'artist_pro'
//   ELSE plan END

export {};
