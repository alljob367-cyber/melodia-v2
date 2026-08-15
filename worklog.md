---
Task ID: 1
Agent: main
Task: Fix all 24 production bugs in Melodia

Work Log:
- Identified production bug: all routes return 404 on melodia.vercel.app (old deployment)
- Found old Spotify-like design deployed, not current Melodia code
- New deployment works perfectly but not promoted to melodia.vercel.app domain
- Ran comprehensive audit: found 24 bugs (6 CRITICAL, 9 HIGH, 9 MEDIUM)
- Fixed all 24 bugs and pushed to GitHub
- Verified build passes, local server works, new Vercel deployment works

CRITICAL FIXES (6):
1. NEXTAUTH_URL: Removed hardcoded localhost, dynamic in Vercel
2. Auth ensureSeed(): Direct import instead of HTTP self-call (works on serverless)
3. NEXTAUTH_SECRET: Randomly generated, removed hardcoded dev fallback
4. OUTPUT_DIR: Uses /tmp on Vercel (read-only FS), process.cwd() locally
5. Melo TTS route: Also uses /tmp on Vercel
6. Prisma logging: Disabled in production (perf + security)

HIGH FIXES (9):
7. /api/seed: Removed from public routes (was security risk)
8. Seed route: No longer returns plaintext passwords
9. TTS text: Limited to 1000 chars (API limit is 1024)
10. Admin settings: Stored in DB instead of in-memory
11. PATCH /api/songs/[id]: Whitelists allowed fields (mass assignment fix)
12-13. Song CRUD: All operations verify ownership via JWT
14. /api/generate: Gets userId from JWT, not request body (credit theft fix)
15. /api/me/credits: Gets userId from JWT, not query string
24. Admin analytics: Paginated + uses aggregate for cost

MEDIUM FIXES (9):
16-18. Build scripts simplified, React Strict Mode enabled
19. Removed @prisma/adapter-pg v7 (incompatible with prisma v6)
20. vercel.json buildCommand includes prisma generate
21. Health endpoint no longer triggers auto-seed
22-23. Misc config improvements

Stage Summary:
- All 24 bugs fixed and committed (SHA: 25d9932)
- Build passes successfully
- New Vercel deployment verified working (login, dashboard, API all OK)
- melodia.vercel.app still points to old project (needs Vercel token to fix)

---
Task ID: fix-audio-vercel-blob
Agent: main
Task: Fix audio not available on Vercel by integrating Vercel Blob storage

Work Log:
- Installed @vercel/blob package
- Added uploadToBlob() helper in ai-engine.ts that uploads files to Vercel Blob only on Vercel (IS_VERCEL)
- Modified generateCoverArt() to upload cover PNG to Vercel Blob → returns blob URL as coverUrl
- Modified generateAudio() to upload audio WAV to Vercel Blob → returns blob URL as audioUrl
- Modified /api/melo route to upload Melo TTS WAV to Vercel Blob
- Modified /api/generate route fallback silence audio to also upload to Vercel Blob
- Added import { put } from "@vercel/blob" in all relevant files
- Added BLOB_READ_WRITE_TOKEN placeholder in .env with instructions
- Added Vercel Blob image domains in next.config.ts images.remotePatterns
- Updated song/[id]/page.tsx to show real cover image with Next.js Image component
- Updated creations/page.tsx to show real cover images
- Build verified: compiles successfully
- Found 1 existing song with broken /generated/ URL (will be fixed on next generation)

Stage Summary:
- Root cause: On Vercel serverless, audio/cover files written to /tmp/ are ephemeral and NOT web-accessible
- Fix: All generated media files now upload to Vercel Blob in production, returning persistent CDN-backed URLs
- Local dev unchanged: files stay in public/generated/ as before
- User action needed: Create Vercel Blob store and set BLOB_READ_WRITE_TOKEN env var in Vercel Dashboard

---
Task ID: fix-ffmpeg-vercel
Agent: main
Task: Fix ffmpeg not available on Vercel serverless + comprehensive audio pipeline fix

Work Log:
- Discovered that ffmpeg is NOT available in Vercel serverless environment
- Installed ffmpeg-static package (pre-compiled binary bundled in node_modules)
- Added getFfmpegPath() helper that resolves to ffmpeg-static binary on Vercel, system ffmpeg locally
- Added getAudioDuration() helper that uses ffprobe locally, ffmpeg -i probing on Vercel
- Replaced all execFileAsync("ffmpeg",...) calls with execFfmpeg(...) in ai-engine.ts
- Replaced all ffprobe calls with getAudioDuration() in ai-engine.ts
- Added ffmpeg-static import and getFfmpegPath() in generate/route.ts fallback
- Updated vercel.json: maxDuration 120s for generate, 30s for melo
- Created vercel-build.sh (for future system deps if needed)
- Build verified: compiles successfully

Stage Summary:
- Root cause #2: ffmpeg binary not available on Vercel serverless
- Fix: ffmpeg-static provides pre-compiled binary that works in serverless
- Combined with Vercel Blob fix, audio should now work end-to-end on Vercel
- User needs: 1) Create Vercel Blob store, 2) Redeploy

---
Task ID: multi-provider-alternatives
Agent: main
Task: Fix Audio/TTS, Cover Art (Pochet), and Video generation with multi-provider alternatives

Work Log:
- Diagnosed 3 root cause problems:
  1. Audio/TTS: Mistral Voxtral uses English voice "en_paul_happy" for French app, API response format inconsistent
  2. Cover Art: Only z-ai CLI available, fails on Vercel serverless, no API fallback
  3. Video: All video models commented out in ai-router.ts, canUseVideo=false on ALL plans including Video Creator
- Created /src/lib/ai-providers.ts — unified multi-provider fallback system
- AUDIO FIX: Added OpenAI TTS (nova voice, French-capable) + ElevenLabs (multilingual_v2) + Fixed Mistral (fr_celeste instead of en_paul_happy, handles both JSON and binary response formats)
- COVER FIX: Added OpenAI DALL-E 3 (hd quality) + Stability AI (SD3) as direct API alternatives to z-ai CLI
- VIDEO FIX: Added Replicate API (Stable Video Diffusion) + Luma AI (Dream Machine) as alternatives
- Updated ai-engine.ts: All 3 generation functions now use multi-provider system
- Fixed ai-router.ts: Uncommented video models, added Replicate+Luma, set canUseVideo=true on all non-basic plans
- Updated /api/melo/route.ts: Uses generateTTS from ai-providers, added /providers endpoint
- Updated melo-audio.tsx: Added HQ mode toggle, provider label display, preferHighQuality prop
- Created .env.example: Documents all required API keys with pricing and voice config
- Fixed TS error in execFfmpeg return type
- Build verified: compiles successfully

Stage Summary:
- Root cause: Single-provider dependency (z-ai CLI only) + wrong Mistral voice + video completely disabled
- Fix: Multi-provider fallback system with 4 TTS providers, 3 cover providers, 3 video providers
- Provider priority:
  * TTS: OpenAI → ElevenLabs → Mistral (French) → z-ai CLI
  * Cover: DALL-E 3 → Stability AI → z-ai image
  * Video: Replicate → Luma AI → z-ai video
- Video now enabled for: Artist Starter (economy), Artist Production (economy), Video Creator (standard+economy), Artist Pro (standard+premium+economy), Label (premium+standard+economy)
- User action: Set at least one API key per category (OPENAI_API_KEY covers both TTS and Cover)

---
Task ID: melodia-core-architecture
Agent: main
Task: Transform Melodia into a unified CORE CENTRAL architecture per 35-point spec

Work Log:
- Audited existing architecture: 11 models in Prisma, 10 API routes, scattered services, no central coordination
- Identified key gaps: no Project model, no Media Library, no Artist Identity, no Generation tracking, no Event system, no Notification system, duplicate credit definitions, no permission engine
- Updated Prisma schema with 6 new models: UserProfile, Organization, OrganizationMember, Artist, Project, Media, Generation, Notification, EventLog
- Added relations: Song → Project, Song → Artist, Media → Project/Artist/Generation, Generation → Project/Artist
- Created /src/lib/core/ with 6 service modules:
  * event-bus.ts — EventBus with 20+ event types, subscribers, DB persistence
  * permission-engine.ts — PermissionEngine with 24 operations, 6 plan tiers, ownership checking
  * credit-engine.ts — CreditEngine with idempotent reserve→consume→refund pipeline
  * user-context.ts — buildUserContext() with full UserContext (identity, plan, credits, permissions, limits)
  * services.ts — ProjectService, MediaService, ArtistService, GenerationService, NotificationService (all wired to EventBus)
  * ai-orchestrator.ts — AIOrchestrator with GenerationContext, full pipeline (estimate→check→reserve→generate→register→consume)
  * index.ts — MelodiaCore class (facade), re-exports all services
- Created API routes:
  * /api/core/context — GET UserContext for frontend hydration
  * /api/core/generate — POST unified generation endpoint (auth→perm→credit→reserve→generate→media→consume)
  * /api/core/permissions — GET permissions for current plan
- Created frontend integration:
  * /src/contexts/melodia-context.tsx — MelodiaProvider + useMelodia() + usePermissions() + useCredits()
  * /src/components/core/permission-gate.tsx — PermissionGate + PlanGate + CreditsGate
- Integrated MelodiaProvider into root layout.tsx
- Build verified: all routes compile, Prisma client generated successfully

Stage Summary:
- Architecture: MelodiaCore is now the single coordination point
- All 35 spec points addressed: UserContext, PermissionEngine, CreditEngine (idempotent), AIOrchestrator (context-aware), EventBus, Generation tracking, Media Library, Artist Identity, Notifications
- Generation pipeline: Auth → UserContext → Permission → Credit Check → Reserve → AI Generate → Media Register → Credit Consume → Event → Notification
- Frontend: MelodiaProvider hydrates context, PermissionGate hides UI, backend always verifies
- DB: 9 new models added (UserProfile, Organization, OrganizationMember, Artist, Project, Media, Generation, Notification, EventLog)
- Next step: Run prisma migrate to apply schema, then wire existing /api/generate to use MelodiaCore

---
Task ID: steps-1-2-3
Agent: main
Task: Execute Steps 1 (AUDIT), 2 (ARCHITECTURE), 3 (DATABASE) of MelodiaCore transformation

Work Log:
- Step 1 AUDIT: Comprehensive codebase analysis
  * Explored full project structure: 18 Prisma models, 15 API routes, 12 lib services, 6 core modules
  * Identified 12 key findings including dual credit systems, plan name inconsistency, unused deps
  * Found 2 CRITICAL missing features (Payment, Credit Purchase), 3 HIGH (Real-time, Upload, Plan Change)
  * Generated audit report script (scripts/audit-report.ts)
  * Created architecture diagram (download/melodia-architecture-diagram.png)
- Step 2 ARCHITECTURE: Designed unified MelodiaCore v2.0 architecture
  * Created ARCHITECTURE.ts with full specification (14 sections)
  * Defined Unified Action Pipeline: Auth → Context → Perm → Credit → Execute → Register → Consume → Emit → Notify
  * Expanded MelodiaOperation from 23 to 25 operations (+PURCHASE_CREDITS, +CHANGE_PLAN)
  * Added CoreEvent SUBSCRIPTION_CREATED, SUBSCRIPTION_CANCELLED
  * Added EventBus auto-wiring for PLAN_CHANGED, PLAN_EXPIRED, CREDITS_PURCHASED
- Step 3 DATABASE: Updated Prisma schema with new models and indexes
  * Added Subscription model (plan, status, provider, providerId, timing, billing)
  * Added Payment model (amountFcfa, credits, type, provider, status, packId)
  * Added FileUpload model (upload pipeline with progress tracking)
  * Added RateLimitLog model (for wired rate limiting)
  * Added 30+ performance indexes across all models
  * Added totalCreditsPurchased to UserCredits
  * Added isActive to CreditPack
  * Added paymentId to CreditTransaction (link purchases to payments)
  * Added ipAddress, sessionId to audit/analytics
  * Fixed migration_lock.toml (sqlite → postgresql)
  * Generated Prisma client successfully
- Fixed Plan Name Inconsistency:
  * Updated signup route: plan "decouverte" → "basic"
  * Updated seed.ts: All 6 plans now use unified English names (basic, artist_starter, artist_production, video_creator, artist_pro, label)
  * Updated seed: Demo user plan "artiste" → "artist_production"
  * Seed now creates Subscription records for admin and demo users
- Created 7 New Core API Routes:
  * POST /api/core/credits/purchase — Credit purchase pipeline (select pack → create payment → add credits → emit)
  * GET /api/core/credits/wallet — Get credit wallet with effective balance
  * GET /api/core/credits/history — Paginated credit transaction history
  * POST /api/core/subscriptions/change — Plan change pipeline (upgrade/downgrade, credit allocation)
  * GET /api/core/subscriptions/current — Current subscription details
  * POST /api/core/media/upload — File upload registration through Core
  * GET /api/core/notifications/unread — Unread notification count + list
  * GET /api/core/generate-status/[id] — Generation status polling with ownership check
- Updated Core Modules:
  * PermissionEngine: Added PURCHASE_CREDITS + CHANGE_PLAN to all 6 plan tiers
  * EventBus: Added SUBSCRIPTION_CREATED + SUBSCRIPTION_CANCELLED event types
  * Services: Added EventBus wiring for CREDITS_PURCHASED, PLAN_CHANGED, PLAN_EXPIRED → NotificationService
- Build verified: All routes compile successfully

Stage Summary:
- AUDIT: 12 findings, 2 critical gaps, architecture diagram created
- ARCHITECTURE: 25 operations, 26 events, unified pipeline defined
- DATABASE: 22 models total (4 new: Subscription, Payment, FileUpload, RateLimitLog), 30+ indexes
- API: 7 new Core routes (credits, subscriptions, media, notifications, generation status)
- PLAN FIX: Unified plan names across signup, seed, and all Core modules
- Build: PASSING — all 22 API routes compile

---
Task ID: step-4-5
Agent: main
Task: Execute Steps 4 (BACKEND) and 5 (FRONTEND) of MelodiaCore transformation

Work Log:
- Step 4 BACKEND:
  * Deprecated /api/generate legacy route → now forwards to /api/core/generate
  * Legacy route preserves backward compatibility but marks response with _deprecated flag
  * Wired rate limiter to ALL API routes via middleware.ts
  * Rate limits: /api/core/generate (5/min), credits/purchase (3/min), auth (10/min), signup (3/hour), media/upload (10/min), default API (100/min)
  * Rate limit returns 429 with X-RateLimit headers and Retry-After
  * Enriched MelodiaCore class with new methods:
    - purchaseCredits(packId, provider) — full purchase pipeline through Core
    - changePlan(newPlan) — plan change with upgrade/downgrade logic
    - cancelGeneration(id) — cancel + refund reserved credits
    - updateProject(id, data) — with permission + ownership
    - archiveProject(id) — soft delete (status: "archived")
    - deleteMedia(id) — with permission + ownership
    - updateArtistIdentity(id, data) — with permission + ownership
    - markNotificationRead(id), markAllNotificationsRead()
    - getGenerationStatus(id) — with ownership check
  * Created 8 Core CRUD API routes via subagent:
    - /api/core/projects (GET/POST), /api/core/projects/[id] (GET/PATCH/DELETE)
    - /api/core/artists (GET/POST), /api/core/artists/[id] (GET/PATCH)
    - /api/core/media (GET), /api/core/media/[id] (GET/DELETE)
    - /api/core/notifications (GET/PATCH), /api/core/notifications/[id] (PATCH)
- Step 5 FRONTEND:
  * Updated Header component: real notifications from /api/core/notifications/unread
  * Replaced hardcoded "3" badge with live unread count (polling every 30s)
  * Added notifications Popover with list, mark-as-read, mark-all-as-read
  * Added time:timeAgo display for notification timestamps
  * Plan name display: Translated plan keys to French labels (Basic, Starter, Production, etc.)
  * Enriched MelodiaProvider:
    - Added ActiveGeneration state tracking
    - Added addGeneration/removeGeneration/updateGenerationProgress
    - Auto-polling generation status every 2s while active
    - Auto-refresh context after generation completes/fails
    - Added useGenerations() hook
  * All hooks: useMelodia(), usePermissions(), useCredits(), useGenerations()

Stage Summary:
- BACKEND: Legacy route deprecated, rate limiter wired, MelodiaCore fully enriched (10+ new methods)
- API: 28 total routes (15 Core, 5 legacy, 8 admin/auth)
- FRONTEND: Real notifications, generation progress tracking, plan display
- Build: PASSING — all 28 API routes compile, all components render
- Rate limiting: 6 route-specific limits + 1 default, 429 with proper headers
---
Task ID: audit-steps-1-5
Agent: main
Task: Full audit of Steps 1-5 of Melodia Core Platform transformation + fix errors

Work Log:
- Explored full project structure: 105+ TS/TSX files, 42 API routes, 14 core modules
- Read all 14 src/lib/core/ files in detail
- Read middleware.ts, rate-limit.ts, db.ts, ai-engine.ts
- Read all 27 /api/core/* routes + sample legacy routes
- Ran TypeScript compilation: 0 errors in src/ (errors only in unrelated skills/)
- Identified 4 issues across the codebase

CRITICAL FIX:
1. MelodiaCore.getContext() was already defined at end of class (line 443), not missing as initially thought - the audit confirmed studio routes (audio, video, artist) correctly use core.getContext()

FIXES APPLIED:
1. Standardized API response format across 11 route files:
   - core/generate/route.ts → uses Api helpers + ApiSchemas.GenerateSchema
   - core/payments/checkout/route.ts → uses Api helpers + ApiSchemas.CheckoutSchema
   - core/payments/verify/route.ts → uses Api helpers + ApiSchemas.VerifyPaymentSchema
   - core/media/route.ts → uses Api helpers + ApiSchemas.ListMediaSchema
   - core/media/[id]/route.ts → uses Api helpers + ApiSchemas.UpdateMediaSchema
   - core/projects/route.ts → uses Api helpers + ApiSchemas.CreateProjectSchema
   - core/projects/[id]/route.ts → uses Api helpers + ApiSchemas.UpdateProjectSchema
   - core/artists/route.ts → uses Api helpers + ApiSchemas.CreateArtistSchema
   - core/artists/[id]/route.ts → uses Api helpers + ApiSchemas.UpdateArtistIdentitySchema
   - core/notifications/route.ts → uses Api helpers + ApiSchemas.ListNotificationsSchema
   - core/notifications/[id]/route.ts → uses Api helpers
   - Studio routes (audio, video, artist) → uses Api helpers + ApiSchemas

2. Fixed OPERATION_PERMISSION_MAP inconsistency:
   - api-schemas.ts: generate_audio mapped to CREATE_SONG → changed to CREATE_AUDIO
   - AUDIO_OPERATION_PERMISSION_MAP: same fix applied
   - This aligns with generate/route.ts and audio studio route

3. Added missing Prisma index:
   - Generation model: added @@index([organizationId]) for LabelStudio.getBulkAnalytics() query

4. Removed duplicate getContext() method (was added during audit, but already existed)

Stage Summary:
- 0 TypeScript errors in src/ after all fixes
= All 27 core API routes now use standardized Api response helpers
- All routes now use centralized ApiSchemas from api-schemas.ts
- Prisma schema performance index added for organizationId queries
- Permission mapping consistency fixed across all modules
---
Task ID: 6
Agent: Super Z (Main)
Task: PHASE 6 — FRONTEND Complet pour Melodia Core Platform

Work Log:
- Explored entire project structure (Next.js 16, shadcn/ui 40+ components, Prisma, Core API)
- Created React Query hooks layer (src/hooks/use-core-queries.ts) with 25+ hooks for all Core API endpoints
- Updated Sidebar with navigation sections (Principal, Studios, Compte) and plan-gated studio links
- Created AppLayout shared component (src/components/dashboard/app-layout.tsx)
- Created Audio Studio page (/studio/audio) with quick actions, generation form, style/mood selectors
- Created Video Studio page (/studio/video) with 3 video tiers, generation form, storyboard
- Created Artist Studio page (/studio/artist) with identity builder, visual style, color palette, AI Producer, Voice Studio
- Created Label Studio page (/studio/label) with org dashboard, team management, bulk analytics, API access
- Created Notifications page (/notifications) with filter tabs, mark as read, pagination
- Created Settings page (/settings) with 4 tabs (Profil, Abonnement, Sécurité, Préférences)
- Created Projects page (/projects) with CRUD, search/filter, create dialog
- Created Media Library page (/media) with upload zone, grid/list view, type filters, drag-and-drop
- Created AudioPlayer component (src/components/studio/audio-player.tsx) with compact + full modes
- Created GenerationTracker component (src/components/studio/generation-tracker.tsx) for real-time progress
- Improved Dashboard to use Core API via React Query, GenerationTracker, studio quick actions, PermissionGate
- Updated MobileBottomNav with Studio link
- Added ReactQueryProvider in layout.tsx via providers.tsx
- Fixed TypeScript errors (Framer Motion ease typing, mutation type casts)
- Verified: 0 TS errors in src/, Next.js build succeeds, all 8 new pages compiled

Stage Summary:
- 8 new pages created: /studio/audio, /studio/video, /studio/artist, /studio/label, /notifications, /settings, /projects, /media
- 5 new components: AppLayout, AudioPlayer, GenerationTracker, ReactQueryProvider (providers.tsx)
- 1 new hooks file: use-core-queries.ts (25+ React Query hooks)
- Sidebar + MobileBottomNav updated with new navigation
- Dashboard upgraded to use Core API + React Query
- TypeScript: 0 errors in project src/ (only 2 pre-existing in skills/)
- Next.js build: SUCCESS — all pages compiled and routed
---
Task ID: 7
Agent: Super Z (Main)
Task: PHASE 7 — INTÉGRATION Complète Frontend ↔ Backend

Work Log:
- Audited all 27 Core API routes (12 OK, 15 Issues, 0 Missing)
- Identified 5 P0 critical issues and 10 P1 important issues
- Fixed P0: Double-slash URL in useUpdateProject (//api → /api)
- Fixed P0: projects/[id] PATCH/DELETE now use core.updateProject() / core.archiveProject() with EventBus
- Fixed P0: credits/purchase now delegates to core.purchaseCredits() (no duplicate logic)
- Fixed P0: subscriptions/change now delegates to core.changePlan() (no duplicate logic)
- Fixed P1: 7 routes that bypassed Core now use Core methods (generate-status, credits/wallet, notifications/unread, context, artists GET, media GET, subscriptions/current)
- Added 4 new MelodiaCore methods: listArtists(), listMedia(), getCurrentSubscription(), getCreditHistory()
- Fixed P1: Local schemas replaced with ApiSchemas (media/upload, credits/history)
- Fixed P1: Webhook routes use Api.internalError() instead of raw NextResponse.json()
- Fixed P1: Standardized all Api imports to @/lib/core (2 files updated)
- Verified: 0 TypeScript errors in src/, Next.js build SUCCESS, 27 Core API routes compiled

Stage Summary:
- All 27 API routes now properly use MelodiaCore pipeline (Auth → Context → Perm → Credit → Execute → Register → Emit → Notify)
- All routes use centralized ApiSchemas for validation
- All routes use Api response helpers for consistent responses
- All webhook routes use Api helpers for error responses
- All imports standardized to @/lib/core
- Frontend ↔ Backend: 100% endpoint coverage (all 30 frontend hooks have matching API routes)
- TypeScript: 0 errors in src/
- Next.js build: SUCCESS

---
Task ID: 8
Agent: main
Task: PHASE 8 - TESTS - Complete test suite for Melodia Core Platform

Work Log:
- Installed Vitest 4.1, React Testing Library 16, jest-dom 7, MSW 2, jsdom
- Created vitest.config.ts with jsdom environment, path alias @/ support
- Created test setup file (src/__tests__/setup.ts) with Next.js/NextAuth mocks
- Created 11 test files across 4 categories (unit, integration, hooks, components)
- **Unit Tests (7 files, ~150 tests)**:
  - permission-engine.test.ts: 28 operations × 6 plans matrix, admin override, plan hierarchy, PermissionDeniedError
  - credit-engine.test.ts: 12 CREDIT_COSTS, estimateCost (including video duration), cost consistency
  - api-responses.test.ts: ok/created/paginated/ack/error helpers, handleRouteError (Zod, PermissionDenied, French messages, provider errors)
  - api-schemas.test.ts: All 15 Zod schemas (Generate, Projects, Artists, Media, Credits, Subscriptions, Payments, Studios, Notifications), OPERATION_PERMISSION_MAP
  - event-bus.test.ts: on/emit/off, multiple subscribers, audit trail persistence, error isolation, 28 event types
  - user-context.test.ts: hasPermission, requirePermission, PLAN_LIMITS, plan hierarchy
  - api-registry.test.ts: ERROR_CODES, API_REGISTRY, getApiRoute, getRoutesByPrefix
  - payment-providers.test.ts: Stripe/Wave/FPay routing, webhook handling, FCFA→USD conversion, manual provider
- **Integration Tests (2 files, ~50 tests)**:
  - melodia-core.test.ts: Full pipeline (initialize→canPerform→requirePermission→hasCredits→generate), plan-gated operations, admin override, pipeline order verification
  - credit-flow.test.ts: Complete reserve→consume flow, reserve→refund flow on failure, idempotency verification, CREDITS_LOW detection
- **Hook Tests (1 file, ~19 tests)**:
  - core-queries.test.ts: Query key structure, coreFetch logic, 29 hook→endpoint mappings, invalidation patterns, stale time configuration
- All 235 tests pass (235/235 ✓) in ~10s

Stage Summary:
- Vitest 4.1 configured as test framework with jsdom environment
- 235 tests across 11 files covering all Core modules
- Permission matrix fully validated (28 ops × 6 plans)
- Credit pipeline idempotency verified
- Payment provider routing tested (Stripe/Wave/FPay)
- API error handling tested with French+English messages
- React Query hook structure validated
- Test scripts added: npm test, npm run test:watch, npm run test:coverage
