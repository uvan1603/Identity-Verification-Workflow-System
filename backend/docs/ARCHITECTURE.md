# Identity Verification System - Architecture Guide

## System Overview

The Identity Verification Workflow System is a production-ready REST API designed to manage the complete KYC (Know Your Customer) process. It follows clean architecture principles with clear separation of concerns.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client Applications                   │
│                  (Web, Mobile, Backend)                  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/HTTPS
┌────────────────────────▼────────────────────────────────┐
│                   API Gateway / Load Balancer             │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│            Express.js REST API Server                    │
├─────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────┐ │
│ │           Middleware Stack                           │ │
│ ├──────────────────────────────────────────────────────┤ │
│ │ • Request ID                                         │ │
│ │ • CORS & Security (Helmet)                          │ │
│ │ • Rate Limiting                                      │ │
│ │ • Authentication (JWT)                              │ │
│ │ • Authorization (RBAC)                              │ │
│ │ • Error Handling                                    │ │
│ └──────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────┐ │
│ │              Route Handlers                           │ │
│ ├──────────────────────────────────────────────────────┤ │
│ │ • Auth Routes (/auth/*)                             │ │
│ │ • Verification Routes (/verifications/*)            │ │
│ │ • Document Routes (/verifications/*/documents/*)    │ │
│ └──────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────┐ │
│ │              Service Layer                            │ │
│ ├──────────────────────────────────────────────────────┤ │
│ │ • AuthService                                        │ │
│ │ • VerificationService                               │ │
│ │ • DocumentService                                   │ │
│ │ • DatabaseService (Prisma)                          │ │
│ │ • AuditService                                      │ │
│ │ • RuleEngine                                        │ │
│ └──────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────┐ │
│ │          Utilities & Helpers                          │ │
│ ├──────────────────────────────────────────────────────┤ │
│ │ • JWT utilities                                      │ │
│ │ • Password hashing (bcryptjs)                       │ │
│ │ • Logger (Winston)                                  │ │
│ │ • Custom errors                                     │ │
│ │ • Validators (Joi)                                  │ │
│ └──────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼──────┐  ┌──────▼──────┐  ┌─────▼──────┐
│  PostgreSQL  │  │    Redis    │  │ File Blob  │
│   Database   │  │    Cache    │  │  Storage   │
└──────────────┘  └─────────────┘  └────────────┘
```

## Layered Architecture

### 1. **Presentation Layer (Routes)**
- Express route handlers
- Input validation with Joi
- Request/response formatting
- HTTP status code management

**Files:**
- `src/routes/auth.ts`
- `src/routes/verification.ts`

### 2. **Middleware Layer**
- Authentication (JWT verification)
- Authorization (RBAC)
- Error handling
- Rate limiting
- Request logging
- CORS and security headers

**Files:**
- `src/middleware/auth.ts`
- `src/middleware/errorHandler.ts`
- `src/middleware/rateLimit.ts`
- `src/middleware/requestId.ts`

### 3. **Service Layer**
- Business logic implementation
- Data validation
- External API calls
- Complex operations

**Files:**
- `src/services/auth.ts`
- `src/services/verification.ts`
- `src/services/document.ts`
- `src/services/database.ts`

### 4. **Data Access Layer**
- Prisma ORM for database operations
- Query building
- Data model definitions

**Files:**
- `prisma/schema.prisma`
- `src/services/database.ts`

### 5. **Utility Layer**
- Helper functions
- Constants
- External library integrations

**Files:**
- `src/utils/jwt.ts`
- `src/utils/password.ts`
- `src/utils/errors.ts`
- `src/utils/logger.ts`

## Data Flow

### Authentication Flow

```
Client Request (email, password)
    ↓
[Routes] → Validate input with Joi
    ↓
[Services] → Query database for user
    ↓
[Utilities] → Hash & compare password (bcryptjs)
    ↓
[Utilities] → Generate JWT tokens (jwt)
    ↓
[Services] → Create session record
    ↓
Response (tokens, user info)
```

### Verification Flow

```
User initiates verification
    ↓
[Routes] → Create verification request
    ↓
[Services] → Create verification record
    ↓
[Services] → Create personal info record
    ↓
[Database] → Store in PostgreSQL
    ↓
User uploads documents
    ↓
[Routes] → Upload document request
    ↓
[Services] → Validate document
    ↓
[Services] → Store document metadata
    ↓
[Database] → Store in PostgreSQL
    ↓
User submits for review
    ↓
[Services] → Update verification status
    ↓
[Services] → Log audit entry
    ↓
[Rules Engine] → Apply verification rules
    ↓
[Database] → Update status & risk score
```

## Key Components

### Auth Service (`src/services/auth.ts`)

**Methods:**
- `registerUser()` - Create new user account
- `loginUser()` - Authenticate and create session
- `refreshAccessToken()` - Generate new access token
- `logoutUser()` - Invalidate session
- `getUserById()` - Fetch user profile

**Dependencies:**
- Prisma (database)
- bcryptjs (password hashing)
- jsonwebtoken (JWT)

### Verification Service (`src/services/verification.ts`)

**Methods:**
- `createVerification()` - Start new verification
- `getVerificationById()` - Fetch specific verification
- `getVerificationsByUserId()` - List user's verifications
- `updateVerificationStatus()` - Update status
- `submitVerification()` - Submit for review
- `getVerificationStats()` - Get statistics

**Dependencies:**
- Prisma (database)

### Document Service (`src/services/document.ts`)

**Methods:**
- `uploadDocument()` - Upload new document
- `getDocumentById()` - Fetch specific document
- `getDocumentsByVerificationId()` - List documents
- `updateDocumentStatus()` - Update document status
- `deleteDocument()` - Remove document
- `verifyDocument()` - Verify document authenticity

**Dependencies:**
- Prisma (database)
- crypto (file hashing)

## Database Schema

### Core Entities

**Users** - User accounts and authentication
- id (PK)
- email (unique)
- passwordHash
- role (CUSTOMER, REVIEWER, COMPLIANCE_MANAGER, ADMIN)
- metadata (firstName, lastName, isActive, lastLoginAt)

**Verification** - Verification instances
- id (PK)
- userId (FK → Users)
- status (PENDING, UNDER_REVIEW, APPROVED, REJECTED, EXPIRED, CANCELLED)
- currentStage (workflow stage)
- riskScore
- expiresAt
- timestamps

**Documents** - Uploaded identity documents
- id (PK)
- verificationId (FK → Verification)
- type (PASSPORT, NATIONAL_ID, etc.)
- fileUrl, fileHash
- status, verificationStatus
- timestamps

**PersonalInformation** - User profile data
- id (PK)
- verificationId (FK → Verification)
- firstName, lastName, dateOfBirth
- nationality, countryOfResidence
- Contact and address details

**VerificationCheck** - Individual checks performed
- id (PK)
- verificationId (FK → Verification)
- checkType (DOCUMENT_VALIDITY, FACE_MATCH, etc.)
- status, result, riskLevel

**Rule** - Configurable validation rules
- id (PK)
- name, ruleType
- conditions (JSON)
- actions (JSON)
- priority, isActive

**RuleApplication** - Rule application history
- id (PK)
- ruleId (FK → Rule)
- verificationId (FK → Verification)
- result, matchedConditions

**AuditLog** - Complete audit trail
- id (PK)
- userId (FK → Users)
- verificationId (FK → Verification)
- action, resourceType
- previousValues, newValues (JSON)
- timestamps

**Session** - Active user sessions
- id (PK)
- userId (FK → Users)
- token, refreshToken
- expiresAt

## Authentication & Authorization

### JWT Tokens

**Access Token:**
- Payload: userId, email, role
- Duration: 15 minutes
- Usage: Protect API endpoints

**Refresh Token:**
- Payload: userId, email, role
- Duration: 7 days
- Usage: Issue new access tokens

### Role-Based Access Control (RBAC)

**Roles:**
1. **CUSTOMER** - Regular user, can initiate verification, upload documents
2. **REVIEWER** - Reviews verifications, approves/rejects, creates checks
3. **COMPLIANCE_MANAGER** - Manages rules, policies, audit logs
4. **ADMIN** - Full system access

**Route Protection:**
- Public routes: register, login, refresh, health check
- Authenticated routes: All others (require valid JWT)
- Role-restricted routes: Admin statistics, rule management

## Error Handling

### Custom Error Classes

```
AppError (base)
├── ValidationError (400)
├── AuthenticationError (401)
├── AuthorizationError (403)
├── NotFoundError (404)
├── ConflictError (409)
├── RateLimitError (429)
└── InternalServerError (500)
```

### Error Response Format

```json
{
  "error": "Error message",
  "statusCode": 400,
  "timestamp": "ISO string",
  "path": "/api/v1/endpoint",
  "requestId": "uuid"
}
```

### Error Handling Middleware

1. Routes call services
2. Services throw specific AppError subclasses
3. Error handler middleware catches errors
4. Formats response and sends to client
5. Logs errors with Winston

## Security Features

### Password Security
- bcryptjs hashing (12 salt rounds)
- Strong password requirements enforced
- Never returned to clients
- Validated server-side

### JWT Security
- HS256 signing algorithm
- Secure secret key required in production
- Refresh token rotation
- Token expiration validation

### API Security
- CORS configuration
- Helmet security headers
- Rate limiting per IP/user
- Input validation with Joi
- SQL injection prevention (Prisma)

### Data Protection
- Parameterized queries (Prisma)
- Sensitive data in environment variables
- Audit logging for compliance
- Row-level security concepts

## Performance Considerations

### Caching
- Node cache for in-memory storage
- Redis for distributed caching (optional)
- Session tokens cached

### Database Optimization
- Indexed frequently queried columns
- Relationship optimization
- Query efficiency in services
- Connection pooling (Prisma)

### Rate Limiting
- Per-IP rate limiting
- Per-user rate limiting for sensitive endpoints
- Configurable windows and thresholds
- Returns retry-after headers

### Logging
- Winston logger with multiple transports
- Separate error logs
- Log levels (debug, info, warn, error)
- Performance logging in development

## Deployment Considerations

### Environment Management
- Separate .env files for environments
- Required secrets validation on startup
- Configuration validation

### Docker Deployment
- Multi-stage Dockerfile
- Production dependencies only
- Health checks configured
- Docker Compose for local dev

### Scaling
- Stateless design (can run multiple instances)
- Database connection pooling
- Session management (can use Redis)
- Load balancer ready

### Monitoring
- Health check endpoint
- Request ID tracking
- Audit logging
- Error rate monitoring

## Testing Strategy

### Unit Tests
- Service layer logic
- Utility functions
- Error handling

### Integration Tests
- API endpoint testing
- Database integration
- Authentication flows

### Test Coverage
- Target: 80%+ code coverage
- Critical paths: 100%
- Tools: Vitest, supertest

## Development Workflow

1. **Branching:** feature/*, bugfix/*, hotfix/*
2. **Commits:** Conventional commits (feat:, fix:, etc.)
3. **Code Quality:** ESLint, Prettier
4. **Testing:** Pre-commit hooks run tests
5. **CI/CD:** Automated testing and deployment
6. **Versioning:** Semantic versioning

## Future Enhancements

- [ ] Webhook system for events
- [ ] Advanced rule engine with DSL
- [ ] Machine learning for risk scoring
- [ ] Real-time notifications
- [ ] GraphQL API layer
- [ ] API key authentication
- [ ] OAuth2/OpenID Connect
- [ ] Advanced audit analytics
- [ ] Multi-tenancy support
- [ ] Batch verification processing
