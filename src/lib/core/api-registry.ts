/**
 * MELODIA API — Error Codes & Registry
 * 
 * Centralized error codes and API route documentation.
 * Every error code has a unique identifier, HTTP status, and message template.
 */

// ============ ERROR CODES ============

export interface ErrorCodeDef {
  code: string;
  status: number;
  message: string;
  description: string;
}

export const ERROR_CODES: Record<string, ErrorCodeDef> = {
  // Auth (401)
  UNAUTHORIZED: { code: "UNAUTHORIZED", status: 401, message: "Non autorisé", description: "Authentication requise. Le token JWT est manquant ou invalide." },
  TOKEN_EXPIRED: { code: "TOKEN_EXPIRED", status: 401, message: "Session expirée", description: "Le token JWT a expiré. Reconnectez-vous." },

  // Permissions (403)
  FORBIDDEN: { code: "FORBIDDEN", status: 403, message: "Permission refusée", description: "Votre plan ne permet pas cette opération. Passez à un plan supérieur." },
  NOT_OWNER: { code: "NOT_OWNER", status: 403, message: "Accès refusé", description: "Vous n'êtes pas le propriétaire de cette ressource." },
  ADMIN_REQUIRED: { code: "ADMIN_REQUIRED", status: 403, message: "Accès réservé à l'administration", description: "Seul un administrateur peut effectuer cette action." },

  // Not Found (404)
  NOT_FOUND: { code: "NOT_FOUND", status: 404, message: "Ressource non trouvée", description: "La ressource demandée n'existe pas ou a été supprimée." },
  USER_NOT_FOUND: { code: "USER_NOT_FOUND", status: 404, message: "Utilisateur non trouvé", description: "L'utilisateur n'existe pas ou est inactif." },
  PROJECT_NOT_FOUND: { code: "PROJECT_NOT_FOUND", status: 404, message: "Projet non trouvé", description: "Le projet n'existe pas ou vous n'y avez pas accès." },
  ARTIST_NOT_FOUND: { code: "ARTIST_NOT_FOUND", status: 404, message: "Artiste non trouvé", description: "L'artiste n'existe pas ou vous n'y avez pas accès." },
  MEDIA_NOT_FOUND: { code: "MEDIA_NOT_FOUND", status: 404, message: "Média non trouvé", description: "Le média n'existe pas ou a été supprimé." },
  GENERATION_NOT_FOUND: { code: "GENERATION_NOT_FOUND", status: 404, message: "Génération non trouvée", description: "La génération n'existe pas ou vous n'y avez pas accès." },
  PACK_NOT_FOUND: { code: "PACK_NOT_FOUND", status: 404, message: "Pack non trouvé", description: "Le pack de crédits n'existe pas ou est inactif." },
  PAYMENT_NOT_FOUND: { code: "PAYMENT_NOT_FOUND", status: 404, message: "Paiement non trouvé", description: "Le paiement n'existe pas." },

  // Validation (400)
  BAD_REQUEST: { code: "BAD_REQUEST", status: 400, message: "Requête invalide", description: "Les données envoyées ne respectent pas le schema attendu." },
  MISSING_FIELD: { code: "MISSING_FIELD", status: 400, message: "Champ manquant", description: "Un champ requis est absent de la requête." },
  INVALID_ENUM: { code: "INVALID_ENUM", status: 400, message: "Valeur invalide", description: "La valeur ne fait pas partie des options autorisées." },

  // Credits (402)
  INSUFFICIENT_CREDITS: { code: "INSUFFICIENT_CREDITS", status: 402, message: "Crédits insuffisants", description: "Vous n'avez pas assez de crédits. Achetez-en ou passez à un plan supérieur." },
  CREDITS_RESERVED: { code: "CREDITS_RESERVED", status: 409, message: "Crédits déjà réservés", description: "Une opération est déjà en cours avec ces crédits." },

  // Conflict (409)
  CONFLICT: { code: "CONFLICT", status: 409, message: "Conflit", description: "La ressource existe déjà ou est en conflit." },
  ALREADY_EXISTS: { code: "ALREADY_EXISTS", status: 409, message: "Existe déjà", description: "Une ressource avec ces identifiants existe déjà." },
  GENERATION_IN_PROGRESS: { code: "GENERATION_IN_PROGRESS", status: 409, message: "Génération en cours", description: "Une génération est déjà en cours pour ce projet." },

  // Rate Limit (429)
  RATE_LIMITED: { code: "RATE_LIMITED", status: 429, message: "Trop de requêtes", description: "Vous avez dépassé la limite de requêtes. Réessayez plus tard." },

  // Payment (503)
  PROVIDER_NOT_CONFIGURED: { code: "PROVIDER_NOT_CONFIGURED", status: 503, message: "Provider non configuré", description: "Le provider de paiement n'est pas configuré sur cette instance." },
  PAYMENT_FAILED: { code: "PAYMENT_FAILED", status: 502, message: "Paiement échoué", description: "Le provider de paiement a retourné une erreur." },
  PAYMENT_EXPIRED: { code: "PAYMENT_EXPIRED", status: 410, message: "Paiement expiré", description: "La session de paiement a expiré. Veuillez réessayer." },

  // Server (500)
  INTERNAL_ERROR: { code: "INTERNAL_ERROR", status: 500, message: "Erreur interne", description: "Une erreur inattendue s'est produite. Veuillez réessayer." },
  DB_ERROR: { code: "DB_ERROR", status: 500, message: "Erreur de base de données", description: "La base de données a retourné une erreur." },
  AI_ERROR: { code: "AI_ERROR", status: 502, message: "Erreur IA", description: "Le provider IA a retourné une erreur. Réessayez ou changez de provider." },
};

// ============ API ROUTE REGISTRY ============

export interface ApiRouteDef {
  method: string;
  path: string;
  description: string;
  requiresAuth: boolean;
  permission?: string;
  rateLimit?: { windowMs: number; max: number };
  requestSchema?: string;
  responseSchema?: string;
}

/**
 * Complete registry of all Core API routes.
 * This serves as the single source of truth for API documentation.
 */
export const API_REGISTRY: ApiRouteDef[] = [
  // ---- GENERATION ----
  { method: "POST", path: "/api/core/generate", description: "Génération IA unifiée (toutes opérations)", requiresAuth: true, permission: "varies by operation", rateLimit: { windowMs: 60_000, max: 5 }, requestSchema: "GenerateSchema", responseSchema: "GenerationResult" },
  { method: "GET", path: "/api/core/generate-status/[id]", description: "Statut d'une génération (polling)", requiresAuth: true, requestSchema: "none", responseSchema: "GenerationStatus" },

  // ---- CONTEXT & PERMISSIONS ----
  { method: "GET", path: "/api/core/context", description: "Contexte utilisateur complet (hydratation frontend)", requiresAuth: true, requestSchema: "none", responseSchema: "UserContext" },
  { method: "GET", path: "/api/core/permissions", description: "Permissions et limites du plan actuel", requiresAuth: true, requestSchema: "none", responseSchema: "PermissionsResult" },

  // ---- PROJECTS ----
  { method: "GET", path: "/api/core/projects", description: "Liste des projets de l'utilisateur", requiresAuth: true, requestSchema: "none", responseSchema: "Project[]" },
  { method: "POST", path: "/api/core/projects", description: "Créer un nouveau projet", requiresAuth: true, permission: "CREATE_PROJECT", requestSchema: "CreateProjectSchema", responseSchema: "Project" },
  { method: "GET", path: "/api/core/projects/[id]", description: "Détails d'un projet", requiresAuth: true, requestSchema: "none", responseSchema: "Project" },
  { method: "PATCH", path: "/api/core/projects/[id]", description: "Modifier un projet", requiresAuth: true, permission: "UPDATE_PROJECT", requestSchema: "UpdateProjectSchema", responseSchema: "Project" },
  { method: "DELETE", path: "/api/core/projects/[id]", description: "Archiver un projet", requiresAuth: true, permission: "DELETE_PROJECT", requestSchema: "none", responseSchema: "Project" },

  // ---- ARTISTS ----
  { method: "GET", path: "/api/core/artists", description: "Liste des artistes de l'utilisateur", requiresAuth: true, requestSchema: "none", responseSchema: "Artist[]" },
  { method: "POST", path: "/api/core/artists", description: "Créer un artiste", requiresAuth: true, permission: "CREATE_ARTIST", requestSchema: "CreateArtistSchema", responseSchema: "Artist" },
  { method: "GET", path: "/api/core/artists/[id]", description: "Identité visuelle d'un artiste", requiresAuth: true, requestSchema: "none", responseSchema: "ArtistIdentity" },
  { method: "PATCH", path: "/api/core/artists/[id]", description: "Modifier l'identité visuelle", requiresAuth: true, permission: "UPDATE_ARTIST_IDENTITY", requestSchema: "UpdateArtistIdentitySchema", responseSchema: "Artist" },

  // ---- MEDIA ----
  { method: "GET", path: "/api/core/media", description: "Liste paginée des médias", requiresAuth: true, requestSchema: "ListMediaSchema", responseSchema: "Media[] (paginated)" },
  { method: "GET", path: "/api/core/media/[id]", description: "Détails d'un média", requiresAuth: true, requestSchema: "none", responseSchema: "Media" },
  { method: "PATCH", path: "/api/core/media/[id]", description: "Modifier les métadonnées d'un média", requiresAuth: true, permission: "UPDATE_MEDIA", requestSchema: "UpdateMediaSchema", responseSchema: "Media" },
  { method: "DELETE", path: "/api/core/media/[id]", description: "Supprimer un média", requiresAuth: true, permission: "DELETE_MEDIA", requestSchema: "none", responseSchema: "none" },
  { method: "POST", path: "/api/core/media/upload", description: "Enregistrer un fichier uploadé", requiresAuth: true, permission: "UPLOAD_MEDIA", rateLimit: { windowMs: 60_000, max: 10 }, requestSchema: "UploadMediaSchema", responseSchema: "Media" },

  // ---- CREDITS ----
  { method: "GET", path: "/api/core/credits/wallet", description: "Portefeuille de crédits", requiresAuth: true, requestSchema: "none", responseSchema: "CreditWallet" },
  { method: "GET", path: "/api/core/credits/history", description: "Historique des transactions", requiresAuth: true, requestSchema: "CreditHistorySchema", responseSchema: "CreditTransaction[] (paginated)" },
  { method: "POST", path: "/api/core/credits/purchase", description: "Acheter un pack de crédits", requiresAuth: true, permission: "PURCHASE_CREDITS", rateLimit: { windowMs: 60_000, max: 3 }, requestSchema: "PurchaseCreditsSchema", responseSchema: "PaymentResult" },

  // ---- SUBSCRIPTIONS ----
  { method: "GET", path: "/api/core/subscriptions/current", description: "Abonnement actuel", requiresAuth: true, requestSchema: "none", responseSchema: "Subscription" },
  { method: "POST", path: "/api/core/subscriptions/change", description: "Changer de plan", requiresAuth: true, permission: "CHANGE_PLAN", requestSchema: "ChangePlanSchema", responseSchema: "PlanChangeResult" },

  // ---- PAYMENTS ----
  { method: "POST", path: "/api/core/payments/checkout", description: "Créer une session de paiement", requiresAuth: true, permission: "PURCHASE_CREDITS", requestSchema: "CheckoutSchema", responseSchema: "CheckoutResult" },
  { method: "POST", path: "/api/core/payments/verify", description: "Vérifier un paiement", requiresAuth: true, requestSchema: "VerifyPaymentSchema", responseSchema: "PaymentVerification" },
  { method: "POST", path: "/api/core/payments/webhook/stripe", description: "Webhook Stripe", requiresAuth: false, requestSchema: "Stripe webhook", responseSchema: "none" },
  { method: "POST", path: "/api/core/payments/webhook/wave", description: "Webhook Wave", requiresAuth: false, requestSchema: "Wave webhook", responseSchema: "none" },
  { method: "POST", path: "/api/core/payments/webhook/fpay", description: "Webhook FPay", requiresAuth: false, requestSchema: "FPay webhook", responseSchema: "none" },

  // ---- NOTIFICATIONS ----
  { method: "GET", path: "/api/core/notifications", description: "Liste paginée des notifications", requiresAuth: true, requestSchema: "ListNotificationsSchema", responseSchema: "Notification[] (paginated)" },
  { method: "PATCH", path: "/api/core/notifications", description: "Marquer toutes lues", requiresAuth: true, requestSchema: "MarkNotificationsSchema", responseSchema: "none" },
  { method: "PATCH", path: "/api/core/notifications/[id]", description: "Marquer une notification lue", requiresAuth: true, requestSchema: "none", responseSchema: "Notification" },
  { method: "GET", path: "/api/core/notifications/unread", description: "Compteur de non lues", requiresAuth: true, requestSchema: "none", responseSchema: "UnreadCount" },

  // ---- STUDIOS ----
  { method: "POST", path: "/api/core/studios/audio/generate", description: "Audio Studio: lyrics, audio, mix, full_song", requiresAuth: true, permission: "varies by operation", rateLimit: { windowMs: 60_000, max: 5 }, requestSchema: "AudioStudioSchema", responseSchema: "GenerationInit" },
  { method: "POST", path: "/api/core/studios/video/generate", description: "Video Studio: cover, video, storyboard", requiresAuth: true, permission: "varies by operation", rateLimit: { windowMs: 60_000, max: 5 }, requestSchema: "VideoStudioSchema", responseSchema: "GenerationInit" },
  { method: "POST", path: "/api/core/studios/artist/identity", description: "Artist Studio: identity, AI producer, voice, analytics", requiresAuth: true, permission: "varies by action", requestSchema: "ArtistStudioSchema", responseSchema: "varies by action" },
];

/**
 * Get API route by path and method
 */
export function getApiRoute(method: string, path: string): ApiRouteDef | undefined {
  return API_REGISTRY.find((r) => r.method === method && r.path === path);
}

/**
 * Get all routes for a specific prefix
 */
export function getRoutesByPrefix(prefix: string): ApiRouteDef[] {
  return API_REGISTRY.filter((r) => r.path.startsWith(prefix));
}
