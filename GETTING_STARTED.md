# Getting Started with Identity Verification Workflow System

This guide will help you get up and running with the Identity Verification Workflow System backend in minutes.

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18 or higher ([download](https://nodejs.org/))
- **pnpm** 8+ (`npm install -g pnpm`)
- **PostgreSQL** 14+ ([download](https://www.postgresql.org/download/))
- **Redis** 6+ ([download](https://redis.io/download))
- **Docker & Docker Compose** (optional, for containerized setup)

Verify installations:
```bash
node --version    # v18.x.x or higher
pnpm --version    # 8.x.x or higher
psql --version    # PostgreSQL 14+
redis-cli --version  # redis-cli 6+
```

## 🚀 Quick Start (5 minutes)

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies
```bash
pnpm install
```

This installs all required packages from `package.json`.

### 3. Setup Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local` with your local database credentials:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/verification_dev"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key-change-this-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-change-this"
API_PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
```

### 4. Setup Database
```bash
# Create database (if not exists)
# psql -U postgres -c "CREATE DATABASE verification_dev;"

# Generate Prisma client
pnpm run prisma:generate

# Run migrations
pnpm run db:migrate

# Seed with sample data
pnpm run db:seed
```

### 5. Start Development Server
```bash
pnpm run dev
```

You should see:
```
▲ [v0] Starting Identity Verification API Server
✓ Successfully connected to database
✓ Successfully connected to Redis
✓ Server running on http://localhost:3000
✓ API documentation: http://localhost:3000/api-docs
```

## 🧪 Testing the API

### 1. Health Check
```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-06-10T00:00:00Z"
}
```

### 2. Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "role": "CUSTOMER"
  }'
```

Response:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "CUSTOMER",
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### 3. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

### 4. Create Verification Request
```bash
curl -X POST http://localhost:3000/api/verifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "userId": "user-id-from-login",
    "type": "identity_verification"
  }'
```

## 📚 Available Scripts

Run these commands from the `backend/` directory:

### Development
```bash
pnpm run dev              # Start dev server with hot reload
pnpm run build            # Compile TypeScript to JavaScript
pnpm run start            # Start production server
```

### Database
```bash
pnpm run db:migrate       # Create/update migrations
pnpm run db:push          # Push schema to database
pnpm run db:seed          # Populate sample data
pnpm run db:reset         # Reset database (⚠️ deletes all data)
pnpm run prisma:generate  # Generate Prisma client
```

### Code Quality
```bash
pnpm run test             # Run tests
pnpm run test:coverage    # Run tests with coverage
pnpm run lint             # Check code style
pnpm run lint:fix         # Auto-fix style issues
pnpm run format           # Format code with Prettier
```

### Docker
```bash
pnpm run docker:build     # Build Docker image
pnpm run docker:up        # Start Docker containers
pnpm run docker:down      # Stop Docker containers
```

## 🐳 Docker Quick Start

If you prefer using Docker instead of local PostgreSQL/Redis:

```bash
# From backend directory
pnpm run docker:up

# Verify services are running
docker-compose ps

# View logs
docker-compose logs -f backend

# Stop services
pnpm run docker:down
```

Docker Compose starts:
- **Backend API** on `http://localhost:3000`
- **PostgreSQL** on `localhost:5432`
- **Redis** on `localhost:6379`

## 📖 API Documentation

### Swagger UI (Recommended)
Once the server is running, visit:
```
http://localhost:3000/api-docs
```

This provides interactive API documentation where you can:
- See all endpoints
- View request/response schemas
- Test endpoints directly

### Manual Documentation
See detailed API documentation:
- `docs/API.md` - Complete endpoint reference
- `docs/ARCHITECTURE.md` - System design
- `docs/DEPLOYMENT.md` - Production setup

## 🔐 Authentication Flow

The API uses JWT-based authentication:

1. **Register/Login** - Get access token + refresh token
2. **Use Access Token** - Add to `Authorization: Bearer <token>` header
3. **Token Expires** - Use refresh token to get new access token
4. **Logout** - Invalidate tokens

Example authenticated request:
```bash
curl http://localhost:3000/api/verifications \
  -H "Authorization: Bearer eyJhbGc..."
```

## 🎯 Common Tasks

### Create a New Database Migration
```bash
pnpm run db:migrate
# Follow the prompts to name and create the migration
```

### Add a New User Role
1. Update `prisma/schema.prisma` - Add role to `Role` enum
2. Run migration: `pnpm run db:migrate`
3. Add permissions in the database

### Deploy to Production
See `docs/DEPLOYMENT.md` for:
- Environment configuration
- Database setup (managed services)
- Security hardening
- Monitoring setup

### Fix Code Style Issues
```bash
pnpm run lint:fix   # ESLint fixes
pnpm run format     # Prettier formatting
```

## 🐛 Troubleshooting

### "Cannot connect to database"
- Verify PostgreSQL is running: `psql -U postgres -l`
- Check `DATABASE_URL` in `.env.local`
- Ensure database exists: `createdb verification_dev`

### "Cannot connect to Redis"
- Verify Redis is running: `redis-cli ping`
- Check `REDIS_URL` in `.env.local`
- For Docker: ensure Redis container is running

### "Port 3000 already in use"
- Change `API_PORT` in `.env.local`, or
- Kill process: `lsof -ti:3000 | xargs kill -9`

### "TypeScript compilation errors"
- Regenerate Prisma client: `pnpm run prisma:generate`
- Install types: `pnpm install`
- Check TypeScript version matches `tsconfig.json`

### Database migration failed
```bash
# View migration status
npx prisma migrate status

# Reset to fix issues (⚠️ deletes data)
pnpm run db:reset
```

## 📁 Project Structure Quick Reference

```
backend/
├── src/
│   ├── config/          # Configuration
│   ├── middleware/      # Middleware (auth, error, rate limit)
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   ├── utils/           # Utilities (JWT, passwords, logging)
│   └── index.ts         # App entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── docs/                # Documentation
├── dist/                # Compiled JavaScript (created after `build`)
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Docker Compose config
├── package.json         # Dependencies
└── .env.local          # Environment variables (local only)
```

## 🔗 Useful Resources

- **API Documentation**: See `docs/API.md`
- **System Architecture**: See `docs/ARCHITECTURE.md`
- **Deployment Guide**: See `docs/DEPLOYMENT.md`
- **Database Schema**: See `prisma/schema.prisma`
- **Example Tests**: See `src/services/__tests__/`

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Server runs: `pnpm run dev`
- [ ] Database connected (migration succeeds)
- [ ] Redis connected (rate limiting works)
- [ ] Can register user
- [ ] Can login and get tokens
- [ ] Can access protected endpoints with token
- [ ] API docs at `http://localhost:3000/api-docs`
- [ ] Tests pass: `pnpm run test`

## 🎓 Next Steps

1. **Explore API**: Visit `http://localhost:3000/api-docs`
2. **Read Architecture**: See `docs/ARCHITECTURE.md`
3. **Run Tests**: `pnpm run test`
4. **Customize**: Modify `prisma/schema.prisma` as needed
5. **Deploy**: Follow `docs/DEPLOYMENT.md`

## 💡 Tips

- Use `pnpm run dev` for development (auto-restarts on changes)
- Check `src/config/index.ts` for configuration options
- View logs in `./logs/app.log` for debugging
- Use Prisma Studio: `npx prisma studio` (visual database editor)
- Add `console.log("[v0] ...")` for debugging (see debugging guide)

## 📞 Need Help?

1. Check error messages in terminal
2. Review logs in `./logs/app.log`
3. Consult `docs/API.md` for endpoint details
4. Check `.env.example` for required variables
5. Review `PROJECT_SUMMARY.md` for feature overview

---

**Ready to build?** 🚀

Start with: `cd backend && pnpm install && pnpm run dev`

Visit API docs: `http://localhost:3000/api-docs`

