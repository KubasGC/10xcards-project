# Testing Setup

This project uses a comprehensive testing setup with unit tests and end-to-end tests.

## Testing Stack

- **Vitest** - Fast unit testing framework with Jest-compatible API
- **Playwright** - End-to-end testing with multi-browser support
- **Testing Library** - React component testing utilities
- **MSW** - API mocking for isolated testing

## Test Structure

```
src/test/
├── unit/
│   └── auth/
│       └── AuthForm.test.tsx          # React component tests
├── e2e/
│   └── auth.spec.ts                   # End-to-end tests
├── helpers/
│   └── supabase-test-helpers.ts       # Mock utilities & fixtures
├── mocks/
│   ├── server.ts                      # MSW server setup
│   └── handlers.ts                    # API mock handlers
├── setup.test.ts                      # Test file setup
├── setup.ts                           # Vitest setup
├── utils.tsx                          # Testing utilities
└── README.md                          # This file

Other test files:
├── src/lib/schemas/auth.schema.test.ts             # Zod validation tests
├── src/pages/api/v1/auth/login.test.ts             # Login API endpoint tests
├── src/pages/api/v1/auth/register.test.ts          # Register API endpoint tests
└── src/components/features/auth/AuthForm.test.tsx  # AuthForm component tests
```

## Test Coverage Summary

### Unit Tests (107 tests)

**Validation Tests** (42 tests)
- Login schema: email & password validation
- Register schema: email, password requirements, password matching
- Helper functions with edge cases

**API Endpoint Tests** (53 tests)
- **Login Endpoint** (23 tests)
  - Happy path (successful login)
  - Validation errors (invalid input)
  - Authentication errors (wrong credentials, rate limiting, etc.)
  - Exception handling (network errors, malformed responses)
  - Edge cases (case sensitivity, extra fields, security)

- **Register Endpoint** (30 tests)
  - Happy path (successful registration)
  - Validation errors (email format, password requirements, mismatched passwords)
  - Authentication errors (duplicate account, weak password, signup disabled)
  - Exception handling (network errors, malformed responses)
  - Edge cases (long emails/passwords, special characters, security)

**Component Tests** (10 tests)
- AuthForm wrapper component: rendering, props, styling
- Error display and loading states

### E2E Tests (25 tests - Playwright)
- Complete authentication flows
- User interactions across pages
- Redirect behavior and routing

**Note on Middleware Testing:**
- Middleware tests (auth.ts, core.ts) are validated through E2E tests
- Direct unit testing of Astro middleware requires special configuration (astro:middleware imports)
- E2E tests comprehensively cover middleware functionality by testing complete request/response cycles

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm run test

# Run specific test file
npm run test -- src/lib/schemas/auth.schema.test.ts

# Run tests in watch mode
npm run test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Authentication Tests Specifically
```bash
# Run all auth-related unit tests
npm run test -- src/lib/schemas/auth.schema.test.ts
npm run test -- src/pages/api/v1/auth/login.test.ts
npm run test -- src/pages/api/v1/auth/register.test.ts

# Run auth E2E tests
npx playwright test auth.spec.ts

# Run E2E tests with UI
npx playwright test auth.spec.ts --ui

# Run E2E tests in headed mode (visible browser)
npx playwright test auth.spec.ts --headed
```

### All Tests
```bash
# Run both unit and e2e tests
npm run test:all
```

## Coverage Requirements

The project maintains 80% coverage thresholds for:
- Statements
- Branches
- Functions
- Lines

Coverage reports are generated in HTML format in the `coverage/` directory.

## Writing Tests

### Unit Tests
- Use `@testing-library/react` for component testing
- Test user interactions, not implementation details
- Use MSW for API mocking
- Follow the AAA pattern: Arrange, Act, Assert

Example:
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### API Endpoint Tests
- Mock the Supabase client using `createMockSupabaseClient`
- Test success paths, validation errors, and exception handling
- Use `createMockRequest` for creating test requests
- Follow the AAA pattern

Example:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { POST } from './login'
import { createMockSupabaseClient, createMockAstroContext, createMockRequest } from '@/test/helpers/supabase-test-helpers'

describe('POST /api/v1/auth/login', () => {
  it('should login successfully', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient({
      signInWithPassword: createMockAuthSuccessResponse({ email: 'test@example.com' })
    })
    const context = createMockAstroContext({ supabase: mockSupabase })
    const request = createMockRequest({ email: 'test@example.com', password: 'Password123' })

    // Act
    const response = await POST({ request, locals: context.locals })

    // Assert
    expect(response.status).toBe(200)
  })
})
```

### E2E Tests
- Test complete user workflows
- Use page object pattern for complex interactions
- Test across multiple browsers
- Focus on critical user paths

Example:
```typescript
import { test, expect } from '@playwright/test'

test('user can login', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill('user@example.com')
  await page.getByLabel(/password/i).fill('Password123')
  await page.getByRole('button', { name: /zaloguj/i }).click()
  await expect(page).toHaveURL('/dashboard')
})
```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Pushes to main/master branches

The CI pipeline includes:
- Linting
- Unit tests with coverage
- E2E tests
- Build verification

## Mock Data & Helpers

### Supabase Test Helpers
Located in `src/test/helpers/supabase-test-helpers.ts`:

```typescript
import { 
  createMockUser,
  createMockAuthSuccessResponse,
  createMockAuthErrorResponse,
  createMockSupabaseClient,
  createMockAstroContext,
  createMockRequest,
  parseResponseBody
} from '@/test/helpers/supabase-test-helpers'

// Create a mock user
const user = createMockUser({ email: 'custom@example.com' })

// Create success/error responses
const successResponse = createMockAuthSuccessResponse({ email: 'test@example.com' })
const errorResponse = createMockAuthErrorResponse('User not found')

// Mock full Supabase client
const mockSupabase = createMockSupabaseClient({
  signInWithPassword: successResponse
})

// Create mock Astro context
const context = createMockAstroContext({ supabase: mockSupabase })

// Create mock request
const request = createMockRequest({ email: 'test@example.com', password: 'Password123' })

// Parse response body
const body = await parseResponseBody(response)
```

## Test Patterns & Best Practices

### 1. Happy Path Tests
Always test the main success scenario first:
```typescript
it('should [expected behavior] with valid inputs', async () => {
  // Setup with valid data
  // Execute main action
  // Assert success
})
```

### 2. Validation Error Tests
Test each validation rule separately:
```typescript
it('should reject [field] when [condition]', async () => {
  // Setup with invalid field value
  // Execute action
  // Assert validation error with specific error code
})
```

### 3. Error Handling Tests
Test each error scenario from external services:
```typescript
it('should handle [service] error', async () => {
  // Mock service to return error
  // Execute action
  // Assert proper error response
})
```

### 4. Edge Case Tests
Test boundary conditions and unusual inputs:
```typescript
it('should handle [unusual input] gracefully', async () => {
  // Setup with edge case data
  // Execute action
  // Assert expected behavior (not error)
})
```

## Troubleshooting

### Tests failing with "module not found"
- Run `npm install` to ensure dependencies are installed
- Check that import paths are correct relative to workspace root

### E2E tests timing out
- Increase timeout in `playwright.config.ts`
- Check that dev server is running: `npm run dev`

### Mock data not working
- Verify mock helpers are imported from correct path
- Check that vi.fn() mock is properly configured
- Ensure mock is passed to all required consumers
