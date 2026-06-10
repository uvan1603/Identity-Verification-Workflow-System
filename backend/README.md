# Identity Verification Workflow System

An enterprise-grade identity verification and KYC (Know Your Customer) backend system built with Node.js, Express, PostgreSQL, and Prisma.

## 🎯 Overview

The Identity Verification Workflow System is a production-ready REST API that manages the complete identity verification lifecycle. It provides:

- **User Authentication**: JWT-based authentication with refresh token rotation
- **Role-Based Access Control**: 4 user roles (Customer, Reviewer, Compliance Manager, Admin)
- **Verification Workflow**: Multi-stage verification process with status tracking
- **Document Management**: Secure document upload, storage, and verification
- **Rule Engine**: Configurable validation rules for compliance
- **Audit Logging**: Complete audit trail of all operations
- **Rate Limiting**: Protection against abuse
- **Comprehensive Documentation**: Full API documentation with Swagger/OpenAPI

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     REST API (Express.js)                    │
├─────────────────────────────────────────────────────────────┤
│                          Middleware Layer                     │
│  ├─ Authentication (JWT)    ├─ Rate Limiting                │
│  ├─ Error Handling          ├─ Request ID                    │
│  ├─ Authorization (RBAC)    └─ Logging                       │
├─────────────────────────────────────────────────────────────┤
│                        Services Layer                         │
│  ├─ Auth Service            ├─ Document Service              │
│  ├─ Verification Service    ├─ Rule Engine                   │
│  └─ Database Service        └─ Audit Service                 │
├─────────────────────────────────────────────────────────────┤
│                       Data Access Layer                       │
│  └─ Prisma ORM (PostgreSQL)                                 │
├─────────────────────────────────────────────────────────────┤
│                    External Services                          │
│  ├─ PostgreSQL Database     ├─ Redis Cache                   │
│  └─ File Storage            └─ Email Notifications           │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Database Schema

### Core Tables

**Users**: User accounts with authentication and role management
- id, email, passwordHash, firstName, lastName, role, isActive, lastLoginAt

**Verification**: Main verification records tracking the workflow
- id, userId, status, currentStage, riskScore, attemptCount, expiresAt

**Documents**: Uploaded identity documents
- id, verificationId, type, fileUrl, status, verificationStatus, expiresAt

**PersonalInformation**: User profile data submitted during verification
- id, verificationId, firstName, lastName, dateOfBirth, nationality, countryOfResidence

**VerificationCheck**: Individual checks performed on a verification
- id, verificationId, checkType, status, result, riskLevel

**Rule**: Configurable validation rules
- id, name, ruleType, conditions (JSON), actions (JSON), priority, isActive

**AuditLog**: Complete audit trail
- id, userId, verificationId, action, resourceType, previousValues, newValues

**Session**: Active user sessions with token management
- id, userId, token, refreshToken, expiresAt

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 7.0 (optional, for caching)
- Docker & Docker Compose (for containerized setup)

### Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Initialize the database**
   ```bash
   pnpm run db:push
   pnpm run db:seed
   ```

5. **Start the development server**
   ```bash
   pnpm run dev
   ```

The API will be available at `http://localhost:3001`

### Using Docker Compose

```bash
docker-compose up -d
```

This starts:
- PostgreSQL database
- Redis instance
- Express API server

Access the API at `http://localhost:3001`

## 📚 API Documentation

### Authentication Endpoints

#### Register
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "CUSTOMER",
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

#### Refresh Token
```bash
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJ..."
}
```

#### Get Current User
```bash
GET /api/v1/auth/me
Authorization: Bearer <accessToken>
```

#### Logout
```bash
POST /api/v1/auth/logout
Authorization: Bearer <accessToken>
```

### Verification Endpoints

#### Create Verification
```bash
POST /api/v1/verifications
Authorization: Bearer <accessToken>
Content-Type: application/json

{
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
}
```

#### Get Verifications
```bash
GET /api/v1/verifications
Authorization: Bearer <accessToken>
```

#### Get Specific Verification
```bash
GET /api/v1/verifications/{id}
Authorization: Bearer <accessToken>
```

#### Submit Verification
```bash
POST /api/v1/verifications/{id}/submit
Authorization: Bearer <accessToken>
```

### Document Endpoints

#### Upload Document
```bash
POST /api/v1/verifications/{verificationId}/documents
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "type": "PASSPORT",
  "fileName": "passport.pdf",
  "fileUrl": "https://example.com/path/to/document.pdf",
  "mimeType": "application/pdf",
  "fileSize": 2048576
}
```

#### Get Documents
```bash
GET /api/v1/verifications/{verificationId}/documents
Authorization: Bearer <accessToken>
```

#### Get Specific Document
```bash
GET /api/v1/verifications/{verificationId}/documents/{documentId}
Authorization: Bearer <accessToken>
```

#### Delete Document
```bash
DELETE /api/v1/verifications/{verificationId}/documents/{documentId}
Authorization: Bearer <accessToken>
```

## 🔐 Authentication & Authorization

### JWT Tokens

- **Access Token**: Valid for 15 minutes
- **Refresh Token**: Valid for 7 days

### User Roles

1. **CUSTOMER**: Regular users submitting verification
2. **REVIEWER**: Reviews and approves/rejects verifications
3. **COMPLIANCE_MANAGER**: Manages verification rules and policies
4. **ADMIN**: Full system access

### Protected Routes

All routes require authentication except:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /health`

### Role-Based Access

Some endpoints require specific roles:
- Admin-only: Statistics endpoints, user management
- Compliance Manager: Rule management, audit logs
- Reviewer: Verification review endpoints

## 📋 Verification Workflow

```
PENDING
  ↓
[Upload Documents]
  ↓
UNDER_REVIEW
  ├─ DOCUMENT_SUBMISSION
  ├─ DOCUMENT_VERIFICATION
  ├─ IDENTITY_CHECK
  ├─ RISK_ASSESSMENT
  └─ FINAL_REVIEW
  ↓
APPROVED or REJECTED
  ↓
COMPLETED
```

### Verification Statuses

- **PENDING**: Initial state, awaiting document submission
- **UNDER_REVIEW**: Documents submitted, undergoing verification
- **APPROVED**: Verification successful
- **REJECTED**: Verification failed
- **EXPIRED**: Verification period exceeded
- **CANCELLED**: Verification cancelled by user or admin

### Verification Stages

- **DOCUMENT_SUBMISSION**: User uploading documents
- **DOCUMENT_VERIFICATION**: Authenticating document validity
- **IDENTITY_CHECK**: Verifying user identity
- **RISK_ASSESSMENT**: Calculating risk score
- **FINAL_REVIEW**: Human review by compliance team
- **COMPLETED**: Process finished

## 🛡️ Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Rate Limiting**: Prevent brute-force attacks
- **CORS**: Configurable cross-origin policies
- **Helmet**: Security headers
- **Input Validation**: Joi schema validation
- **Audit Logging**: Complete action tracking
- **Role-Based Access**: Fine-grained permissions
- **Environment Variables**: Sensitive config isolation

### Password Requirements

Passwords must contain:
- At least 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
pnpm run test

# Run tests with coverage
pnpm run test:coverage

# Run tests in watch mode
pnpm run test --watch
```

## 🔍 Linting & Formatting

```bash
# Lint code
pnpm run lint

# Fix linting issues
pnpm run lint:fix

# Format code
pnpm run format
```

## 📊 Database Management

### Run Migrations

```bash
# Create new migration
pnpm run db:migrate

# Push schema changes
pnpm run db:push

# Seed database with test data
pnpm run db:seed

# Reset database
pnpm run db:reset
```

### Prisma Studio

View and edit data in a web interface:

```bash
npx prisma studio
```

## 🐳 Docker Deployment

### Build Image

```bash
docker build -t identity-verification-api .
```

### Run Container

```bash
docker run -p 3001:3001 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="your_secret" \
  identity-verification-api
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

## 📈 Monitoring & Logging

### Log Levels

- **error**: Error messages
- **warn**: Warning messages
- **info**: General information
- **http**: HTTP request logs
- **debug**: Detailed debug information

Logs are written to:
- `logs/all.log`: All logs
- `logs/error.log`: Error logs only
- Console: All logs in development

## 🔌 Configuration

Key environment variables:

```env
# Server
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# JWT
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Verification
MAX_VERIFICATION_ATTEMPTS=3
VERIFICATION_EXPIRY_DAYS=30

# Rate Limiting
ENABLE_RATE_LIMITING=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

See `.env.example` for all available options.

## 📞 Support

For issues, questions, or contributions, please refer to the project documentation or contact the development team.

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

Built with:
- [Express.js](https://expressjs.com/) - Web framework
- [Prisma](https://www.prisma.io/) - ORM
- [PostgreSQL](https://www.postgresql.org/) - Database
- [JWT](https://jwt.io/) - Authentication
- [Winston](https://github.com/winstonjs/winston) - Logging
- [Joi](https://joi.dev/) - Validation
