#!/usr/bin/env bash
set -euo pipefail

echo "=== Building DAKKHO Admin for GitHub Pages ==="

# Backup original next.config.ts
if [ -f "next.config.ts" ]; then
  cp next.config.ts next.config.ts.backup
  echo "Backed up original next.config.ts"
fi

# Copy GitHub Pages config as the active next.config.ts
cp next.config.github-pages.ts next.config.ts
echo "Replaced next.config.ts with GitHub Pages configuration"

# API routes are not compatible with static export (output: 'export')
# Temporarily move them aside during the build
if [ -d "src/app/api" ]; then
  mv src/app/api src/app/api.backup
  echo "Moved API routes aside (not compatible with static export)"
fi

# Run the Next.js build (output: 'export' will produce ./out directory)
npx next build
echo "Build completed"

# Restore API routes
if [ -d "src/app/api.backup" ]; then
  mv src/app/api.backup src/app/api
  echo "Restored API routes"
fi

# Restore original config if backup exists
if [ -f "next.config.ts.backup" ]; then
  mv next.config.ts.backup next.config.ts
  echo "Restored original next.config.ts"
fi

# Add .nojekyll to prevent GitHub Pages from ignoring files starting with underscore
touch out/.nojekyll
echo "Added .nojekyll file"

echo "=== GitHub Pages build complete ==="
echo "Static files are in ./out directory, ready for deployment"
echo "Note: API routes are served by Supabase Edge Functions in production"
