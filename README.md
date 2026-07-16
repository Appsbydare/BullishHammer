# Bullish Hammer - Project Handover Document

This document provides a comprehensive overview of the **Bullish Hammer** project state, architecture, and features. It serves as a single source of truth for the project, perfect for onboarding new developers or AI agents.

## 1. Project Overview
**Bullish Hammer** is a premium retail FX trading publication. The architecture is a modern Next.js 15+ application connected to a Headless Sanity CMS backend, featuring an automated AI publishing pipeline.

### Core Stack
- **Frontend/Backend App**: Next.js 16.2.10 (App Router, Turbopack)
- **CMS**: Sanity (v3) running on `http://localhost:3333`
- **Styling**: Strict Vanilla CSS (No Tailwind utility classes allowed). Custom animations (`animate-fade-in`, `animate-slide-down`, `Lenis smooth scrolling`).
- **Typography**: `Inter` and `Outfit` (sans-serif), `Aktura` (Serif/Logo)

## 2. Directory Structure
The workspace is a monorepo containing two main folders:
- `/web`: The Next.js application.
- `/studio`: The Sanity CMS application.

### Next.js Routing (`/web/src/app`)
- **`/(public)`**: Contains the public-facing pages wrapped in a layout with the main `Header` and `Footer`.
  - `/page.tsx`: The Homepage. Fetches live Market News, FX Rates, and Published Articles.
  - `/article/[slug]/page.tsx`: Dynamic article rendering page. Supports portable text and dynamic Sponsor Ad injection.
- **`/admin`**: A fully decoupled, secure Admin Dashboard.
  - `/layout.tsx`: A custom layout with a dark-mode Sidebar. *Does not inherit the public header/footer.*
  - `/page.tsx`: The main dashboard view containing the Drafts Review UI and Active Sponsors grid.
  - `/LoginForm.tsx` & `/actions.ts`: A client-side login component with a shaking error animation and server actions for authentication.
- **`/api`**:
  - `/api/ingest/route.ts`: A secure, secret-protected endpoint that accepts article payloads, fetches/creates author and category references, and pushes the payload as a `draft` to Sanity.

## 3. Data & AI Pipelines
### The AI Article Generator (`generate-article.js`)
Located in the root of `/web`, this Node.js script is the engine of the automated news pipeline.
1. It fetches live, raw market news using the **Marketaux API**.
2. It sends that raw data to **Google Gemini (3.5 Flash)** with a highly specialized prompt to write a premium financial article.
3. It securely `POST`s the finished article to our local `/api/ingest` endpoint using a Bearer token (`AI_INGEST_SECRET`).

> [!NOTE]
> This script can be run manually via the terminal (`node generate-article.js`) OR triggered directly from the Admin Dashboard via the "✨ Generate AI Article" button.

### Content Approval Flow
When the AI pushes an article via the ingest API, it is explicitly set to `status = 'draft'`. 
1. The public frontend queries (`page.tsx`) explicitly filter out drafts (`status != 'draft'`).
2. The admin logs into `/admin` and sees pending drafts.
3. Clicking **Publish** fires a Server Action that patches the document in Sanity to `published` and revalidates the Next.js cache.

## 4. Sponsor & Ad Management
Ads are managed elegantly through Sanity.
- **Schema**: `sponsorCampaign.ts` (Sponsor Name, Destination URL, Banner Image, Disclosure Label).
- **Injection**: The `article/[slug]/page.tsx` dynamically fetches the active `sponsorCampaign`. If one exists, it strips out the generic ad placeholders and renders the sponsor's custom banner image and URL directly in the article body.
- **Management**: Admins can manage these directly from Sanity Studio, which provides the best UI for image uploading.

## 5. Environment Variables (`/web/.env.local`)
The Next.js app relies on several critical environment variables:
- `NEXT_PUBLIC_SANITY_PROJECT_ID`: Sanity Project ID (`cx58gblo`)
- `NEXT_PUBLIC_SANITY_DATASET`: Sanity Dataset (`production`)
- `CURRENCYFREAKS_API_KEY`: API key for live FX rates.
- `MARKETAUX_API_TOKEN`: API key for live market news (ingested by the AI).
- `AI_INGEST_SECRET`: A secure token that the `generate-article.js` script uses to authorize with the `/api/ingest` endpoint.
- `SANITY_API_WRITE_TOKEN`: A Sanity token with `Editor` permissions used by Next.js Server Actions to create drafts and patch statuses.
- `GEMINI_API_KEY`: Google AI Studio key used for content generation.
- `ADMIN_PASSWORD`: The plaintext password used to access the `/admin` dashboard.

## 6. Design System & Styling Rules
> [!IMPORTANT]
> **Strict Rule:** Do not use Tailwind CSS utility classes in this project. All styling must be written in pure CSS files (`globals.css`, `admin.css`).

The design language of Bullish Hammer is premium, sleek, and slightly brutalist. 
- **Colors**: Deep blacks (`#000`, `#050505`, `#0a0a0a`), subtle gray borders (`#1f1f1f`, `#333`), and stark white text.
- **Effects**: Glassmorphism (`backdrop-filter: blur(20px)`), smooth CSS transitions, and subtle hover lifts (`transform: translateY(-1px)`).
- **Buttons**: Muted grayscale default states, with context colors (Green/Red) appearing subtly on hover states or borders to maintain a professional look.
