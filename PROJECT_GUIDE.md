# 🚀 Antigravity CRM — Complete Project Guide

**Lead Generation & Marketing Automation Platform** (`crm-project-main`)

This document explains the entire project: what it does, how it is architected,
how every module works, how to install and run it, how to use it, and how to test it.

---

## 1. What is this project?

Based on the requirements in `cdc_Workfow.pdf` (French *cahier des charges*), this is a
full-stack CRM + Marketing Automation platform that helps a company:

- **Generate** qualified prospects (from website forms, Facebook/Google Ads, LinkedIn, CSV import, WhatsApp, email, APIs…)
- **Centralize** contacts (leads with personal + company info, history)
- **Qualify** leads automatically with an AI **lead scoring** engine (0–100)
- **Automate** marketing: email / WhatsApp / SMS campaigns from reusable templates
- **Relance** prospects automatically via **automation rules** (IF/THEN workflow triggers)
- **Plan** commercial meetings (Google Meet / Zoom / in-person with generated links)
- **Track** performance: dashboard, KPIs, charts, revenue, conversion rate
- **Leverage AI** (OpenAI, with a built-in offline mock fallback): sales assistant chat,
  email writing, reply suggestions, lead qualification

It uses a modern API architecture: a **Laravel REST API** (backend) + a **React SPA**
(frontend), secured with **JWT** authentication and ready to connect to external tools
(n8n webhooks, OpenAI, Zapier/Make, WhatsApp Business API, SMTP).

---

## 2. Project structure

```
crm-project-main/
├── cdc_Workfow.pdf          # Original specifications (French)
├── PROJECT_GUIDE.md         # This document
├── backend/                 # Laravel 13 REST API (PHP 8.3+)
│   ├── app/
│   │   ├── Http/Controllers/   # Auth, Lead, Deal, Dashboard, Campaign,
│   │   │                       # Meeting, AI, Automation controllers
│   │   ├── Http/Middleware/    # JwtAuthenticate, RoleCheck
│   │   ├── Http/Resources/     # LeadResource, UserResource (API output shape)
│   │   ├── Models/             # User, Lead, Deal, Template, Campaign, Meeting,
│   │   │                       # AutomationRule, ActivityLog
│   │   ├── Repositories/       # LeadRepository (Interface + Eloquent impl)
│   │   ├── Services/           # LeadService (scoring + automations), JWTService
│   ├── database/
│   │   ├── migrations/         # 10 tables
│   │   ├── factories/          # Faker factories for tests/seeders
│   │   ├── seeders/            # Demo data (users, leads, deals, campaigns…)
│   │   └── database.sqlite     # SQLite database (already migrated + seeded)
│   ├── routes/api.php          # All API endpoints
│   ├── tests/                  # PHPUnit feature tests (8 tests)
│   └── .env                    # Environment config (APP_KEY generated)
└── frontend/                # React 19 + Vite 8 + Tailwind 4 SPA
    └── src/
        ├── api/client.js        # Axios instance (JWT injection, 401 redirect)
        ├── context/AuthContext.jsx  # Auth provider (login/register/logout)
        ├── components/          # Layout, Sidebar, Navbar, badges, charts, UI kit
        └── pages/               # Login, Register, Dashboard, Leads, Pipeline,
                                 # Campaigns, Calendar, Automations, Assistant
```

---

## 3. Architecture & how it works

### 3.1 Backend — Laravel REST API (`backend/`)

The backend is a stateless JSON API. Every protected route requires a `Bearer` JWT.

**Request flow:**

```
React SPA ──(axios /api/...)──▶ Vite dev proxy ──▶ Laravel (php artisan serve :8100)
                                                          │
                                    JwtAuthenticate middleware verifies the JWT
                                                          │
                                          Controller → Service → Repository → Model → SQLite
```

**Authentication (custom JWT, no external package):**
- `POST /api/register` and `POST /api/login` return `{ token, user }`.
- `app/Services/JWTService.php` creates/validates an **HS256 JWT** (header + payload + HMAC signature) with a 24-hour expiry.
- `app/Http/Middleware/JwtAuthenticate.php` parses the `Authorization: Bearer <token>` header, validates the signature/expiry, loads the user and authenticates it for the request.
- `app/Http/Middleware/RoleCheck.php` (`role` middleware) is available for role-based access (admin / manager / commercial / marketing).

**Repository pattern for leads:** `LeadRepositoryInterface` + `Eloquent\LeadRepository`
encapsulate all lead DB queries (filtering, search, pagination, growth stats), and
`LeadService` uses it — so data access can be swapped (e.g. to a different DB or an external API) without touching controllers.

**AI lead scoring (`LeadService::calculateLeadScore`):** every lead receives a 0–100 score automatically on create/update based on:
- Information completeness (+5 per field: email, phone, WhatsApp, website, industry)
- High-value job title (+20 if contains CEO / CTO / VP / Director / Founder / Owner / Manager / Head)
- Company size (+20 for 51-200, 201-500, 500+; +10 for 11-50)
- Hot lead source (+15 referral / google_ads; +10 organic / social_media)
- Priority (+20 high, +10 medium)
- Interaction history (+5 per activity, max +20)

**Automation engine (`LeadService::evaluateAutomations`):** when a lead is created,
its score changes, or its status changes, every **active** `AutomationRule` matching the
trigger event is evaluated. If its conditions pass (field + operator `equals` /
`greater_than` / `less_than` / `empty`), its action runs:
- `assign_user` → auto-assign the lead to a random `commercial` user
- `trigger_webhook` → POST the lead to an n8n / external URL
- `send_message` → prepared for WhatsApp/SMS integrations

**Activity logging:** every meaningful action (lead created, status changed, deal moved,
meeting created/cancelled, campaign sent, n8n webhook…) writes an `ActivityLog` row —
this powers the dashboard activity feed and the per-lead history timeline.

**Marketing campaigns:** `Template` (email/WhatsApp/SMS with `{{first_name}}`-style placeholders)
→ `Campaign` (name, template, schedule). Sending a campaign (`POST /campaigns/{id}/send`)
simulates delivery: it counts targetable leads, generates mock sent/delivered/opened/clicked
stats, marks the campaign `completed`, and logs per-lead activity.

**Meetings:** scheduling a meeting auto-generates a Google Meet or Zoom link, stores an
external event id, and logs the activity (which also feeds the lead score).

**AI endpoints:** `AIController` calls the OpenAI Chat Completions API when
`OPENAI_API_KEY` is set (default in `.env` is the mock key). Otherwise it returns
high-quality deterministic mock responses so the whole app works offline.

**n8n integration:** `POST /api/webhooks/n8n` (public) lets external tools push
events (WhatsApp reply, email open, form filled, …) that update the lead, add points
via activity logs, and are recorded in the activity feed.

### 3.2 Frontend — React SPA (`frontend/`)

- **`main.jsx`** mounts the app inside `<BrowserRouter>` + `<AuthProvider>`.
- **`App.jsx`** declares routes: `/login`, `/register` are public; everything else is nested
  inside `<PrivateRoute>` (redirects to `/login` without a token) and the app `<Layout>`
  (Sidebar + Navbar + page content).
- **`api/client.js`** central axios instance: attaches the stored JWT to every request
  and, on a 401 response, clears the session and redirects to `/login`.
- **`context/AuthContext.jsx`** holds the user + token and exposes `login/register/logout`;
  user data is persisted in `localStorage`.
- **`vite.config.js`** proxies `/api` → `http://127.0.0.1:8100` during development
  (no CORS issues, the browser only talks to the Vite server).

**Pages (all connected to real API endpoints):**

| Page | What it does | API used |
|---|---|---|
| **Login / Register** | Authenticate or create an account (role select) | `POST /login`, `/register` |
| **Dashboard** | 4 KPI cards (total/hot/cold leads, conversion rate, revenue), sales-by-stage bar chart, campaign engagement doughnut, leads-growth bar chart, live activity feed | `/dashboard/stats`, `/dashboard/charts`, `/dashboard/activities` |
| **Leads** | Search + filters (status/priority/source), paginated table, create/edit modal, detail modal (profile, deals, meetings, history, **AI qualify button**), CSV import/export, delete | `/leads` CRUD, `/leads/export`, `/leads/import`, `/ai/qualify-lead/{id}` |
| **Pipeline** | Kanban board with 7 stages, **drag & drop** between columns, stage totals, new-deal modal (lead + name + value) | `/deals`, `/deals/{id}/stage` |
| **Campaigns** | Two tabs: campaigns (create, **send now**, per-campaign sent/delivered/opened/clicked bars) and templates (create/edit/delete with placeholders) | `/campaigns`, `/campaigns/{id}/send`, `/templates` |
| **Calendar** | Month-grid calendar, per-day meeting list, schedule/cancel meetings, join links | `/meetings` |
| **Automations** | Rule cards (trigger/conditions/actions), create rule, **activate/pause toggle**, delete, n8n webhook usage banner | `/automations`, `/automations/{id}/toggle` |
| **AI Assistant** | 4 tabs: Sales Assistant chat (optional lead context), Email Writer (lead+tone+objective → subject/body with copy), Reply Suggester, Lead Qualifier | `/ai/assistant`, `/ai/generate-email`, `/ai/suggest-reply`, `/ai/qualify-lead/{id}` |

---

## 4. Database schema (10 tables)

`users` → `leads` (FK `assigned_to`) → `deals` (FK `lead_id`, stage), `meetings`
(FK `lead_id`, `user_id`), `activity_logs` (FK `lead_id`, `user_id`);
`templates` ← `campaigns` (FK `template_id`); `automation_rules`; plus Laravel
`cache`, `jobs`, `sessions` infrastructure tables.

Key enums: lead `status` = new/contacted/qualified/proposal/negotiation/won/lost;
deal `stage` = new_lead/contacted/meeting_scheduled/proposal_sent/negotiation/won/lost;
campaign `type` = email/whatsapp/sms; meeting `type` = google_meet/zoom/in_person.

**Deal stage ⇄ lead status sync:** moving a deal between stages automatically updates
the linked lead's status (e.g. `won` ⇒ lead `won`) and logs both a `deal_moved` and a
`status_updated` activity.

---

## 5. Installation & running

### Requirements
- **Backend:** PHP ≥ 8.3 (this machine: Windows PHP 8.4.2 at `/mnt/c/php-8.4.2/php.exe`),
  Composer 2.x, SQLite (already configured).
- **Frontend:** Node.js ≥ 20, npm.

> ⚠️ **WSL / Windows note (this environment):** the Linux side has no PHP and no sudo.
> The project's `vendor/`, `.env` and `database/database.sqlite` are already installed and
> synced into `backend/`, and a Windows-accessible working copy exists at `/mnt/c/crm-backend`
> (same code) so PHP/Composer can run from a real Windows path. A tiny wrapper was created at
> `~/bin/php` that calls the Windows PHP. **If you run the project on a normal machine, just
> install PHP/Composer normally and use `backend/` directly — everything below works as-is.**

### One-time setup (if starting from scratch)

```bash
# ---- Backend ----
cd backend
cp .env.example .env
php artisan key:generate          # generates APP_KEY in .env
php artisan migrate --seed        # creates tables + demo data (admin/manager/commercial/marketing)
# (already done in this repo: database.sqlite is seeded)

# ---- Frontend ----
cd ../frontend
npm install                       # already done
```

### Running the app (two terminals)

```bash
# Terminal 1 — backend API (listens on http://127.0.0.1:8100)
cd /mnt/c/crm-backend             # in this WSL env; on a normal machine: cd backend
php artisan serve --host=127.0.0.1 --port=8100

# Terminal 2 — frontend (http://localhost:5173)
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser. The Vite dev server proxies `/api` to the
Laravel API on :8100. (Both servers are also currently running in the background.)

### Demo accounts (seeded by `DatabaseSeeder`)

| Role       | Email                  | Password     |
|------------|------------------------|--------------|
| Admin      | admin@crm.com          | password123  |
| Manager    | manager@crm.com        | password123  |
| Commercial | commercial@crm.com     | password123  |
| Marketing  | marketing@crm.com      | password123  |

The seeder also creates ~45 leads (scored), ~18 deals across all stages, 8 templates,
6 campaigns, 12 meetings, and 3 automation rules so every screen has data to show.

### Enabling real AI (optional)

In `backend/.env` set a real key:

```
OPENAI_API_KEY=sk-...
```

`AIController` will then call `gpt-4o-mini`. Without a real key it uses the built-in mock
responses, so the app is fully functional offline.

---

## 6. How to test

### 6.1 Backend — automated tests (PHPUnit)

```bash
cd /mnt/c/crm-backend      # or: cd backend on a normal machine
php artisan test
```

Expected result: **8 passed (35 assertions)** across:

- `CRMTest::test_user_can_register_and_login` — register (201) + login return tokens
- `test_protected_routes_require_authentication` — no token ⇒ 401; with token ⇒ 200
- `test_lead_crud_and_scoring` — create (auto score > 50 for a CEO at a 500+ company), read, update, delete
- `test_deal_stage_syncs_with_lead_status` — moving a deal to `proposal_sent` sets lead status `negotiation` and logs `deal_moved`
- `test_meeting_link_generation` — Google Meet meetings get a `meet.google.com` link
- `test_ai_helper_endpoints` — email generator returns subject/body; assistant returns a reply

Tests use an in-memory SQLite DB (`phpunit.xml`), so they never touch real data.

### 6.2 Frontend — lint & production build

```bash
cd frontend
npm run lint        # ESLint (clean: 0 errors)
npm run build       # Vite production build (dist/) — succeeds
```

### 6.3 End-to-end smoke test (already run & passing)

With both servers up, a full API journey through the Vite proxy was executed successfully:

```
1.  POST /api/login                        → JWT
2.  GET  /api/dashboard/stats              → KPIs
3.  POST /api/leads                        → lead created + auto-scored
4.  PUT  /api/leads/{id}                   → status updated
5.  POST /api/deals                        → deal created
6.  PUT  /api/deals/{id}/stage             → moved to won (lead status synced)
7.  POST /api/meetings                     → meeting with Google Meet link
8.  POST /api/campaigns                    → campaign created
9.  POST /api/campaigns/{id}/send          → mock delivery stats, completed
10. POST /api/automations                  → rule created
11. POST /api/automations/{id}/toggle      → activated
12. POST /api/ai/generate-email            → subject + body
13. GET  /api/leads/export                 → CSV (HTTP 200)
14. DELETE lead / meeting / campaign / rule → cleanup OK
```

### 6.4 Manual test checklist (in the browser at http://localhost:5173)

1. **Auth** — log in as `admin@crm.com` / `password123`; logout; register a new user and log back in.
2. **Dashboard** — cards show seeded numbers; charts render; activity feed lists events.
3. **Leads** — search "CEO"; filter by status `won`; open a lead detail and click **Analyze** (AI qualification); edit a lead and watch the score change; export CSV; import the exported CSV back.
4. **Pipeline** — drag a deal from *New Lead* to *Won* and verify the lead's status badge updates on the Leads page.
5. **Campaigns** — create a template, create a campaign from it, press **Send** and watch stats appear.
6. **Calendar** — schedule a meeting; the generated Google Meet link appears; cancel it.
7. **Automations** — create a rule "score > 80 → trigger webhook", toggle it off/on; POST an n8n-style payload to `/api/webhooks/n8n`.
8. **AI Assistant** — chat with context, generate an email, get reply suggestions, qualify a lead (works with mock AI offline).

---

## 7. Key API reference (summary)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/register` · `/api/login` · `/api/logout` | Auth (JWT) |
| GET | `/api/me` · `/api/users` | Profile · user list |
| GET/POST | `/api/leads` | List (search/filter/paginate) · create |
| GET/PUT/DELETE | `/api/leads/{id}` | Show / update / delete |
| GET/POST | `/api/leads/export` · `/api/leads/import` | CSV export / import |
| GET/POST | `/api/deals` | List · create |
| PUT | `/api/deals/{id}/stage` | Move stage (syncs lead status) |
| GET/POST/PUT/DELETE | `/api/templates` (+ `/{id}`) | Template CRUD |
| GET/POST/DELETE | `/api/campaigns` (+ `/{id}`) | Campaign CRUD |
| POST | `/api/campaigns/{id}/send` | Send campaign (mock stats) |
| GET/POST/PUT/DELETE | `/api/meetings` (+ `/{id}`) | Meeting CRUD |
| POST | `/api/ai/assistant` · `/generate-email` · `/suggest-reply` · `/qualify-lead/{id}` | AI helpers |
| GET/POST/DELETE | `/api/automations` (+ `/{id}`) | Automation rules CRUD |
| POST | `/api/automations/{id}/toggle` | Activate/pause rule |
| POST | `/api/webhooks/n8n` | Public n8n webhook (no auth) |
| GET | `/api/dashboard/stats` · `/charts` · `/activities` | Dashboard data |
| GET | `/api/health` | Health check |

All endpoints (except register/login/webhooks/health) require `Authorization: Bearer <jwt>`.

---

## 8. What was completed in this session

**Backend (fixed + verified):**
- Fixed a PHP parse error in `CampaignController::sendCampaign` (missing `}` in the `each()` closure) that broke all template/campaign endpoints.
- Fixed register endpoint returning status 210 instead of the standard 201 (controller + test updated).
- Added `GET /api/users` (AuthController) for the assignment dropdown.
- Installed dependencies, generated `.env` + app key, migrated and seeded the SQLite DB.
- Ran the full PHPUnit suite: **8 tests / 35 assertions — all green.**

**Frontend (built from scratch — previously only a placeholder):**
- Added the Vite `/api` dev proxy.
- Created the axios client with JWT handling, auth context, layout, shared UI kit, badges and chart components.
- Built 9 pages: Login, Register, Dashboard (charts + KPIs + activity feed), Leads (CRUD, filters, import/export, detail + AI qualify), Pipeline (drag & drop kanban), Campaigns (+ templates), Calendar (month grid), Automations (rules + n8n banner), AI Assistant (chat/email/replies/qualify).
- `npm run lint` clean; `npm run build` succeeds.

**Testing:** backend PHPUnit ✓ · frontend lint + build ✓ · 15-step end-to-end API journey through the proxy ✓
