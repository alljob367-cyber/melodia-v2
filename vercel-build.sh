#!/bin/bash
# Vercel build script - installs system dependencies before Next.js build

echo "=== Installing ffmpeg for audio processing ==="

# Install ffmpeg and ffprobe (needed for beat generation, mixing, and duration detection)
if command -v apt-get &> /dev/null; then
  apt-get update -qq && apt-get install -y -qq ffmpeg 2>/dev/null && echo "✅ ffmpeg installed via apt"
elif command -v apk &> /dev/null; then
  apk add --no-cache ffmpeg 2>/dev/null && echo "✅ ffmpeg installed via apk"
else
  echo "⚠️ Cannot install ffmpeg - audio generation may fail"
fi

# Verify
command -v ffmpeg && echo "✅ ffmpeg available" || echo "❌ ffmpeg NOT available"
command -v ffprobe && echo "✅ ffprobe available" || echo "❌ ffprobe NOT available"

echo "=== Running Prisma generate + Next.js build ==="
npx prisma generate && next build
