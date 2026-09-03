# OpsDesk (Mini ERP + CRM Operations Portal)

OpsDesk is a lightweight, internal ERP/CRM portal that lets Sales, Warehouse, and Accounts teams manage customers, products, stock, and sales challans from one centralized system. 

It implements strict role-based access control and reliable, auditable business logic (e.g., transactional stock deduction).

## Why OpsDesk?

OpsDesk tackles the business problem of siloed data between departments by centralizing customer management, CRM follow-ups, product/inventory operations, and sales challans. Designed for a wholesale/distribution workflow, it enforces role-based constraints across Sales, Warehouse, Accounts, and Admin teams while demonstrating robust full-stack engineering through transactional integrity, real-time metrics, and strict API authorization.

### Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `admin123` |
| Sales | `sales@example.com` | `sales123` |
| Warehouse | `warehouse@example.com` | `warehouse123` |
| Accounts | `accounts@example.com` | `accounts123` |

## 🚀 Live Demo

**Frontend:** https://opsdesk-delta.vercel.app/  
**Backend API:** https://opsdesk-backend.onrender.com  
**API Base:** https://opsdesk-backend.onrender.com/api

![OpsDesk Dashboard](assets/Dashboard%20Page.png)

##  Key Features

-  **JWT Authentication + RBAC** — Admin, Sales, Warehouse and Accounts
-  **CRM** — customer management, search, filtering and follow-ups
-  **Inventory** — stock IN/OUT, alerts and movement history
-  **Sales Challans** — Draft → Confirm → Cancel workflow
-  **Reports & Dashboard** — sales, customers, inventory and follow-up metrics
-  **PDF Export** — branded challan generation
-  **Validation** — strict Zod request validation and API error handling
-  **Docker** — multi-stage backend container
-  **Postman** — complete API collection with RBAC and validation scenarios

##  Architecture

```text
                         ┌──────────────────────┐
                         │        GitHub        │
                         │   OpsDesk-ERP Repo   │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┴────────────────┐
                    │                                │
                    ▼                                ▼
          ┌──────────────────┐             ┌─────────────────────┐
          │ Vercel           │             │ Render              │
          │ React + Vite     │   HTTPS     │ Node + Express      │
          │ Frontend         │ ──────────► │ TypeScript API      │
          └──────────────────┘             │                     │
                                           │ JWT Authentication  │
                                           │ RBAC Authorization  │
                                           │ Zod Validation      │
                                           │ Business Logic      │
                                           │ Prisma ORM          │
                                           └──────────┬──────────┘
                                                      │
                                                      ▼
                                           ┌─────────────────────┐
                                           │ Neon PostgreSQL     │
                                           │ Relational Database │
                                           └─────────────────────┘
```

## Architecture Summary
- **Frontend**: React + TypeScript, Tailwind CSS, TanStack Query, React Hook Form + Zod for client-side validation.
- **Backend**: Node.js + TypeScript, Express.js, Prisma ORM, Zod for strict server-side validation.
- **Database**: PostgreSQL (hosted on Neon).
- **Authentication**: JWT based authentication with short-expiry tokens.

## Repository Structure:

```text

OpsDesk-ERP/
├── frontend/                    # React + TypeScript + Vite
│   └── src/
│
├── backend/                     # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── types/
│   │   ├── db.ts
│   │   └── index.ts
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   │
│   ├── .env.example
│   ├── .dockerignore
│   └── Dockerfile
│
├── docker-compose.yml
├── opsdesk_postman_collection.json
└── README.md
```

##Core Business Workflow
```
Create Draft Challan
        ↓
      Confirm
        ↓
  Validate Stock
        ↓
 Transactional /
 Atomic Stock Update
        ↓
 Create Stock Movement
        ↓
    CONFIRMED
        ↓
 Optional Cancellation
        ↓
  Optional Restock
```
## Important business rules include:
-  Draft challans do not perform final stock deduction.
-  Confirmation validates available inventory.
-  Stock cannot be reduced below the available quantity.
-  Confirmed transactions create stock movement records.
-  Challan cancellation can optionally restore stock.
-  Product snapshot data is preserved for historical accuracy.

## ⭐ Key Engineering Highlights

- **Backend-Enforced RBAC** — role authorization is enforced through API middleware rather than relying only on frontend visibility.
- **Strict API Validation** — request payloads are validated with Zod before reaching business logic/database operations.
- **Transactional Inventory Operations** — critical stock-changing workflows use database transactions and atomic stock updates.
- **Product Snapshot Preservation** — challan items retain historical product information so previously issued documents remain stable when catalog data changes.
- **Auditable Inventory** — stock changes create corresponding movement records with quantity, type, reason, user, and timestamps.
- **PDF Generation** — server-side challan PDF generation using PDFKit.
- **Production Deployment** — React frontend on Vercel, Dockerized Node/Express backend on Render, PostgreSQL on Neon.

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


## Project Status

| Area | Status |
|---|---|
| Frontend | ✅ Live on Vercel |
| Backend | ✅ Live on Render |
| PostgreSQL | ✅ Live on Neon |
| Authentication | ✅ Verified |
| RBAC | ✅ Implemented |
| Customer CRM | ✅ Implemented |
| Inventory | ✅ Verified |
| Challan Workflow | ✅ Verified |
| Stock Audit Trail | ✅ Verified |
| PDF Export | ✅ Implemented |
| Postman Collection | ✅ Included |

---

## Security
-  JWT Authentication with server-side token verification.
-  Backend RBAC using role authorization middleware.
-  bcrypt Password Hashing for stored credentials.
-  Zod Validation for API write/update payloads.
-  Helmet for HTTP security headers.
-  Authentication Rate Limiting to reduce brute-force attempts.
-  Restricted CORS using the configured frontend origin.
-  Sanitized Error Responses to avoid exposing internal details.
-  Sensitive Field Protection so password hashes are not returned through normal API responses.
-  Environment-based Secrets instead of committed credentials.

## Security Trade-offs
   This is an assignment/MVP, so some hardening areas remain intentionally scoped:

- JWTs are currently stored in ```text localStorage ```; secure ```httpOnly``` cookies would be preferable for a hardened production setup.
- Refresh-token rotation is not implemented.
- Higher-concurrency inventory workloads may benefit from stronger row-level concurrency controls.
- The setup-only admin seed endpoint should be disabled/removed for hardened production use.

## API & Testing
A complete Postman collection is included:

```bash
opsdesk_postman_collection.json
```
## It covers:
- Authentication
- Customers / CRM
- Products / Inventory
- Sales Challans
- Dashboard / Reports
- Reminders / Notifications
- Users / Roles
- Validation scenarios
- RBAC scenarios
- Challan PDF export

![OpsDesk Postman API Testing](assets/Postman%20API%20Documentation.png)

## Production API:

```bash 
https://opsdesk-backend.onrender.com/api 
```
The collection has been cross-checked against the backend routes and validation schemas, with selected requests manually verified against the deployed API.

## 📄 Challan PDF Export

Confirmed challans can be exported as professionally formatted PDFs.

## The generated document includes:

- OpsDesk branding
- Challan number
- Customer details
- Product line items
- Snapshot product information
- Quantities
- Unit prices
- Totals
- Footer / document metadata

Endpoint:

```text
GET /api/challans/:id/pdf
```

---

# 🚀 Production Deployment

| Layer | Platform |
|---|---|
| Frontend | **Vercel** |
| Backend | **Render + Docker** |
| Database | **Neon PostgreSQL** |

### Frontend

Production frontend:

```text
https://opsdesk-delta.vercel.app/
```

Vercel configuration:

```text
Framework: Vite
Root Directory: frontend
```

Build-time variable:

```env
VITE_API_URL=https://opsdesk-backend.onrender.com/api
```

### Backend

Production backend:

```text
https://opsdesk-backend.onrender.com
```

Render configuration:

```text
Root Directory: backend
Docker Build Context: backend/
Dockerfile: Dockerfile
```

Backend environment variables:

```text
DATABASE_URL=<configured in Render>
JWT_SECRET=<configured in Render>
CORS_ORIGIN=https://opsdesk-delta.vercel.app
```

The application reads the runtime `PORT` provided by the hosting platform and falls back to `3001` for local development.

---

## 🐳 Docker

A multi-stage Docker setup is included for reproducible local deployment.

The backend container:

- Builds TypeScript in a dedicated builder stage.
- Generates the Prisma Client during the build.
- Uses production dependencies in the runtime stage.
- Includes the Prisma CLI required for production migrations.
- Runs as the non-root `node` user.
- Applies Prisma migrations before starting the backend.

### Full local stack

```bash
docker compose up --build
```

Apply migrations:

```bash
docker compose exec backend npx prisma migrate deploy
```

Seed data:

```bash
docker compose exec backend npx prisma db seed
```

> Local Docker execution requires Docker Desktop/WSL or another Docker-enabled environment.

---

## 💻 Local Development

### Backend

```bash
cd backend
npm install
```

Create `.env` from `.env.example`.

Then:

```bash
npx prisma migrate dev
npm run db:seed
npm run dev
```

Backend:

```text
http://localhost:3001
```

API:

```text
http://localhost:3001/api
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5175
```

---



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

##  Docker Setup  (Tested locally)

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
## Future Enhancements

Future iterations could introduce advanced analytics, automated notifications, accounting and payment integrations, barcode-based inventory management, audit logging, bulk data operations, and more granular reporting and access controls.

The current system provides a scalable foundation for extending these capabilities as business requirements evolve.

