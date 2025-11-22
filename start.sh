#!/bin/bash

echo "🚀 Starting OAuth2 + OIDC Platform Setup..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Stop any existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose down -v
echo ""

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin claude/oauth2-oidc-platform-019yyDLWheYa783Z9bgXt1bh
echo ""

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose up -d --build
echo ""

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10
echo ""

# Run database migrations
echo "📊 Running database migrations..."
docker-compose exec backend npx prisma migrate deploy
echo ""

# Show status
echo "📊 Container Status:"
docker-compose ps
echo ""

echo "✅ Setup Complete!"
echo ""
echo "🌐 Access your application:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:4000"
echo "   Discovery: http://localhost:4000/.well-known/openid-configuration"
echo ""
echo "📖 Next steps:"
echo "   1. Open http://localhost:3000"
echo "   2. Click 'Sign up' to create an account"
echo "   3. Login and explore the dashboard"
echo "   4. Register an OAuth client in 'Registered Clients'"
echo "   5. Add external providers in 'OAuth Providers'"
echo ""
echo "📝 View logs with: docker-compose logs -f"
echo "🛑 Stop services with: docker-compose down"
echo ""
