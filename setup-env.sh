#!/bin/bash
# Setup script for environment variables
# Run this from the Pelican-frontend directory

echo "🚀 Setting up Pelican Direct API environment variables..."
echo ""

# Create .env.local for local development
echo "Creating .env.local..."
cat > .env.local << 'EOF'
NEXT_PUBLIC_BACKEND_URL=https://pelican-backend.fly.dev
EOF

# Create .env.production for Vercel deployment
echo "Creating .env.production..."
cat > .env.production << 'EOF'
NEXT_PUBLIC_BACKEND_URL=https://pelican-backend.fly.dev
EOF

echo ""
echo "✅ Environment files created!"
echo ""
echo "📄 Contents of .env.local:"
cat .env.local
echo ""
echo "📄 Contents of .env.production:"
cat .env.production
echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. Open http://localhost:3000"
echo "3. Check DevTools → Network tab for requests to pelican-backend.fly.dev"
echo "4. If working, commit and push to deploy"
echo ""

