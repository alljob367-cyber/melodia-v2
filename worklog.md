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
