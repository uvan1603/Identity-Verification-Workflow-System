# Quick Start Guide

Get the Identity Verification API running in 5 minutes!

## Option 1: Using Docker (Recommended - Fastest)

### Prerequisites
- Docker Desktop installed

### Steps

```bash
# 1. Navigate to backend directory
cd backend

# 2. Start all services
docker-compose up -d

# 3. Wait 10 seconds for database to initialize
sleep 10

# 4. Seed test data
docker-compose exec api pnpm run db:seed

# 5. Test the API
curl http://localhost:3001/health
```

**Done!** API is running at `http://localhost:3001`

### Stop Services
```bash
docker-compose down
```

---

## Option 2: Local Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+ (optional)

### Steps

```bash
# 1. Install dependencies
cd backend
pnpm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your database URL if different from default

# 3. Initialize database
pnpm run db:push
pnpm run db:seed

# 4. Start development server
pnpm run dev
```

**Done!** API is running at `http://localhost:3001`

---

## Test the API

### 1. Register a New User

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Response includes:** `accessToken` and `refreshToken`

### 2. Login with Test Credentials

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "CustomerPassword123!"
  }'
```

**Save the `accessToken` for next steps!**

### 3. Create a Verification

```bash
curl -X POST http://localhost:3001/api/v1/verifications \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "personalInfo": {
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "1990-01-15T00:00:00Z",
      "nationality": "US",
      "countryOfResidence": "US",
      "phoneNumber": "+1234567890",
      "address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001"
    }
  }'
```

**Save the verification `id` from response!**

### 4. Upload a Document

```bash
curl -X POST http://localhost:3001/api/v1/verifications/VERIFICATION_ID/documents \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "PASSPORT",
    "fileName": "passport.pdf",
    "fileUrl": "https://example.com/docs/passport.pdf",
    "mimeType": "application/pdf",
    "fileSize": 1024576
  }'
```

### 5. Submit Verification for Review

```bash
curl -X POST http://localhost:3001/api/v1/verifications/VERIFICATION_ID/submit \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 6. Get Verification Status

```bash
curl -X GET http://localhost:3001/api/v1/verifications/VERIFICATION_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Test Credentials (Pre-seeded)

All passwords are `Password123!` followed by the role name:

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | AdminPassword123! | Admin |
| manager@example.com | ManagerPassword123! | Compliance Manager |
| reviewer@example.com | ReviewerPassword123! | Reviewer |
| customer@example.com | CustomerPassword123! | Customer |

---

## Database Access

### Using Prisma Studio (Local Dev Only)

```bash
cd backend
npx prisma studio
```

Opens at `http://localhost:5555`

### Direct PostgreSQL

```bash
# Docker
docker-compose exec postgres psql -U user -d identity_verification

# Local
psql -U user -d identity_verification
```

---

## Available Commands

```bash
# Development
pnpm run dev              # Start dev server with hot reload
pnpm run build            # Compile TypeScript
pnpm run start            # Run compiled code

# Database
pnpm run db:push          # Sync schema to database
pnpm run db:migrate       # Run migrations
pnpm run db:seed          # Seed test data
pnpm run db:reset         # Reset database

# Code Quality
pnpm run test             # Run tests
pnpm run test:coverage    # Test coverage
pnpm run lint             # Check code style
pnpm run lint:fix         # Fix style issues
pnpm run format           # Format code

# Docker
pnpm run docker:build     # Build Docker image
pnpm run docker:up        # Start Docker services
pnpm run docker:down      # Stop Docker services
```

---

## API Endpoints Reference

### Authentication
- `POST /api/v1/auth/register` - Create account
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Get profile
- `POST /api/v1/auth/logout` - Logout

### Verifications
- `POST /api/v1/verifications` - Create verification
- `GET /api/v1/verifications` - List verifications
- `GET /api/v1/verifications/{id}` - Get verification
- `POST /api/v1/verifications/{id}/submit` - Submit for review

### Documents
- `POST /api/v1/verifications/{id}/documents` - Upload
- `GET /api/v1/verifications/{id}/documents` - List
- `GET /api/v1/verifications/{id}/documents/{docId}` - Get
- `DELETE /api/v1/verifications/{id}/documents/{docId}` - Delete

### Health & Stats
- `GET /health` - Health check
- `GET /api/v1/verifications/stats/overview` - Stats (admin only)

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### Database Connection Error

**Docker:**
```bash
docker-compose down -v
docker-compose up -d
```

**Local:**
Check `.env.local` DATABASE_URL and PostgreSQL is running

### Can't Generate Token

Ensure password meets requirements:
- 8+ characters
- Uppercase + Lowercase
- Number + Special character

---

## Next Steps

1. **Read Full Documentation:** See `README.md`
2. **Explore API:** See `docs/API.md`
3. **Understand Architecture:** See `docs/ARCHITECTURE.md`
4. **Deploy:** See `docs/DEPLOYMENT.md`

---

## Getting Help

### Check Logs

**Docker:**
```bash
docker-compose logs -f api
```

**Local Dev:**
```bash
# Logs appear in console where dev server runs
# Also check logs/all.log and logs/error.log
```

### Common Issues

**401 Unauthorized:**
- Token is missing or expired
- Use `/auth/refresh` to get new token

**400 Bad Request:**
- Check request body format
- Verify required fields are present

**404 Not Found:**
- Verification/document ID doesn't exist
- Ensure you created the resource first

**409 Conflict:**
- Email already registered
- Verification already in progress

---

## Success Indicators

You'll know it's working when:

✅ `curl http://localhost:3001/health` returns `healthy`  
✅ Can login and receive JWT tokens  
✅ Can create verifications and upload documents  
✅ Database contains your test data  
✅ Logs show API requests  

---

## Production Deployment

Ready to deploy? See `docs/DEPLOYMENT.md` for:
- Docker production build
- Linux/Ubuntu server setup
- AWS deployment
- Database backups
- SSL certificates
- Monitoring setup

---

**Enjoy building with the Identity Verification System!** 🚀
