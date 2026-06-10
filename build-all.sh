#!/bin/bash
# Build all DAKKHO projects

set -e

echo "🔨 Building DAKKHO projects..."

# Worker
echo "📦 Building Worker..."
cd /home/z/my-project/worker
npx wrangler deploy --dry-run

# Student SPA
echo "📱 Building Student SPA..."
cd /home/z/my-project/student-app
npm run build

# Admin SPA
echo "🖥️ Building Admin SPA..."
cd /home/z/my-project/src/..
npm run build

echo "✅ All builds complete!"
