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
