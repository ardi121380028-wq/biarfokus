# BiarFokus

BiarFokus is a Pomodoro-focused productivity app for planning tasks, running focus sessions, and reviewing productivity.

## Current status

The current release includes Supabase email/password and Google OAuth authentication. Timer behavior, theme controls, task management, settings, and responsive UI are implemented locally in the browser until the database migration is applied.

The following production integrations are planned and are not connected yet:

- Supabase database persistence (migration prepared in `supabase/migrations`)
- Stripe subscriptions
- Server-backed statistics and admin authorization

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4 / Turbopack
- Vercel for deployment
- Supabase for authentication and data
- Stripe for Pro billing

## Local development

Requirements:

- Node.js 20 or newer
- npm

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation

Run the checks used before a pull request:

```bash
npm run lint
npm run typecheck
npm run build
```

## Environment variables

Copy `.env.example` to `.env.local` when backend integrations are added. Never commit `.env.local` or send secret values through chat.

Apply the SQL migration in `supabase/migrations` from the Supabase SQL Editor before enabling cloud task persistence.

Public browser variables must use the `NEXT_PUBLIC_` prefix. Server-only secrets, including Stripe keys and webhook secrets, must not use that prefix.

## Deployment

The intended deployment flow is:

1. Push the project to a private GitHub repository.
2. Connect the repository to Vercel.
3. Configure environment variables separately for Preview and Production.
4. Use Vercel Preview deployments for pull-request QA.
5. Promote only verified changes from `main` to Production.

Do not add production credentials to source control.
