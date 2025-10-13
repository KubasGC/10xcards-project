# REST API Plan for 10xCards

## 1. API Versioning

All API endpoints are versioned and prefixed with `/api/v1/` to support future API evolution while maintaining backward compatibility.

## 2. Resources

### Core Resources
- **sets** - Flashcard collections (maps to `sets` table)
- **flashcards** - Individual flashcards within sets (maps to `flashcards` table)
- **pending-flashcards** - AI-generated candidates awaiting user review (maps to `pending_flashcards` table)
- **users** - User profiles and settings (handled by Supabase Auth `auth.users`)

### Supporting Resources
- **generation-quota** - User's daily AI generation limit status
- **reviews** - Flashcard review responses for spaced repetition (future implementation)

## 3. Endpoints

### 3.1 Authentication

Authentication is handled by Supabase Auth using **cookie-based authentication** via the `@supabase/supabase-js` client library. The application provides registration and login views within the Astro application.

**Key Points:**
- Authentication state is managed through secure HTTP-only cookies
- Supabase automatically handles session management and token refresh
- User identity is extracted from the session cookie on each request
- No manual JWT token handling is required in the application code
- Supabase validates authentication automatically on each request

**Implementation:**
- Registration and login forms are implemented in the Astro application
- Supabase client handles authentication flow and sets secure cookies
- All API routes retrieve user session from cookies automatically
- Cookie-based auth integrates seamlessly with Astro's server-side rendering

All subsequent API endpoints require an authenticated session (validated via cookies).

---

### 3.2 Users

#### GET /api/v1/users/me

Get current authenticated user's profile information.

**Authentication:** Required

**Query Parameters:** None

**Request Body:** None

**Success Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "created_at": "2025-01-15T10:30:00Z",
  "metadata": {
    "display_name": "string (optional)"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing authentication
```json
{
  "error": {
    "id": "uuid",
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

---

#### GET /api/v1/users/me/generation-quota

Get current user's daily AI generation quota status.

**Authentication:** Required

**Query Parameters:** None

**Request Body:** None

**Success Response (200 OK):**
```json
{
  "daily_limit": 50,
  "used_today": 23,
  "remaining": 27,
  "resets_at": "2025-01-16T00:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing authentication

---

### 3.3 Sets

#### GET /api/v1/sets

List all flashcard sets for the authenticated user.

**Authentication:** Required

**Query Parameters:**
- `page` (optional, default: 1) - Page number for pagination
- `per_page` (optional, default: 20, max: 100) - Items per page
- `category` (optional) - Filter by category
- `sort_by` (optional, default: "updated_at") - Sort field: "name" | "created_at" | "updated_at"
- `sort_order` (optional, default: "desc") - Sort order: "asc" | "desc"

**Request Body:** None

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "JavaScript Fundamentals",
      "description": "Core concepts of JavaScript programming",
      "category": "Programming",
      "flashcard_count": 42,
      "created_at": "2025-01-10T10:00:00Z",
      "updated_at": "2025-01-15T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_items": 5,
    "total_pages": 1
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing authentication
- `400 Bad Request` - Invalid query parameters
```json
{
  "error": {
    "id": "uuid",
    "code": "INVALID_PARAMETER",
    "message": "per_page must be between 1 and 100"
  }
}
```

---

#### POST /api/v1/sets

Create a new flashcard set.

**Authentication:** Required

**Query Parameters:** None

**Request Body:**
```json
{
  "name": "JavaScript Fundamentals",
  "description": "Core concepts of JavaScript programming (optional)"
}
```

**Validation Rules:**
- `name`: Required, 1-128 characters after trimming
- `description`: Optional, max 1000 characters

**Success Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "JavaScript Fundamentals",
  "description": "Core concepts of JavaScript programming",
  "category": null,
  "flashcard_count": 0,
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing authentication
- `400 Bad Request` - Validation errors
```json
{
  "error": {
    "id": "uuid",
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "name",
        "message": "Name must be between 1 and 128 characters"
      }
    ]
  }
}
```
- `409 Conflict` - Set name already exists for this user
```json
{
  "error": {
    "id": "uuid",
    "code": "DUPLICATE_SET_NAME",
    "message": "A set with this name already exists"
  }
}
```

---

#### GET /api/v1/sets/:id

Get details of a specific flashcard set.

**Authentication:** Required

**URL Parameters:**
- `id` - UUID of the set

**Query Parameters:** None

**Request Body:** None

**Success Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "JavaScript Fundamentals",
  "description": "Core concepts of JavaScript programming",
  "category": "Programming",
  "flashcard_count": 42,
  "created_at": "2025-01-10T10:00:00Z",
  "updated_at": "2025-01-15T14:30:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing authentication
- `404 Not Found` - Set does not exist or does not belong to user
```json
{
  "error": {
    "id": "uuid",
    "code": "SET_NOT_FOUND",
    "message": "Set not found"
  }
}
```

---

#### PATCH /api/v1/sets/:id

Update a flashcard set's name or description.

**Authentication:** Required

**URL Parameters:**
- `id` - UUID of the set

**Query Parameters:** None

**Request Body:**
```json
{
  "name": "Updated Set Name (optional)",
  "description": "Updated description (optional)"
}
```

**Validation Rules:**
- At least one field must be provided
- `name`: 1-128 characters after trimming
- `description`: Max 1000 characters

**Success Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Updated Set Name",
  "description": "Updated description",
  "category": "Programming",
  "flashcard_count": 42,
  "created_at": "2025-01-10T10:00:00Z",
  "updated_at": "2025-01-15T15:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing authentication
- `404 Not Found` - Set does not exist or does not belong to user
- `400 Bad Request` - Validation errors
- `409 Conflict` - Updated name conflicts with another set

---

#### DELETE /api/v1/sets/:id

Delete a flashcard set and all its flashcards.

**Authentication:** Required

**URL Parameters:**
- `id` - UUID of the set

**Query Parameters:** None

**Request Body:** None

**Success Response (204 No Content):**
No response body.

**Error Responses:**
- `401 Unauthorized` - Invalid or missing authentication
- `404 Not Found` - Set does not exist or does not belong to user

---

#### GET /api/v1/sets/:id/flashcards

Get all flashcards in a specific set.

**Authentication:** Required

**URL Parameters:**
- `id` - UUID of the set

**Query Parameters:**
- `page` (optional, default: 1) - Page number for pagination
- `per_page` (optional, default: 50, max: 100) - Items per page

**Request Body:** None

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "set_id": "uuid",
      "front": "What is a closure in JavaScript?",
      "back": "A closure is a function that has access to variables in its outer lexical scope, even after the outer function has returned.",
      "created_at": "2025-01-10T10:00:00Z",
      "updated_at": "2025-01-10T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total_items": 42,
    "total_pages": 1
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing authentication
- `404 Not Found` - Set does not exist or does not belong to user

---

#### GET /api/v1/sets/:id/due-cards

Get flashcards due for review in a specific set (for spaced repetition learning).

**Authentication:** Required

**URL Parameters:**
- `id` - UUID of the set

**Query Parameters:**
- `limit` (optional, default: 20) - Maximum number of cards to return

**Request Body:** None

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "set_id": "uuid",
      "front": "What is a closure in JavaScript?",
      "back": "A closure is a function that has access to variables in its outer lexical scope, even after the outer function has returned.",
      "review_data": {
        "next_review": "2025-01-15T00:00:00Z",
        "ease_factor": 2.5,
        "interval_days": 1,
        "repetitions": 0
      }
    }
  ],
  "total_due": 15
}
```

**Note:** For MVP, this may return all flashcards in the set. Full spaced repetition implementation will be added in future iterations.

**Error Responses:**
- `401 Unauthorized` - Invalid or missing authentication
- `404 Not Found` - Set does not exist or does not belong to user

---

### 3.4 Flashcards

#### POST /api/v1/flashcards

Create a new flashcard manually.

**Authentication:** Required

**Query Parameters:** None

**Request Body:**
```json
{
  "set_id": "uuid",
  "front": "What is a closure in JavaScript?",
  "back": "A closure is a function that has access to variables in its outer lexical scope, even after the outer function has returned."
}
```

**Validation Rules:**
- `set_id`: Required, must be a valid UUID belonging to the user
- `front`: Required, 1-200 characters, cannot be only whitespace
- `back`: Required, 1-600 characters, cannot be only whitespace

**Success Response (201 Created):**
```json
{
  "id": "uuid",
  "set_id": "uuid",
  "front": "What is a closure in JavaScript?",
  "back": "A closure is a function that has access to variables in its outer lexical scope, even after the outer function has returned.",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing authentication
- `400 Bad Request` - Validation errors
```json
{
  "error": {
    "id": "uuid",
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "front",
        "message": "Front must be between 1 and 200 characters"
      },
      {
        "field": "back",
        "message": "Back must be between 1 and 600 characters"
      }
    ]
  }
}
```
- `404 Not Found` - Set does not exist or does not belong to user
```json
{
  "error": {
    "id": "uuid",
    "code": "SET_NOT_FOUND",
    "message": "Set not found"
  }
}
```

---

#### PATCH /api/v1/flashcards/:id

Update an existing flashcard.

**Authentication:** Required

**URL Parameters:**
- `id` - UUID of the flashcard

**Query Parameters:** None

**Request Body:**
```json
{
  "front": "Updated front text (optional)",
  "back": "Updated back text (optional)"
}
```

**Validation Rules:**
- At least one field must be provided
- `front`: 1-200 characters, cannot be only whitespace
- `back`: 1-600 characters, cannot be only whitespace

**Success Response (200 OK):**
```json
{
  "id": "uuid",
  "set_id": "uuid",
  "front": "Updated front text",
  "back": "Updated back text",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T11:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing authentication
- `404 Not Found` - Flashcard does not exist or does not belong to user
- `400 Bad Request` - Validation errors

---

#### DELETE /api/v1/flashcards/:id

Delete a flashcard.

**Authentication:** Required

**URL Parameters:**
- `id` - UUID of the flashcard

**Query Parameters:** None

**Request Body:** None

**Success Response (204 No Content):**
No response body.

**Error Responses:**
- `401 Unauthorized` - Invalid or missing authentication
- `404 Not Found` - Flashcard does not exist or does not belong to user

---

#### POST /api/v1/flashcards/:id/reviews

Record a review response for a flashcard (spaced repetition).

**Authentication:** Required

**URL Parameters:**
- `id` - UUID of the flashcard

**Query Parameters:** None

**Request Body:**
```json
{
  "quality": 4,
  "review_duration_ms": 5000
}
```

**Validation Rules:**
- `quality`: Required, integer between 0-5 (based on spaced repetition algorithm)
  - 0: Complete blackout
  - 1: Incorrect response, but familiar
  - 2: Incorrect response, seemed easy
  - 3: Correct response, but difficult
  - 4: Correct response, after some hesitation
  - 5: Perfect response
- `review_duration_ms`: Optional, positive integer

**Success Response (200 OK):**
```json
{
  "id": "uuid",
  "flashcard_id": "uuid",
  "quality": 4,
  "review_duration_ms": 5000,
  "reviewed_at": "2025-01-15T10:30:00Z",
  "next_review": {
    "next_review_date": "2025-01-17T00:00:00Z",
    "ease_factor": 2.6,
    "interval_days": 2,
    "repetitions": 1
  }
}
```

**Note:** The spaced repetition algorithm and review history storage will be implemented in a future iteration. For MVP, this endpoint may be simplified.

**Error Responses:**
- `401 Unauthorized` - Invalid or missing authentication
- `404 Not Found` - Flashcard does not exist or does not belong to user
- `400 Bad Request` - Validation errors

---

### 3.5 AI Generation

#### POST /api/v1/flashcards/generate

Generate flashcard candidates from source text using AI.

**Authentication:** Required

**Query Parameters:** None

**Request Body:**
```json
{
  "source_text": "Closures are an important concept in JavaScript. A closure is created when a function is defined inside another function, allowing the inner function to access variables from the outer function's scope even after the outer function has returned.",
  "hint": "Focus on the definition and key characteristics (optional)"
}
```

**Validation Rules:**
- `source_text`: Required, 1000-20,000 characters
- `hint`: Optional, max 500 characters

**Success Response (201 Created):**
```json
{
  "generation_id": "uuid",
  "candidates": [
    {
      "id": "uuid",
      "front_draft": "What is a closure in JavaScript?",
      "back_draft": "A closure is created when a function is defined inside another function, allowing the inner function to access variables from the outer function's scope even after the outer function has returned.",
      "created_at": "2025-01-15T10:30:00Z"
    },
    {
      "id": "uuid",
      "front_draft": "When is a closure created in JavaScript?",
      "back_draft": "A closure is created when a function is defined inside another function.",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "metadata": {
    "model": "openai/gpt-4-turbo",
    "generation_time_ms": 2500,
    "tokens_used": 450
  },
  "quota_remaining": 26
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing authentication
- `400 Bad Request` - Validation errors
```json
{
  "error": {
    "id": "uuid",
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "source_text",
        "message": "Source text must be between 1000 and 20,000 characters"
      }
    ]
  }
}
```
- `429 Too Many Requests` - Daily generation limit exceeded
```json
{
  "error": {
    "id": "uuid",
    "code": "GENERATION_LIMIT_EXCEEDED",
    "message": "Daily generation limit of 50 has been reached",
    "details": {
      "daily_limit": 50,
      "used_today": 50,
      "resets_at": "2025-01-16T00:00:00Z"
    }
  }
}
```
- `500 Internal Server Error` - AI service error
```json
{
  "error": {
    "id": "uuid",
    "code": "AI_SERVICE_ERROR",
    "message": "Failed to generate flashcards. Please try again."
  }
}
```
- `503 Service Unavailable` - AI service temporarily unavailable
```json
{
  "error": {
    "id": "uuid",
    "code": "AI_SERVICE_UNAVAILABLE",
    "message": "AI service is temporarily unavailable. Please try again later."
  }
}
```

---

### 3.6 Pending Flashcards

#### GET /api/v1/pending-flashcards

List all pending flashcard candidates for the authenticated user.

**Authentication:** Required

**Query Parameters:**
- `page` (optional, default: 1) - Page number for pagination
- `per_page` (optional, default: 20, max: 100) - Items per page
- `sort_by` (optional, default: "created_at") - Sort field: "created_at"
- `sort_order` (optional, default: "desc") - Sort order: "asc" | "desc"

**Request Body:** None

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "front_draft": "What is a closure in JavaScript?",
      "back_draft": "A closure is a function that has access to variables in its outer lexical scope.",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_items": 8,
    "total_pages": 1
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing authentication

---

#### PATCH /api/v1/pending-flashcards/:id

Edit a pending flashcard candidate before accepting.

**Authentication:** Required

**URL Parameters:**
- `id` - UUID of the pending flashcard

**Query Parameters:** None

**Request Body:**
```json
{
  "front_draft": "Updated front text (optional)",
  "back_draft": "Updated back text (optional)"
}
```

**Validation Rules:**
- At least one field must be provided
- `front_draft`: 1-200 characters, cannot be only whitespace
- `back_draft`: 1-600 characters, cannot be only whitespace

**Success Response (200 OK):**
```json
{
  "id": "uuid",
  "front_draft": "Updated front text",
  "back_draft": "Updated back text",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T11:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing authentication
- `404 Not Found` - Pending flashcard does not exist or does not belong to user
- `400 Bad Request` - Validation errors

---

#### POST /api/v1/pending-flashcards/:id/accept

Accept a pending flashcard and move it to a set.

**Authentication:** Required

**URL Parameters:**
- `id` - UUID of the pending flashcard

**Query Parameters:** None

**Request Body:**
```json
{
  "set_id": "existing-set-uuid",
  "new_set": null
}
```

**OR**

```json
{
  "set_id": null,
  "new_set": {
    "name": "New Set Name",
    "description": "Optional description"
  }
}
```

**Validation Rules:**
- Either `set_id` OR `new_set` must be provided, not both
- If `set_id`: Must be a valid UUID belonging to the user
- If `new_set`: Must follow set creation validation rules

**Success Response (201 Created):**
```json
{
  "flashcard": {
    "id": "uuid",
    "set_id": "uuid",
    "front": "What is a closure in JavaScript?",
    "back": "A closure is a function that has access to variables in its outer lexical scope.",
    "created_at": "2025-01-15T11:00:00Z",
    "updated_at": "2025-01-15T11:00:00Z"
  },
  "set": {
    "id": "uuid",
    "name": "JavaScript Fundamentals",
    "flashcard_count": 43
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing authentication
- `404 Not Found` - Pending flashcard or set does not exist or does not belong to user
- `400 Bad Request` - Validation errors
```json
{
  "error": {
    "id": "uuid",
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "set_id",
        "message": "Either set_id or new_set must be provided"
      }
    ]
  }
}
```
- `409 Conflict` - New set name conflicts with existing set

---

#### DELETE /api/v1/pending-flashcards/:id

Reject and permanently delete a pending flashcard candidate.

**Authentication:** Required

**URL Parameters:**
- `id` - UUID of the pending flashcard

**Query Parameters:** None

**Request Body:** None

**Success Response (204 No Content):**
No response body.

**Error Responses:**
- `401 Unauthorized` - Invalid or missing authentication
- `404 Not Found` - Pending flashcard does not exist or does not belong to user

---

#### POST /api/v1/pending-flashcards/bulk-accept

Accept multiple pending flashcards at once and add them to a set.

**Authentication:** Required

**Query Parameters:** None

**Request Body:**
```json
{
  "pending_ids": ["uuid1", "uuid2", "uuid3"],
  "set_id": "existing-set-uuid",
  "new_set": null
}
```

**OR**

```json
{
  "pending_ids": ["uuid1", "uuid2", "uuid3"],
  "set_id": null,
  "new_set": {
    "name": "New Set Name",
    "description": "Optional description"
  }
}
```

**Validation Rules:**
- `pending_ids`: Required, array of 1-50 UUIDs
- Either `set_id` OR `new_set` must be provided, not both

**Success Response (201 Created):**
```json
{
  "flashcards": [
    {
      "id": "uuid",
      "set_id": "uuid",
      "front": "...",
      "back": "..."
    }
  ],
  "set": {
    "id": "uuid",
    "name": "JavaScript Fundamentals",
    "flashcard_count": 45
  },
  "accepted_count": 3,
  "failed": []
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing authentication
- `400 Bad Request` - Validation errors
- `404 Not Found` - One or more pending flashcards not found
- `207 Multi-Status` - Partial success (some flashcards accepted, some failed)
```json
{
  "flashcards": [...],
  "set": {...},
  "accepted_count": 2,
  "failed": [
    {
      "pending_id": "uuid",
      "error": "Pending flashcard not found"
    }
  ]
}
```

---

## 4. Authentication and Authorization

### Authentication Mechanism

The application uses **Supabase Authentication** with **cookie-based sessions** via the `@supabase/supabase-js` client library:

1. **Registration and Login:**
   - Users register and log in through forms implemented in the Astro application
   - Upon successful authentication, Supabase sets secure HTTP-only cookies
   - The cookies contain the user's session information
   - Supabase automatically handles session management and refresh

2. **Cookie-Based Session Management:**
   - Authentication state is stored in secure HTTP-only cookies
   - No manual token handling required in application code
   - Cookies are automatically sent with each request
   - Supabase client reads session from cookies on server-side
   - Integrates seamlessly with Astro's SSR capabilities

3. **Session Validation:**
   - Supabase automatically validates the session on each request
   - Expired or invalid sessions result in `401 Unauthorized` responses
   - User identity is automatically extracted from the session cookie
   - No need to manually validate or refresh tokens

### Authorization Implementation

**Row Level Security (RLS):**
- All database tables have RLS policies enabled
- Policies enforce that users can only access records where `user_id` matches `auth.uid()`
- This is the primary authorization mechanism, enforced at the database level

**API-Level Authorization:**
1. User ID is extracted from the authenticated session cookie
2. The authenticated user ID is automatically injected into database queries
3. Supabase client is configured to pass the session to the database
4. RLS policies in PostgreSQL verify ownership for all operations

**Security Principles:**
- User ID is NEVER accepted from request bodies or query parameters
- User ID is ALWAYS derived from the authenticated session
- All database operations use parameterized queries to prevent SQL injection
- Sensitive operations (delete, update) require ownership verification

### CORS Configuration

- **Allowed Origins:** Frontend domain (Astro application)
- **Allowed Methods:** GET, POST, PATCH, DELETE, OPTIONS
- **Allowed Headers:** Content-Type, Cookie
- **Allow Credentials:** Yes (required for cookie-based authentication)
- **Max Age:** 86400 (24 hours)
- **Important:** Cookie-based auth requires credentials to be included in requests

### Rate Limiting

**General Rate Limits:**
- 100 requests per minute per authenticated user
- 429 Too Many Requests response when exceeded
- Rate limit information in response headers:
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Timestamp when limit resets

**AI Generation Rate Limits:**
- 50 generations per day per user (business logic limit)
- Enforced by checking `ai_generation_analytics` table
- Resets at midnight UTC
- Separate from general API rate limits

---

## 5. Validation and Business Logic

### 5.1 Validation Rules by Resource

#### Sets
- **name:**
  - Required
  - Type: String
  - Min length: 1 character (after trimming whitespace)
  - Max length: 128 characters
  - Trimmed before storage
  - Must be unique per user
- **description:**
  - Optional
  - Type: String
  - Max length: 1000 characters
  - Can be null

#### Flashcards
- **set_id:**
  - Required
  - Type: UUID
  - Must reference an existing set owned by the user
- **front:**
  - Required
  - Type: String
  - Min length: 1 character
  - Max length: 200 characters
  - Cannot be only whitespace
  - Trimmed before validation
- **back:**
  - Required
  - Type: String
  - Min length: 1 character
  - Max length: 600 characters
  - Cannot be only whitespace
  - Trimmed before validation

#### Pending Flashcards
- **front_draft:**
  - Required
  - Type: String
  - Min length: 1 character
  - Max length: 200 characters
  - Cannot be only whitespace
- **back_draft:**
  - Required
  - Type: String
  - Min length: 1 character
  - Max length: 600 characters
  - Cannot be only whitespace

#### AI Generation
- **source_text:**
  - Required
  - Type: String
  - Min length: 1000 characters
  - Max length: 20,000 characters
- **hint:**
  - Optional
  - Type: String
  - Max length: 500 characters

### 5.2 Business Logic Implementation

#### Daily Generation Limit Enforcement

**Implementation:**
1. On each `POST /api/v1/flashcards/generate` request:
   - Query `ai_generation_analytics` table
   - Count records where `user_id = auth.uid()` AND `created_at::date = CURRENT_DATE`
   - If count >= 50, return `429 Too Many Requests`
   - Otherwise, proceed with generation

2. After successful generation:
   - Insert metadata record into `ai_generation_analytics`
   - Include: model, provider, token counts, duration, cost
   - Do NOT store source text or generated content

3. Quota endpoint calculation:
   - Same query as above to get `used_today`
   - Calculate `remaining = 50 - used_today`
   - Calculate `resets_at` as next midnight UTC

**Database Query:**
```sql
SELECT COUNT(*)
FROM ai_generation_analytics
WHERE user_id = auth.uid()
  AND created_at::date = CURRENT_DATE;
```

#### Automatic Set Categorization

**Trigger Conditions:**
- After a flashcard is accepted into a set
- Set has at least 5 flashcards
- Set's `category` field is currently NULL

**Implementation:**
1. Check trigger conditions in `POST /api/v1/pending-flashcards/:id/accept`
2. If conditions met, queue async categorization job
3. Categorization process:
   - Fetch all flashcards in the set
   - Concatenate front/back text (up to 2000 chars total)
   - Call AI API with prompt: "Categorize this flashcard set into one of these categories: [list]. Return only the category name."
   - Update `sets.category` with result
   - Handle errors gracefully (leave category as NULL)

**MVP Simplification:**
- Can be synchronous (inline) for MVP
- Async job queue (e.g., Redis, database-based) for production

#### Pending Flashcard Acceptance

**Process:**
1. Validate pending flashcard exists and belongs to user (RLS enforces this)
2. Validate or create target set:
   - If `set_id` provided: Verify set exists and belongs to user
   - If `new_set` provided: Create new set with validation
3. Begin transaction:
   - Insert new flashcard into `flashcards` table
   - Delete record from `pending_flashcards` table
   - Update set's `updated_at` timestamp
4. Check if set categorization should trigger
5. Commit transaction
6. Return created flashcard and set info

**Database Integrity:**
- Composite foreign key ensures flashcard's `set_id` and `user_id` match
- Cascading delete: If set is deleted, all flashcards are deleted
- Cascading delete: If user is deleted, all data is deleted

#### Flashcard Review Recording

**Process (Future Implementation):**
1. Validate flashcard exists and belongs to user
2. Parse quality rating (0-5 scale)
3. Fetch current review state (ease factor, interval, repetitions)
4. Apply spaced repetition algorithm:
   - Calculate new ease factor
   - Calculate new interval
   - Calculate next review date
5. Insert review record into `flashcard_reviews` table
6. Update flashcard's next review metadata
7. Return updated scheduling info

**MVP Simplification:**
- For MVP, may simply mark cards as "reviewed" without full algorithm
- Full spaced repetition logic to be added in next iteration

### 5.3 Error Handling Strategy

**Error Response Format:**
All errors include a unique `id` (UUID) for tracking and debugging purposes. This allows easier correlation of errors in logs and client-side error reporting.

**Validation Errors (400 Bad Request):**
- Return structured error with field-level details
- Format: `{error: {id: "uuid", code, message, details: [{field, message}]}}`
- Client can display errors next to relevant form fields
- The `id` field helps track specific error instances

**Authorization Errors (401/403):**
- 401: Invalid or missing session
- 403: Valid session but insufficient permissions (rare with RLS)
- Generic messages to avoid information leakage
- Include error `id` for tracking

**Not Found Errors (404):**
- Used when resource doesn't exist OR user doesn't own it
- Prevents user enumeration attacks
- Generic message: "Resource not found"

**Conflict Errors (409):**
- Duplicate set names
- Concurrent modifications
- Include specific conflict reason in message

**Rate Limit Errors (429):**
- Include retry-after information
- For generation limit: Include reset timestamp
- For general rate limit: Include seconds until reset

**Server Errors (500/503):**
- Log full error details server-side (including error `id`)
- Return generic message to client with error `id`
- 503 for temporary AI service unavailability
- Error `id` helps correlate client reports with server logs

### 5.4 Data Privacy Enforcement

**Source Text Handling:**
- Source text is received in `POST /api/v1/flashcards/generate`
- Passed directly to AI API
- NEVER stored in database
- NEVER logged in application logs
- Only generated candidates are stored (in `pending_flashcards`)

**Rejected Candidates:**
- When `DELETE /api/v1/pending-flashcards/:id` is called
- Record is permanently deleted (hard delete)
- No soft delete, no retention, no backups
- Content is irrecoverable

**Analytics Collection:**
- `ai_generation_analytics` stores only metadata
- Fields: model, provider, tokens, duration, cost
- NO content fields (no prompts, no outputs)
- Used for cost tracking and optimization only

**Audit Logging:**
- Consider logging user actions (create, delete) for security
- Log only action type and resource ID, not content
- Helps detect suspicious activity without storing sensitive data

---

## 6. Response Format Standards

### Success Response Format

All successful responses follow a consistent structure:

**Single Resource:**
```json
{
  "id": "uuid",
  "field1": "value1",
  "field2": "value2",
  ...
}
```

**Resource Collection:**
```json
{
  "data": [
    { "id": "uuid", ... },
    { "id": "uuid", ... }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_items": 42,
    "total_pages": 3
  }
}
```

**Timestamps:**
- All timestamps in ISO 8601 format with timezone
- Example: `"2025-01-15T10:30:00Z"`
- Always UTC timezone

### Error Response Format

All error responses follow this structure with a unique `id` field for tracking:

```json
{
  "error": {
    "id": "uuid",
    "code": "ERROR_CODE_CONSTANT",
    "message": "Human-readable error message",
    "details": [
      {
        "field": "field_name",
        "message": "Field-specific error message"
      }
    ]
  }
}
```

The `id` field is a UUID that uniquely identifies each error instance, making it easier to:
- Track specific errors in logs
- Correlate client-side error reports with server-side logs
- Debug issues reported by users
- Monitor error patterns and frequencies

**Standard Error Codes:**
- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Insufficient permissions
- `VALIDATION_ERROR` - Input validation failed
- `RESOURCE_NOT_FOUND` - Resource doesn't exist
- `DUPLICATE_SET_NAME` - Set name already exists
- `GENERATION_LIMIT_EXCEEDED` - Daily AI limit reached
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `AI_SERVICE_ERROR` - AI generation failed
- `AI_SERVICE_UNAVAILABLE` - AI service temporarily down
- `INTERNAL_ERROR` - Unexpected server error

### HTTP Status Codes

- `200 OK` - Successful GET, PATCH
- `201 Created` - Successful POST (resource created)
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation error or malformed request
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Authenticated but not authorized
- `404 Not Found` - Resource doesn't exist
- `409 Conflict` - Resource conflict (e.g., duplicate name)
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Unexpected server error
- `503 Service Unavailable` - Temporary service outage

---

## 7. Implementation Notes

### Technology Stack Integration

**Astro + React:**
- API routes in Astro's `src/pages/api/v1/` directory (versioned endpoints)
- React components for interactive UI (forms, flashcard viewer)
- Server-side rendering for initial page loads
- Client-side hydration for interactivity

**Supabase Integration:**
- Use `@supabase/supabase-js` client library with cookie-based auth
- Initialize client with API URL and anon key
- Configure for cookie-based session storage
- Supabase automatically handles session management via cookies
- Client automatically passes session to RLS policies
- No manual token handling required

**Database Access:**
- All queries through Supabase client (respects RLS)
- Use TypeScript for type-safe queries
- Consider Supabase's generated types for database schema

**OpenRouter AI Integration:**
- HTTP requests to OpenRouter API
- Store API key in environment variables
- Implement retry logic for transient failures
- Set reasonable timeouts (e.g., 30 seconds)

### Performance Considerations

**Database Indexes:**
- Composite index on `ai_generation_analytics(user_id, created_at DESC)` for fast limit checks
- Index on `sets(user_id)` for efficient set listings
- Index on `flashcards(set_id)` for fast set flashcard queries
- Index on `pending_flashcards(user_id)` for pending list

**Query Optimization:**
- Use aggregate queries for flashcard counts (avoid N+1)
- Consider materialized view for `user_daily_ai_generation_counts`
- Limit deep pagination (e.g., max page 100)

**Caching Strategy:**
- Cache generation quota for 5 minutes (refresh periodically)
- Cache set lists for authenticated users (invalidate on mutations)
- Use ETags for conditional requests on large resources

**Async Operations:**
- Set categorization runs async (queue job)
- AI generation can be async for large texts (future)
- Background job for cleaning old pending flashcards (optional)

### Security Best Practices

**Input Validation:**
- Validate all inputs on both client and server
- Sanitize HTML if rich text support is added
- Use parameterized queries (Supabase handles this)

**Authentication:**
- Use secure, httpOnly cookies for session storage (handled by Supabase)
- Supabase automatically handles session refresh
- No manual token management required

**Rate Limiting:**
- Implement at API gateway or application level
- Track by authenticated user ID
- Use Redis for distributed rate limiting (production)

**Logging and Monitoring:**
- Log all authentication events
- Log all authorization failures
- Monitor AI generation success rates
- Alert on unusual patterns (e.g., spike in rejections)

**Data Encryption:**
- HTTPS for all API communication (enforce via middleware)
- Database encryption at rest (Supabase provides this)
- Sensitive config in environment variables, never committed

### Future Enhancements

**Spaced Repetition:**
- Add `flashcard_reviews` table for review history
- Implement SuperMemo-2 or Leitner algorithm
- Track ease factors, intervals, due dates per flashcard

**Bulk Operations:**
- Bulk flashcard import (CSV, JSON)
- Bulk edit flashcards in a set
- Bulk delete sets

**Collaboration:**
- Share sets with other users (read-only or editable)
- Public set library
- Set templates

**Advanced Features:**
- Image upload for flashcards (front/back)
- Audio pronunciation for language learning
- Tagging system for flashcards
- Study statistics and progress tracking

**API Versioning:**
- All endpoints use `/api/v1/` prefix from the start
- Future versions will use `/api/v2/`, etc.
- Maintain backward compatibility between versions
- Provide deprecation notices when phasing out old versions
