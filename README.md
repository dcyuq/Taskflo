<p align="center">
  <img src="my-task-manager/src/assets/taskflo-wordmark.svg" alt="taskflo" width="220">
</p>

<p align="center"><strong>Assign. Track. Done.</strong></p>

Taskflo is a task manager for small teams that does less on purpose. Give work an owner and a deadline, see where it stands, and get on with it.

## Features

- **Workspaces.** One per team, listed in a sidebar with your own categories. Drag workspaces and categories to reorder them, and right-click for rename, invite, leave or delete.
- **Tasks.** List and board views, owners, due dates, quick add, filter by person, undo on mark done, and keyboard-friendly drag and drop on the board.
- **Overview and Team tabs.** See what's late and due today, who is on the team, and manage invites in one place.
- **Personal views.** My tasks and Due soon across every workspace, plus Ctrl+K search.
- **Invites.** Send email invites, or create invite links with an expiry and an optional use limit. Anyone can join by pasting a link or code, and pending invites wait in their own Invites view.
- **Live updates.** Task, member, workspace and invite changes show up for everyone without a refresh.
- **Accounts.** Email sign-up with a 6-digit code, a password checklist and a strength meter.

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, React Router, Motion, dnd-kit, plain CSS with design tokens, self-hosted Sora font
- **Backend:** Supabase (Postgres, Auth, row-level security, Realtime, Edge Functions)
- **Email:** Resend, called from a Supabase Edge Function
- **Password strength:** zxcvbn-ts, loaded only when someone types a password
- **Express server:** an optional stub in `backend/`, not used by the app yet

## Getting started

You need Node.js 20.19+ or 22.12+ and a Supabase project.

```sh
git clone <repo-url> taskflo
cd taskflo/my-task-manager
npm install
cp .env.example .env
npm run dev
```

Fill in `.env` from your Supabase project (Project settings, API), then open http://localhost:5173.

| Variable | What it is |
| --- | --- |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your project's anon (public) key |

Only the anon key belongs in the frontend. Never commit `.env`.

### Invite emails

The `send-invites` Edge Function sends invite emails. Set these secrets in Supabase (Edge Functions, Secrets):

| Secret | What it is |
| --- | --- |
| `RESEND_API_KEY` | Your Resend API key |
| `SITE_URL` | Where the app runs, used to build join links |

Without them, invites are still saved and show up in the app when people sign in.

## Database

The app runs on Supabase. The database schema is managed separately and isn't part of this repo. Every table has row-level security, and policies limit each user to their own data and the workspaces they belong to.

## Project structure

```
taskflo/
├── my-task-manager/          React app (Vite)
│   └── src/
│       ├── assets/           Wordmark and static assets
│       ├── components/       Sidebar, dialogs, task list and board, invite forms
│       ├── hooks/            Workspace context, realtime, task actions, throttling
│       ├── pages/            Landing, auth, dashboard, workspace tabs, invites, 404
│       ├── services/         Supabase data access
│       └── utils/            Errors, dates, motion tokens, password rules
├── supabase/
│   └── functions/            Edge Function for invite emails
└── backend/                  Optional Express server
```

## Security

- **Row-level security on every table.** Access is checked in Postgres, never trusted from the client. Database functions run with an empty `search_path` and aren't callable by signed-out users.
- **Invite tokens.** Long random tokens checked on the server. Email invites are single use and only work for the invited address. Link lookups are rate limited, and invalid, expired or revoked invites all show the same message.
- **Rate limiting.** Server limits on invites and invite lookups, client throttling on sign in, sign up and invites, and helmet plus rate limiting on the Express server.
- **Generic errors.** Users see plain-language messages, never raw database errors. Unknown pages and workspaces you can't access show the same 404.
- **Content Security Policy.** Production builds ship a CSP that only allows the app itself and Supabase.
- **No secrets in the repo.** `.env` is ignored and `.env.example` holds placeholders only.

## Roadmap

- [ ] AI workload assistant
- [ ] Password reset
- [ ] Admin role for workspaces
- [ ] Tests for auth, workspace and invite flows
- [ ] Deployment
