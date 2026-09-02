# OpsDesk (Mini ERP + CRM Operations Portal)

OpsDesk is a lightweight, internal ERP/CRM portal that lets Sales, Warehouse, and Accounts teams manage customers, products, stock, and sales challans from one centralized system. 

It implements strict role-based access control and reliable, auditable business logic (e.g., transactional stock deduction).

## Why OpsDesk?

OpsDesk tackles the business problem of siloed data between departments by centralizing customer management, CRM follow-ups, product/inventory operations, and sales challans. Designed for a wholesale/distribution workflow, it enforces role-based constraints across Sales, Warehouse, Accounts, and Admin teams while demonstrating robust full-stack engineering through transactional integrity, real-time metrics, and strict API authorization.

## Live Demo

- **Frontend UI**: `TBD`
- **Backend API**: `TBD`

## Recommended Demo Flow

The fastest way to experience the full operational lifecycle:
1. **Login as Admin** (`admin@example.com`) to explore the redesigned Reports analytics dashboard.
2. **Login as Sales** (`sales@example.com`).
3. Navigate to **Customers** and create a new customer lead.
4. Navigate to **Sales Challans** and create a new challan for that customer, adding multiple line items.
5. Save the challan as **Draft** and observe the pipeline state.
6. **Confirm** the challan, and observe the immediate stock deduction.
7. Click **Export PDF** on the confirmed challan detail page to generate the branded PDF.
8. **Login as Warehouse** (`warehouse@example.com`) and navigate to the **Products & Inventory** module to view the documented "Net" stock movement history log reflecting the deduction.

## Key Engineering Highlights

- **Backend-Enforced RBAC**: Authorization middleware strictly locks down routing; frontend visibility is backed by genuine API-level enforcement.
- **Strict Zod Validation**: End-to-end type safety and payload validation ensure malformed data is rejected before hitting the database.
- **PostgreSQL Relational Model via Prisma**: Strongly typed ORM mapping with foreign keys, constraints, and cascading rules.
- **Transactional Integrity**: Critical operations, like concurrent inventory stock deductions, utilize atomic database operations to prevent race conditions.
- **Product Snapshot Preservation**: Sales challans store immutable snapshots of product pricing and data to maintain historical accuracy even if the underlying product changes.
- **Animated Data Visualization**: The frontend leverages `framer-motion` and custom SVGs to render responsive, mathematically proportioned charts and overlapping cluster graphs.
- **PDF Generation**: Server-side document rendering utilizing `pdfkit` for immediate browser streaming.
- **GitHub Actions CI**: Automated linting and building workflows trigger on every push/PR to maintain codebase quality.

## Role-Based Access

| Capability | Admin | Sales | Warehouse | Accounts |
|:---|:---:|:---:|:---:|:---:|
| User Management | ✓ | — | — | — |
| View Customers | ✓ | ✓ | — | ✓ |
| Manage Customers/Follow-ups | ✓ | ✓ | — | — |
| View Products & Inventory | ✓ | ✓ | ✓ | ✓ |
| Adjust Inventory / View Logs | ✓ | — | ✓ | — |
| Create Sales Challans | ✓ | ✓ | — | — |
| View Sales Challans | ✓ | ✓ | ✓ | ✓ |
| Access Reports Dashboard | ✓ | — | — | ✓ |
| Export Challan PDF | ✓ | ✓ | ✓ | ✓ |

## Architecture Summary
- **Frontend**: React + TypeScript, Tailwind CSS, TanStack Query, React Hook Form + Zod for client-side validation.
- **Backend**: Node.js + TypeScript, Express.js, Prisma ORM, Zod for strict server-side validation.
- **Database**: PostgreSQL (hosted on Neon).
- **Authentication**: JWT based authentication with short-expiry tokens.

### System Architecture Diagram
```text
Browser Client (React)
          ↓
  TanStack Query (Caching/Sync)
          ↓
  Vite / Nginx (Static Serving)
          ↓
=================================
          ↓
  Express REST API Layer
          ↓
  Authentication Middleware (JWT)
          ↓
  RBAC + Zod Validation Middleware
          ↓
  Business Logic (Controllers)
          ↓
  Prisma ORM (Data Access)
          ↓
=================================
          ↓
  PostgreSQL Database (Neon)
```

## Local Setup Steps

### 1. Database & Backend Setup
1. Open a terminal in the `backend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Run Prisma migrations to set up the PostgreSQL database:
   ```bash
   npx prisma migrate dev --name init_postgres
   ```
5. Seed the database with the test users, customers, products, and challans:
   ```bash
   npm run db:seed
   ```
   *(Note: You can also use `npx prisma db seed`)*
6. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend will start on `http://localhost:3001`.

### 2. Frontend Setup
1. Open a terminal in the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser to `http://localhost:5175`.

---

## Test Login Credentials (seeded automatically)

| Role      | Email | Password |
| ----------- | ----------- | ----------- |
| **Admin** | admin@example.com | admin123 |
| **Sales** | sales@example.com | sales123 |
| **Warehouse** | warehouse@example.com | warehouse123 |
| **Accounts** | accounts@example.com | accounts123 |

*(Note: These credentials are auto-filled via buttons on the development login screen for easy testing).*

---

## Deployment Guide

1. **Frontend**: Deploy to Vercel or Netlify, or via Docker. 
   - **CRITICAL REQUIREMENT**: You MUST set the `VITE_API_URL` environment variable to your deployed backend URL (e.g., `https://opsdesk-backend.onrender.com`) at **BUILD TIME**.
   - **Why?**: Vite inlines environment variables starting with `VITE_` directly into the compiled JavaScript bundle during the build step. Setting it at runtime on the deployed server does nothing because the value (like `localhost`) is already permanently frozen into the files.
   - If using Docker, ensure `VITE_API_URL` is passed via build args (as set up in `docker-compose.yml`). If using Vercel/Netlify, add it to their Environment Variables settings *before* triggering a build.
2. **Backend**: Deploy to Render or Railway. 
   - Ensure the following Environment Variables are configured in your hosting dashboard:
     - `PORT`: (e.g., 3001)
     - `DATABASE_URL`: Your exact Neon PostgreSQL connection string (the same one in your `.env`).
     - `JWT_SECRET`: A secure random string for signing JWTs.
     - `CORS_ORIGIN`: Your deployed Vercel frontend URL (e.g., `https://opsdesk.vercel.app`).
   - Add a deployment build script: `npm run build` (`tsc`).

---

## Bonus Features

### 1. Export Challan as PDF ✨ (Fully Working)

A professional PDF export is available directly from any Challan Detail page.

- Click the **Export PDF** button in the bottom action bar on any challan.
- The backend generates a structured PDF (OpsDesk-branded header, customer details, line-item table with **snapshot** data, grand total, footer) via the `pdfkit` library and streams it directly to the browser as a download.
- Uses the endpoint `GET /api/challans/:id/pdf` — fully authenticated and role-protected.
- PDF filenames follow the challan number format: `CH-2026-000001.pdf`.

### 2. Docker Setup ✨ (Fully Working — tested locally)

The entire stack can be run with a single command using Docker Compose.

**Prerequisites**: Docker and Docker Compose installed.

**First-time setup:**
```bash
# 1. Ensure backend/.env has your secrets (see backend/.env.example)
#    For Docker, DATABASE_URL will be overridden automatically.

# 2. Build and start all three services (postgres + backend + frontend)
docker compose up --build

# 3. In a separate terminal, run migrations (one-time):
docker compose exec backend npx prisma migrate deploy

# 4. Optionally seed test data:
docker compose exec backend npx prisma db seed
```

**Services & ports:**
| Service  | Local Port | Notes |
|----------|-----------|-------|
| postgres | 5432 | Data persisted in `pgdata` Docker volume |
| backend  | 4000 | Express API (`http://localhost:4000/api`) |
| frontend | 5175 | nginx-served React app |

**Subsequent starts** (data preserved in the named volume):
```bash
docker compose up          # start
docker compose down        # stop (data preserved)
docker compose down -v     # DANGER: also destroys database volume
```

### 3. GitHub Actions CI/CD ✨ (CI passing — deploy workflow implemented)

Two workflow files are in `.github/workflows/`:

**`ci.yml` — Lint & Build** (runs on every push/PR to `main`)
- **Backend job**: `npm ci` → Prisma generate → `tsc --noEmit` → `npm run build`
- **Frontend job**: `npm ci` → `npm run lint` → `tsc --noEmit` → `npm run build`

This CI is fully functional and passes on push to the repository.

**`deploy.yml` — Deploy to Render** (triggers after CI passes on `main`)
- Fires Render's deploy hook URL via `curl POST`.
- **Requires the following GitHub repo secret to activate:**
  - Go to: **Settings → Secrets and variables → Actions → New repository secret**
  - Name: `RENDER_DEPLOY_HOOK_URL`
  - Value: Your Render service's deploy hook URL (from the Render dashboard → Settings → Deploy Hook)

> **Note**: The deploy workflow is implemented and correct, but has not been triggered against a live Render service (no live deployment is configured). If the Render deploy hook URL secret is added, deploys will trigger automatically after CI passes.

**Frontend deployment via Vercel/Netlify**: Connect the GitHub repo directly via their Git integration — no custom Action is needed. Set `VITE_API_URL` to your live Render backend URL in the Vercel project environment variables.

---

## Known Limitations & Assumptions

- **Database**: The system runs on a production-grade PostgreSQL database hosted on Neon, fulfilling the assignment specification.
- **Concurrency Control**: With the migration to PostgreSQL, explicit `SELECT ... FOR UPDATE` locks or optimistic concurrency control should be implemented in `challans.ts` as a future enhancement to guarantee safety during simultaneous stock deductions.
- **Reporting Exports**: PDF export is now implemented for Sales Challans. CSV/aggregate exports for the Reports page are a planned future improvement.
- **Auth**: JWTs are issued with short expiries for security. A refresh token rotation flow is recommended before wide production release.
- **Users & Roles**: Admin users can manage system access via the Users & Roles module.
- **Reports**: Admins and Accounts users have access to aggregated business reports.

## Security

This project implements strict, defense-in-depth security measures appropriate for a production-grade internal portal, prioritizing data integrity and access control.

### Authentication & Access Control
- **Password Hashing:** All user passwords are computationally hashed using `bcrypt` (10–12 salt rounds) before storage; raw passwords are never saved.
- **Stateless JWTs:** Authentication is managed via JSON Web Tokens. Tokens are cryptographically verified server-side on every protected API request via middleware, ensuring client-side manipulation is impossible.
- **Role-Based Access Control (RBAC):** Authorization is enforced at the API routing layer using a strict `authorize(['ROLE'])` middleware, ensuring users cannot access endpoints outside their granted permissions.
- **Login Hardening:** The login endpoint is protected by a strict rate limiter (max requests per 15-minute window) to prevent brute-force attacks. Failed attempts return a generic "Invalid email or password" to prevent user enumeration.

### Data Protection & API Hardening
- **Strict Input Validation:** Every write/update endpoint validates payloads through strict `Zod` schemas before touching the database, guaranteeing type safety and malformed data rejection.
- **SQL Injection Prevention:** All database operations utilize the Prisma ORM. No raw, unparameterized SQL queries (`$queryRaw`) are used in the codebase.
- **Concurrent Data Integrity:** Critical business logic, such as inventory stock deduction, utilizes atomic database operations (`decrement`/`increment`) within transactions rather than application-level math, preventing "Lost Update" race conditions under concurrent load.
- **CORS Restriction:** Cross-Origin Resource Sharing is strictly locked down to the exact frontend domain specified in the `CORS_ORIGIN` production environment variable.
- **Safe Error Handling:** Production error boundaries prevent internal stack traces or database errors from leaking to the client; API responses return sanitized, generic error strings on 500s.
- **Data Minimization:** API responses are explicitly shaped (e.g., via Prisma `select`) to ensure sensitive fields, such as `passwordHash`, are never returned to the frontend.
- **Secrets Management:** Environment variables (`.env`) are strictly gitignored, and the backend guarantees a fatal crash on startup if required secrets (`JWT_SECRET`, `CORS_ORIGIN`) are missing, preventing insecure default states.

### Known Tradeoffs
Given the 48-hour project timeline, the following deliberate scoping decisions were made:
- **JWT Storage:** Tokens are currently stored in `localStorage` on the frontend for implementation speed. For a full production release, migrating to secure `httpOnly` cookies is recommended to mitigate XSS token theft.
- **Global Rate Limiting:** Rate limiting is currently targeted specifically at the authentication routes to prevent brute-forcing. It is not applied globally to all API routes to avoid complicating local development and testing.
- **Token Rotation:** The system relies on short-lived JWTs. A full refresh-token rotation architecture was out of scope for this MVP.
## Included Assets
- **Postman Collection**: `opsdesk_postman_collection.json` is included in the project root for testing APIs.
- **Concurrency Test**: `backend/test-concurrency.js` is included to verify transaction locking behavior.
