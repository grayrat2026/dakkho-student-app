#!/bin/bash
# DAKKHO Infrastructure Setup Script
# Run this to configure Cloudflare Worker secrets
# IMPORTANT: Never store actual token values in this file!
# Run each command manually and paste the token value when prompted.

echo "🔐 Setting up Cloudflare Worker secrets..."
echo "⚠️  You will be prompted to enter each secret value manually."
echo ""

cd /home/z/my-project/worker

# R2 API Tokens (NEVER expose to client)
echo "Setting R2_ACCOUNT_TOKEN..."
npx wrangler secret put R2_ACCOUNT_TOKEN

echo "Setting R2_STUDENT_UPLOAD_TOKEN..."
npx wrangler secret put R2_STUDENT_UPLOAD_TOKEN

echo "Setting R2_S3_ENDPOINT..."
npx wrangler secret put R2_S3_ENDPOINT

echo "Setting R2_S3_ACCESS_KEY_ID..."
npx wrangler secret put R2_S3_ACCESS_KEY_ID

echo "Setting R2_S3_SECRET_ACCESS_KEY..."
npx wrangler secret put R2_S3_SECRET_ACCESS_KEY

echo "Setting R2_STUDENT_ACCESS_KEY..."
npx wrangler secret put R2_STUDENT_ACCESS_KEY

echo "Setting R2_STUDENT_SECRET_KEY..."
npx wrangler secret put R2_STUDENT_SECRET_KEY

echo "✅ All secrets configured!"
echo ""
echo "⚠️ IMPORTANT: These secrets are stored in Cloudflare Workers and NEVER exposed to the client."
