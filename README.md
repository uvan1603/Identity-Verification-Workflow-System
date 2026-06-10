# Identity Verification Workflow System

A production-grade backend system for managing identity verification workflows with comprehensive document validation, rule engine, and audit logging.

## 📋 Project Overview

This project is a **complete, enterprise-ready Express.js backend** designed to handle identity verification workflows at scale. It includes advanced features like:

- **JWT-based Authentication** with refresh token rotation
- **Role-Based Access Control** (RBAC) with 4 roles: Customer, Reviewer, Compliance Manager, Admin
- **Verification Workflow Engine** with 6 status states and configurable rules
- **Document Management** with OCR-ready support and validation
- **Rule Engine** for flexible verification requirements
- **Audit Logging** for complete compliance tracking
- **Rate Limiting & Security** with Redis integration
- **Comprehensive Error Handling** with custom error classes
- **Docker & Docker Compose** for containerized deployment
- **Swagger/OpenAPI Documentation** for API exploration
- **Full Test Suite** with Jest configuration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- PostgreSQL 14+
- Redis 6+ (for caching and rate limiting)
- Docker & Docker Compose (optional, for containerized deployment)

### Installation

```bash
cd backend

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Generate Prisma client
pnpm run prisma:generate

# Run database migrations
pnpm run db:migrate

# Seed database with sample data
pnpm run db:seed

# Start development server
pnpm run dev
```

The API will be available at `http://localhost:3000` with Swagger docs at `http://localhost:3000/api-docs`.

## 📁 Project Structure

```
/backend
├── src/
│   ├── config/           # Configuration management
│   ├── middleware/       # Express middleware (auth, error handling, rate limiting)
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic layer
│   ├── utils/           # Utility functions (JWT, passwords, logging, errors)
│   ├── types/           # TypeScript type definitions
│   └── index.ts         # Application entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── scripts/
│   └── seed.ts          # Database seed script
├── docs/                # Comprehensive documentation
│   ├── API.md          # API reference
│   ├── ARCHITECTURE.md  # System design and flow
│   └── DEPLOYMENT.md    # Deployment guide
├── Dockerfile          # Docker image configuration
├── docker-compose.yml  # Multi-container orchestration
├── package.json        # Dependencies and scripts
└── README.md          # This file
```

## 🔐 Authentication & Authorization

The system uses **JWT (JSON Web Tokens)** for authentication with the following structure:

### Token Types
- **Access Token**: Short-lived (15 minutes), used for API calls
- **Refresh Token**: Long-lived (7 days), used to get new access tokens

### Roles & Permissions
1. **Customer**: Can submit verifications and view own documents
2. **Reviewer**: Can review documents and provide feedback
3. **Compliance Manager**: Can approve/reject verifications and manage rules
4. **Admin**: Full system access including user management

### Example Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

## 📊 Database Schema

The system uses 8 normalized PostgreSQL tables:

- **User**: User accounts with roles and credentials
- **VerificationSession**: Top-level verification requests
- **Document**: Individual documents submitted for verification
- **VerificationRule**: Configurable validation rules
- **AuditLog**: Complete tracking of all actions
- **RuleAttempt**: Tracking of rule validation attempts
- **RefreshToken**: Session management tokens
- **RolePermission**: Fine-grained access control

See `docs/ARCHITECTURE.md` for detailed schema diagrams.

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Verification
- `POST /api/verifications` - Create verification request
- `GET /api/verifications` - List verifications (with filters)
- `GET /api/verifications/:id` - Get verification details
- `PUT /api/verifications/:id/status` - Update status
- `POST /api/verifications/:id/submit` - Submit for review

### Documents
- `POST /api/documents` - Upload document
- `GET /api/documents/:id` - Get document
- `DELETE /api/documents/:id` - Delete document
- `POST /api/documents/:id/verify` - Verify document

See `docs/API.md` for complete endpoint documentation with request/response examples.

## 🛡️ Security Features

### Built-in Security
- Password hashing with bcryptjs (10 rounds)
- JWT token validation and expiration
- Rate limiting (10 requests per minute by default)
- CORS configuration
- Helmet.js security headers
- Input validation with Joi
- SQL injection prevention via Prisma
- Request ID tracking for logging

### Environment Security
- Sensitive config in `.env.local` (excluded from git)
- Separate dev/prod configurations
- No credentials in version control

## 🧪 Testing

```bash
# Run all tests
pnpm run test

# Run tests with coverage
pnpm run test:coverage

# Watch mode
pnpm run test:watch
```

Configuration: Jest with ts-jest preset. See `vitest.config.ts` for details.

## 📚 Documentation

- **README.md** (this file) - Project overview
- **QUICK_START.md** - Setup and running instructions
- **docs/API.md** - Complete API reference with examples
- **docs/ARCHITECTURE.md** - System design and data flows
- **docs/DEPLOYMENT.md** - Production deployment guide
- **PROJECT_SUMMARY.md** - Comprehensive feature summary

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend
```

This starts:
- Express backend (port 3000)
- PostgreSQL database (port 5432)
- Redis (port 6379)

### Using Docker directly

```bash
# Build image
docker build -t identity-verification-backend .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@db:5432/verification" \
  -e REDIS_URL="redis://redis:6379" \
  identity-verification-backend
```

## 🚀 Deployment

### Production Checklist
- [ ] Configure production database (managed PostgreSQL service)
- [ ] Configure Redis for caching (managed Redis service)
- [ ] Set strong JWT secrets
- [ ] Configure CORS for your domain
- [ ] Set up rate limiting appropriate for your scale
- [ ] Enable HTTPS
- [ ] Configure database backups
- [ ] Set up monitoring and alerts
- [ ] Configure application logs

See `docs/DEPLOYMENT.md` for detailed production setup instructions.

## 📝 Environment Variables

Key environment variables:

```
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/verification

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-change-this

# API
API_PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
```

See `.env.example` for complete list.

## 🔍 Logging

The system uses Winston for comprehensive logging:

- Logs to console and file (./logs/app.log)
- Log levels: debug, info, warn, error
- Request tracking with unique IDs
- Performance metrics for slow queries

Configure log level via `LOG_LEVEL` environment variable.

## 📈 Performance

- Database query optimization with Prisma
- Redis caching for rate limiting
- Connection pooling
- Async/await for non-blocking operations
- Middleware-based architecture for efficiency

## 🤝 Contributing

This is a complete, production-ready system. For modifications:

1. Follow TypeScript strict mode
2. Add tests for new features
3. Update documentation
4. Run `pnpm run lint` before committing
5. Ensure all tests pass

## 📞 Support

For issues or questions:
1. Check the documentation in `/docs`
2. Review API examples in `docs/API.md`
3. Check deployment guide in `docs/DEPLOYMENT.md`
4. Review environment configuration in `.env.example`

## 📄 License

This is a complete, production-ready system for identity verification workflows. All code is ready for deployment.


