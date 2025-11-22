# PowerShell script to start OAuth2 + OIDC Platform

Write-Host "🚀 Starting OAuth2 + OIDC Platform Setup..." -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Stop any existing containers
Write-Host "🧹 Cleaning up existing containers..." -ForegroundColor Yellow
docker-compose down -v
Write-Host ""

# Pull latest changes
Write-Host "📥 Pulling latest changes..." -ForegroundColor Yellow
git pull origin claude/oauth2-oidc-platform-019yyDLWheYa783Z9bgXt1bh
Write-Host ""

# Build and start services
Write-Host "🏗️  Building and starting services..." -ForegroundColor Yellow
docker-compose up -d --build
Write-Host ""

# Wait for PostgreSQL to be ready
Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15
Write-Host ""

# Run database migrations
Write-Host "📊 Running database migrations..." -ForegroundColor Yellow
docker-compose exec backend npx prisma migrate deploy
Write-Host ""

# Show status
Write-Host "📊 Container Status:" -ForegroundColor Cyan
docker-compose ps
Write-Host ""

Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Access your application:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:   http://localhost:4000" -ForegroundColor White
Write-Host "   Discovery: http://localhost:4000/.well-known/openid-configuration" -ForegroundColor White
Write-Host ""
Write-Host "📖 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Open http://localhost:3000" -ForegroundColor White
Write-Host "   2. Click 'Sign up' to create an account" -ForegroundColor White
Write-Host "   3. Login and explore the dashboard" -ForegroundColor White
Write-Host "   4. Register an OAuth client in 'Registered Clients'" -ForegroundColor White
Write-Host "   5. Add external providers in 'OAuth Providers'" -ForegroundColor White
Write-Host ""
Write-Host "📝 View logs with: docker-compose logs -f" -ForegroundColor Yellow
Write-Host "🛑 Stop services with: docker-compose down" -ForegroundColor Yellow
Write-Host ""
