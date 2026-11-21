# NunezTracker

Notes, tasks, calendar events, and any custom object type you add in Admin — all on the same data model. Each account has a private workspace. Completing work earns points, streaks, and badges. An onboarding wizard seeds recurring tasks and check-in hours.

## Run locally

```bash
npm install
npm run dev
```

Open the printed local URL (port **43127**).

- There is **no guest mode**. Sign up with email and password (8+ characters).
- Signups stay **pending** until an admin approves them under Admin → Users.
- The bootstrap admin is `raypn93@gmail.com`. On first successful mail send, a generated password is emailed there (not logged). Later deploys do not rotate it.
- Sign-in and sign-up are rate limited.
- Set Admin → Notification email so pending-signup alerts have a destination.

Without `DATABASE_URL`, data lives in memory for this process and the UI labels it **sample data**. With Postgres, set `DATABASE_URL` and the app applies `migrations/001_init.sql` on first use.

Published as a **private** Cursor app, sign-in is the Cursor viewer. Email/password is for local development.

## Push notifications

In-app check-ins always run from your check-in hours. Browser push needs `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` (bind them in Cursor app secrets). Until those exist, reminders show as on-screen banners.

## Admin

- **Object management** — rename types, statuses, add types such as Documents
- **Object fields** — add a Priority dropdown (or any field) to a type; record forms pick it up automatically

## Scoring

| Action | Points |
| Complete task on time | +10 |
| Complete task late | +5 |
| Mark event done | +8 |
| Answer a check-in | +2 |
| Skip | 0 |
