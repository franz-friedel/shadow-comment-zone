# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/e9ae69df-d69b-4ec3-ad8c-6d0873b221c9

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/e9ae69df-d69b-4ec3-ad8c-6d0873b221c9) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/e9ae69df-d69b-4ec3-ad8c-6d0873b221c9) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Automation

Scripts:
- `npm run lint` (check)
- `npm run lint:fix` (auto-fix)
- `npm run format`
- `npm run typecheck`
- `npm run check` (lint + type)
- `npm run check:fix`

Pre-commit:
- Husky + lint-staged auto-fix staged files.

CI:
- GitHub Actions runs lint + typecheck + build on push/PR.

## Automated Lint & Format

On save: VS Code runs ESLint fix + organize imports + Prettier (see .vscode/settings.json).  
On commit: Husky + lint-staged auto-fix staged files (unused imports removed, formatted).  
Manual commands:
- `npm run lint`
- `npm run lint:fix`
- `npm run format`
- `npm run typecheck`
- `npm run check`
- `npm run fix`

Only real TypeScript errors (types / logic) remain for manual attention.

## Shadow Comment Seeding (Bot)

For early traction the app can inject a small set (default 5) of clearly labeled seed "Bot" comments per video when the shadow thread is empty. These rows are flagged with `is_bot = true` (and a fixed pseudo user id) so they can be filtered or removed later.

Disable seeding by passing `autoSeed: false` to `useComments(videoId, { autoSeed: false })`.

Schema addition (if not present):

```sql
ALTER TABLE public.shadow_comments ADD COLUMN IF NOT EXISTS is_bot boolean DEFAULT false;
```
