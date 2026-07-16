# Bullish Hammer

Bullish Hammer is a premium retail FX trading publication. It uses a Next.js frontend integrated with a headless Sanity CMS backend and an automated, AI-driven content ingestion pipeline.

## System Architecture

The project is structured as a monorepo:
* `/web`: Next.js 15+ application (App Router) handling the public website and the secure admin dashboard.
* `/studio`: Sanity CMS v3 configuration running the content manager.

### Key Workflows

1. **AI Content Generation (`web/generate-article.js`):**
   A Node.js script fetches live market news from the Marketaux API and uses Google Gemini (configurable model) to write financial news articles. These are POSTed to the Next.js `/api/ingest` endpoint using a secure ingestion token.

2. **Editorial Content Flow:**
   Articles are ingested as `draft` documents. Admins log in via `/admin` (secured using NextAuth and Credentials validation) to review, approve (publish), or delete the drafts.

3. **Ad Placement & Ingestion:**
   Sponsor campaigns and ad banners are managed via Sanity and dynamically injected into slots inside the article detail pages.

## Setup and Installation

### Prerequisites
* Node.js 18+
* Local Sanity CLI (recommended)

### Environment Configuration

Create a `web/.env.local` file with the following variables:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=cx58gblo
NEXT_PUBLIC_SANITY_DATASET=production

# API Keys
CURRENCYFREAKS_API_KEY=your_currencyfreaks_key
MARKETAUX_API_TOKEN=your_marketaux_token
GEMINI_API_KEY=your_google_gemini_key
POLLINATIONS_API_KEY=your_pollinations_key

# Authentication & Ingestion Security
ADMIN_PASSWORD=your_admin_login_password
AUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=http://localhost:3000
AI_INGEST_SECRET=secure_token_for_ingestion_api
SANITY_API_WRITE_TOKEN=sanity_token_with_editor_permissions
GEMINI_MODEL=gemini-2.5-flash-lite
IMAGE_GEN_MODEL=flux
```

### Running Locally

1. Install dependencies at the root of the project:
   ```bash
   npm install
   ```

2. Start the development server (runs both the Next.js app on port 3000 and Sanity Studio on port 3333):
   ```bash
   npm run dev
   ```

3. To generate an AI article manually:
   ```bash
   cd web
   node generate-article.js
   ```

## Development Guidelines

### Styling Rules
* Strictly write vanilla CSS in the global stylesheet (`web/src/app/globals.css`) or the admin panel stylesheet (`web/src/app/admin/admin.css`).
* Tailwind CSS or utility-first frameworks must not be used.

### Security and Sessions
* All protected endpoints and actions verify sessions server-side using the `auth()` function from NextAuth.
* NextAuth sessions expire after 1 hour of inactivity.
