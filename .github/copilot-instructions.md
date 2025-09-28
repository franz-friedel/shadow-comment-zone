# Copilot Instructions for AI Agents

## Project Overview
- **Type:** Vite + React + TypeScript SPA
- **UI:** shadcn-ui components, Tailwind CSS
- **Purpose:** Shadow comment section for YouTube videos, with user profiles and ad integration

## Key Architecture & Patterns
- **Entry Point:** `src/main.tsx` bootstraps the app
- **App Shell:** `src/App.tsx` manages global layout and routing
- **Pages:** All main views in `src/pages/` (e.g., `Index.tsx`, `Profile.tsx`, `Auth.tsx`)
- **Components:** Reusable UI in `src/components/` and `src/components/ui/` (shadcn-ui)
- **Hooks:** Custom hooks in `src/hooks/` (e.g., `useAuth`, `use-toast`)
- **Services:** External integrations (e.g., Google Auth) in `src/services/` and `src/integrations/`
- **Supabase:** Used for backend/auth, config in `src/integrations/supabase/`
- **Styling:** Tailwind config in `tailwind.config.ts`, global styles in `src/App.css` and `src/index.css`

## Developer Workflow
- **Install:** `npm i`
- **Dev Server:** `npm run dev` (hot reload, Vite)
- **Build:** `npm run build`
- **Lint:** `npm run lint` (if configured)
- **Config:** See `vite.config.ts`, `tsconfig*.json`, `postcss.config.js`, `eslint.config.js`

## Project-Specific Conventions
- **UI:** Use shadcn-ui components from `src/components/ui/` for consistency
- **Pages:** Route-level views in `src/pages/`, not in `src/components/`
- **Auth:** Supabase for authentication, logic in `src/hooks/useAuth.tsx` and `src/integrations/supabase/`
- **Ads:** AdSense integration via `src/components/AdSenseAd.tsx` and related files
- **Profile:** User profile logic in `src/components/ProfileManager.tsx` and dialogs
- **Utils:** Shared utilities in `src/lib/utils.ts`

## External Integrations
- **Supabase:** Config in `src/integrations/supabase/client.ts` and `types.ts`
- **Google Auth:** Logic in `src/services/googleAuth.ts`
- **Ads.txt:** Managed in `public/ads.txt` and `src/pages/AdsTxt.tsx`

## Examples
- To add a new UI element, create in `src/components/ui/` and import in a page/component
- For new pages, add to `src/pages/` and update routing in `src/App.tsx`
- For authentication, use `useAuth` hook and Supabase client

## References
- [README.md](../README.md) for setup and deployment
- [Lovable Project](https://lovable.dev/projects/e9ae69df-d69b-4ec3-ad8c-6d0873b221c9) for cloud editing/deployment

---
**Feedback:** If any section is unclear or missing, please specify which workflows, conventions, or integrations need more detail.