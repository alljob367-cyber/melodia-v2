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
