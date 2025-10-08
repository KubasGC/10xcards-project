# 10xCards

![version](https://img.shields.io/badge/version-0.0.1-blue) ![status](https://img.shields.io/badge/status-WIP-orange) ![node](https://img.shields.io/badge/node-22.14.0-43853d) ![license](https://img.shields.io/badge/license-MIT-lightgrey)

10xCards helps you quickly generate, organize, and learn with high‑quality flashcards. It lowers the barrier to spaced repetition by using generative AI to draft flashcard candidates from pasted text (with an optional hint) and guiding users through simple review, acceptance, and study flows.

## Table of contents

- [10xCards](#10xcards)
  - [Table of contents](#table-of-contents)
    - [Project description](#project-description)
    - [Tech stack](#tech-stack)
    - [Getting started locally](#getting-started-locally)
    - [Available scripts](#available-scripts)
    - [Project scope](#project-scope)
    - [Project status](#project-status)
    - [License](#license)

### Project description

10xCards enables fast creation of quality flashcards using AI and provides an intuitive acceptance/editing flow plus spaced repetition study sessions. The MVP focuses on:

- Generating flashcard candidates from pasted text and an optional hint
- Manual card creation with live character counters (200 front, 600 back)
- Browsing, editing, and deleting accepted cards organized into sets
- Basic email/password authentication (sign up, sign in, sign out)
- Pending section for unaccepted candidates (edit/accept/reject)
- Spaced repetition study sessions using an open‑source library
- Daily AI generation limits (50/user, reset at midnight) and clear messaging
- Anonymous generation metadata (model, time, tokens, cost) without storing input/output text

For more background and user stories, see Product Requirements (Polish): [`./.ai/prd.md`](./.ai/prd.md).

### Tech stack

- Frontend: Astro 5 + React 19, TypeScript 5
- Styling: Tailwind CSS 4, shadcn/ui
- Backend/BaaS: Supabase (PostgreSQL, SDK, auth)
- AI provider: OpenRouter (multi‑model access and cost controls)
- CI/CD: GitHub Actions
- Hosting: DigitalOcean (Docker image)

Reference: [`./.ai/tech-stack.md`](./.ai/tech-stack.md)

### Getting started locally

Prerequisites:

- Node.js 22.14.0 (see `.nvmrc`)
- npm (uses the provided `package-lock.json`)

Setup:

```bash
git clone <this-repo-url>
cd 10xcards-project
nvm use # ensures Node 22.14.0
npm ci
npm run dev
```

Useful commands:

```bash
# Build production assets to ./dist
npm run build

# Preview the built site locally
npm run preview

# Lint and auto-fix issues
npm run lint
npm run lint:fix

# Format supported files
npm run format
```

Notes:

- This repository currently contains the Astro + React scaffold and UI foundations. Supabase and OpenRouter configuration will be added during implementation of the MVP features (see Scope below).
- The Astro dev server typically runs at http://localhost:3000 by default.

### Available scripts

- `dev`: Start the Astro development server (default: http://localhost:3000)
- `build`: Build the site for production into `dist/`
- `preview`: Preview the production build locally
- `astro`: Run the Astro CLI directly
- `lint`: Run ESLint over the codebase
- `lint:fix`: Attempt to auto‑fix lint issues
- `format`: Run Prettier to format supported files

### Project scope

MVP in scope:

- Accounts: email + password (register, login, logout); protected routes and APIs
- Sets: create, list, view; automatic AI categorization for analytics
- AI generation: paste source text + optional hint → list of candidates; edit before accept; accept/reject; assign accepted cards to existing/new set; daily limit 50/user with midnight reset and clear messaging; Pending screen for unaccepted candidates
- Manual cards: create with character limits and live counters (200 front, 600 back); edit and delete accepted cards
- Study: integrate an open‑source spaced repetition library; start a session for a chosen set; present due cards; record user ratings per library semantics
- Analytics (anonymous): record model, generation time, tokens, cost; never store user input/output text

Out of scope (MVP):

- Custom/advanced repetition algorithms (e.g., SuperMemo, Anki)
- Multi‑format import (PDF, DOCX, etc.)
- Sharing sets between users
- External education platform integrations
- Native mobile apps (web only)

Key constraints and assumptions:

- Daily AI generation limit: 50 per user; reset at midnight
- Only accepted cards and account data are stored; rejected candidates and raw pasted text are not persisted
- Automatic set categorization is used only for analytics

For full user stories and acceptance criteria, see [`./.ai/prd.md`](./.ai/prd.md).

### Project status

- Version: 0.0.1
- Status: Work in progress (pre‑MVP). Core scaffold is present (Astro 5 + React 19 + Tailwind 4 + shadcn/ui, TypeScript 5, ESLint/Prettier). Backend (Supabase) and AI integration (OpenRouter) will be added as features are implemented per PRD.

### License

License: MIT