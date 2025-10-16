# Testing Setup

This project uses a comprehensive testing setup with unit tests and end-to-end tests.

## Testing Stack

- **Vitest** - Fast unit testing framework with Jest-compatible API
- **Playwright** - End-to-end testing with multi-browser support
- **Testing Library** - React component testing utilities
- **MSW** - API mocking for isolated testing

## Test Structure

```
tests/
├── unit/           # Unit tests for components and utilities
├── e2e/            # End-to-end tests
src/test/
├── setup.ts        # Vitest setup configuration
├── utils.tsx       # Testing utilities and helpers
└── mocks/          # MSW mock handlers
    ├── server.ts   # MSW server setup
    └── handlers.ts # API mock handlers
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### End-to-End Tests
```bash
# Run all e2e tests
npm run test:e2e

# Run e2e tests with UI
npm run test:e2e:ui

# Run e2e tests in headed mode (visible browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test auth.spec.ts
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
  await page.fill('[data-testid="email"]', 'user@example.com')
  await page.fill('[data-testid="password"]', 'password')
  await page.click('[data-testid="login-button"]')
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

## Mock Data

Use the test utilities for consistent mock data:

```typescript
import { createMockUser, createMockFlashcard } from '@/test/utils'

const user = createMockUser({ email: 'custom@example.com' })
const flashcard = createMockFlashcard({ front: 'Custom front' })
```
