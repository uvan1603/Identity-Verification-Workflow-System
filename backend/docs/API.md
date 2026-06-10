# Identity Verification Workflow System - API Documentation

## Base URL

```
http://localhost:3001/api/v1
```

## Authentication

All endpoints (except `/auth/register`, `/auth/login`, `/auth/refresh`) require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

## Rate Limiting

API responses include rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2024-01-01T12:15:30.000Z
```

---

## Authentication Endpoints

### 1. Register User

**Endpoint:** `POST /auth/register`

**Description:** Create a new user account

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character (!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\\/?)

**Response:** `201 Created`
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "role": "CUSTOMER",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input
- `409 Conflict` - Email already registered

---

### 2. Login User

**Endpoint:** `POST /auth/login`

**Description:** Authenticate user and receive tokens

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "role": "CUSTOMER",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid email or password
- `429 Too Many Requests` - Too many login attempts

---

### 3. Refresh Access Token

**Endpoint:** `POST /auth/refresh`

**Description:** Generate a new access token using refresh token

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or expired refresh token

---

### 4. Get Current User Profile

**Endpoint:** `GET /auth/me`

**Description:** Retrieve authenticated user's profile

**Headers:** Requires `Authorization: Bearer <accessToken>`

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "CUSTOMER",
  "isActive": true,
  "createdAt": "2024-01-01T10:00:00.000Z",
  "lastLoginAt": "2024-01-02T15:30:00.000Z"
}
```

---

### 5. Logout User

**Endpoint:** `POST /auth/logout`

**Description:** Invalidate current session

**Headers:** Requires `Authorization: Bearer <accessToken>`

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

## Verification Endpoints

### 6. Create Verification

**Endpoint:** `POST /verifications`

**Description:** Initiate a new identity verification process

**Headers:** Requires `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "personalInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-15T00:00:00Z",
    "nationality": "US",
    "countryOfResidence": "US",
    "phoneNumber": "+1234567890",
    "address": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001"
  }
}
```

**Required Fields:**
- firstName, lastName
- dateOfBirth (ISO format)
- nationality
- countryOfResidence

**Optional Fields:**
- phoneNumber
- address
- city
- state
- postalCode

**Response:** `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING",
  "currentStage": "DOCUMENT_SUBMISSION",
  "riskScore": 0,
  "attemptCount": 0,
  "expiresAt": "2024-02-01T10:00:00.000Z",
  "createdAt": "2024-01-02T10:00:00.000Z",
  "updatedAt": "2024-01-02T10:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input
- `409 Conflict` - User already has active verification

---

### 7. Get User's Verifications

**Endpoint:** `GET /verifications`

**Description:** List all verifications for authenticated user

**Headers:** Requires `Authorization: Bearer <accessToken>`

**Query Parameters:**
- `status` (optional): Filter by status (PENDING, UNDER_REVIEW, APPROVED, REJECTED, EXPIRED, CANCELLED)

**Response:** `200 OK`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "UNDER_REVIEW",
    "currentStage": "DOCUMENT_VERIFICATION",
    "riskScore": 25,
    "attemptCount": 1,
    "expiresAt": "2024-02-01T10:00:00.000Z",
    "createdAt": "2024-01-02T10:00:00.000Z",
    "updatedAt": "2024-01-02T12:30:00.000Z"
  }
]
```

---

### 8. Get Specific Verification

**Endpoint:** `GET /verifications/{id}`

**Description:** Retrieve details of a specific verification

**Headers:** Requires `Authorization: Bearer <accessToken>`

**Path Parameters:**
- `id`: Verification ID

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "UNDER_REVIEW",
  "currentStage": "DOCUMENT_VERIFICATION",
  "riskScore": 25,
  "attemptCount": 1,
  "expiresAt": "2024-02-01T10:00:00.000Z",
  "createdAt": "2024-01-02T10:00:00.000Z",
  "updatedAt": "2024-01-02T12:30:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Verification not found
- `403 Forbidden` - User doesn't own this verification

---

### 9. Submit Verification for Review

**Endpoint:** `POST /verifications/{id}/submit`

**Description:** Submit verification with uploaded documents for review

**Headers:** Requires `Authorization: Bearer <accessToken>`

**Path Parameters:**
- `id`: Verification ID

**Requirements:**
- At least one document uploaded
- Personal information completed

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "UNDER_REVIEW",
  "currentStage": "DOCUMENT_VERIFICATION",
  "riskScore": 0,
  "attemptCount": 1,
  "expiresAt": "2024-02-01T10:00:00.000Z",
  "createdAt": "2024-01-02T10:00:00.000Z",
  "updatedAt": "2024-01-02T13:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing required documents or info
- `404 Not Found` - Verification not found
- `409 Conflict` - Verification already submitted

---

## Document Endpoints

### 10. Upload Document

**Endpoint:** `POST /verifications/{verificationId}/documents`

**Description:** Upload an identity document

**Headers:**
- `Authorization: Bearer <accessToken>`

**Path Parameters:**
- `verificationId`: Verification ID

**Request Body:**
```json
{
  "type": "PASSPORT",
  "fileName": "my_passport.pdf",
  "fileUrl": "https://example.com/path/to/document.pdf",
  "mimeType": "application/pdf",
  "fileSize": 2048576
}
```

**Allowed Document Types:**
- PASSPORT
- NATIONAL_ID
- DRIVERS_LICENSE
- VISA
- RESIDENCE_PERMIT
- UTILITY_BILL
- BANK_STATEMENT
- GOVERNMENT_LETTER
- OTHER

**Allowed MIME Types:**
- image/jpeg
- image/png
- application/pdf
- image/pdf

**Max File Size:** 10MB

**Response:** `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440010",
  "verificationId": "550e8400-e29b-41d4-a716-446655440001",
  "type": "PASSPORT",
  "fileName": "my_passport.pdf",
  "fileUrl": "https://example.com/path/to/document.pdf",
  "mimeType": "application/pdf",
  "fileSize": 2048576,
  "status": "PENDING_REVIEW",
  "verificationStatus": "PENDING",
  "uploadedAt": "2024-01-02T14:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid document type or file size
- `404 Not Found` - Verification not found
- `409 Conflict` - Duplicate document

---

### 11. Get Verification Documents

**Endpoint:** `GET /verifications/{verificationId}/documents`

**Description:** List all documents for a verification

**Headers:** Requires `Authorization: Bearer <accessToken>`

**Path Parameters:**
- `verificationId`: Verification ID

**Response:** `200 OK`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "verificationId": "550e8400-e29b-41d4-a716-446655440001",
    "type": "PASSPORT",
    "fileName": "my_passport.pdf",
    "fileUrl": "https://example.com/path/to/document.pdf",
    "mimeType": "application/pdf",
    "fileSize": 2048576,
    "status": "APPROVED",
    "verificationStatus": "APPROVED",
    "uploadedAt": "2024-01-02T14:00:00.000Z"
  }
]
```

---

### 12. Get Specific Document

**Endpoint:** `GET /verifications/{verificationId}/documents/{documentId}`

**Description:** Retrieve details of a specific document

**Headers:** Requires `Authorization: Bearer <accessToken>`

**Path Parameters:**
- `verificationId`: Verification ID
- `documentId`: Document ID

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440010",
  "verificationId": "550e8400-e29b-41d4-a716-446655440001",
  "type": "PASSPORT",
  "fileName": "my_passport.pdf",
  "fileUrl": "https://example.com/path/to/document.pdf",
  "mimeType": "application/pdf",
  "fileSize": 2048576,
  "status": "APPROVED",
  "verificationStatus": "APPROVED",
  "uploadedAt": "2024-01-02T14:00:00.000Z"
}
```

---

### 13. Delete Document

**Endpoint:** `DELETE /verifications/{verificationId}/documents/{documentId}`

**Description:** Delete an uploaded document

**Headers:** Requires `Authorization: Bearer <accessToken>`

**Path Parameters:**
- `verificationId`: Verification ID
- `documentId`: Document ID

**Response:** `204 No Content`

---

## Admin Endpoints

### 14. Get Verification Statistics

**Endpoint:** `GET /verifications/stats/overview`

**Description:** Get verification counts by status (Admin/Compliance Manager only)

**Headers:** Requires `Authorization: Bearer <accessToken>` with ADMIN or COMPLIANCE_MANAGER role

**Response:** `200 OK`
```json
{
  "PENDING": 42,
  "UNDER_REVIEW": 18,
  "APPROVED": 356,
  "REJECTED": 12,
  "EXPIRED": 5,
  "CANCELLED": 3
}
```

---

## Health Check

### 15. API Health Check

**Endpoint:** `GET /health`

**Description:** Check API and database health status

**Response:** `200 OK` (or `503 Service Unavailable`)
```json
{
  "status": "healthy",
  "timestamp": "2024-01-02T15:00:00.000Z",
  "uptime": 3600.5,
  "database": "connected"
}
```

---

## Error Handling

All errors follow this standard format:

```json
{
  "error": "Error message",
  "statusCode": 400,
  "timestamp": "2024-01-02T15:00:00.000Z",
  "path": "/api/v1/verifications",
  "requestId": "550e8400-e29b-41d4-a716-446655440020"
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

## Examples

### Example 1: Complete Verification Flow

```bash
# 1. Register
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Response includes: accessToken, refreshToken

# 2. Create verification
curl -X POST http://localhost:3001/api/v1/verifications \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "personalInfo": {
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "1990-01-15T00:00:00Z",
      "nationality": "US",
      "countryOfResidence": "US"
    }
  }'

# Response includes: verificationId

# 3. Upload document
curl -X POST http://localhost:3001/api/v1/verifications/<verificationId>/documents \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "PASSPORT",
    "fileName": "passport.pdf",
    "fileUrl": "https://example.com/docs/passport.pdf",
    "mimeType": "application/pdf",
    "fileSize": 1024576
  }'

# 4. Submit for review
curl -X POST http://localhost:3001/api/v1/verifications/<verificationId>/submit \
  -H "Authorization: Bearer <accessToken>"
```

---

## Webhooks (Future)

Webhooks for verification status changes will be available in future versions. Subscribe to events like:
- `verification.created`
- `verification.submitted`
- `verification.approved`
- `verification.rejected`
- `document.uploaded`
- `document.verified`
