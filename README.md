# Recover Pay
Recover Pay is a managed subscription and recurring billing engine "Stripe billing for Nigerian businesses" built on Nomba


# RecoverPay (DevCareer x Nomba Hackathon 2026 Submission)

> Managed subscriptions engine with intelligent payment recovery for Nigerian businesses — built on Nomba.

## The Problem
Nigerian businesses face high churn rates on subscription-based products due to failed recurring card payments (e.g. insufficient funds, network errors, expired cards). Standard payment gateways often just fail the transaction, leaving businesses to chase customers manually.

## Our Solution
**RecoverPay** is a multi-tenant billing layer built on top of Nomba's APIs that solves this through:
1. **Intelligent Dunning:** Automatically retries failed card charges using a smart schedule (24h, 72h).
2. **Virtual Account Fallback:** If all card retries fail, it automatically generates a Nomba Virtual Account and notifies the customer (via WhatsApp/SMS/Email) to transfer the funds, keeping the subscription active.
3. **Automated Lifecycle:** Handles upgrades, downgrades, pausing, and cancellations seamlessly without manual intervention.

## Tech Stack
- **Backend:** Node.js, Express, TypeScript
- **Database & ORM:** Neon Serverless PostgreSQL, Prisma
- **Background Jobs:** BullMQ, Upstash Redis
- **Payment Infrastructure:** Nomba APIs (Checkout, Tokenization, Virtual Accounts)

---
## What It Does

RecoverPay is a multi-tenant billing layer that sits on top of Nomba's payment APIs. Businesses integrate once and get:

- **Plan management** — create monthly, annual, or custom pricing plans
- **Subscription lifecycle** — full state machine (created → trialing → active → past_due → paused → cancelled)
- **Automatic billing** — charges customers on their billing cycle without any manual action
- **Smart dunning** — when a card charge fails, retries intelligently over 7 days
- **Virtual account fallback** — if card retries are exhausted, generates a Nomba virtual account and notifies the customer to pay via bank transfer (WhatsApp/SMS/email)
- **Webhook events** — fires events to downstream systems on every state change
- **Customer self-service portal** — cancel, pause, resume, view invoices

---

## Project Structure

```
recoverpay/
├── prisma/
│   ├── schema.prisma       ← Database schema (Neon PostgreSQL)
│   └── seed.ts             ← Creates a demo tenant for testing
├── src/
│   ├── nomba/
│   │   └── nombaClient.ts  ← All Nomba API calls isolated here
│   ├── middleware/
│   │   └── auth.ts         ← Tenant API key verification
│   ├── services/
│   │   ├── billingService.ts     ← Charges a subscription cycle
│   │   ├── checkoutService.ts    ← Finalizes first payment + saves card token
│   │   └── notificationService.ts ← WhatsApp/SMS/email stubs
│   ├── workers/
│   │   ├── billingWorker.ts      ← BullMQ dunning retry jobs
│   │   └── billingScheduler.ts   ← Hourly scheduler for due subscriptions
│   ├── routes/
│   │   ├── plans.ts         ← Plan CRUD
│   │   ├── checkout.ts      ← First payment + card tokenization
│   │   ├── subscriptions.ts ← Subscription management
│   │   ├── portal.ts        ← Customer self-service
│   │   └── webhooks.ts      ← Nomba webhook receiver
│   ├── utils/
│   │   └── dates.ts         ← Shared interval helpers
│   ├── prisma/
│   │   └── client.ts        ← Prisma singleton
│   ├── redis.ts             ← Shared ioredis connection for BullMQ
│   ├── swagger.ts           ← OpenAPI docs
│   ├── app.ts               ← Express app setup
│   └── index.ts             ← Entry point
└── webhook-stub/            ← Separate deploy for Nomba URL submission
    └── server.js
```

---

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in your values in `.env` (see comments in the file for guidance).

### 3. Set up Neon database

1. Go to [neon.tech](https://neon.tech) and create a free project
2. Copy the **Pooled connection string** → `DATABASE_URL` in `.env`
3. Copy the **Direct connection string** → `DIRECT_URL` in `.env`

### 4. Set up Upstash Redis

1. Go to [upstash.com](https://upstash.com) and create a free Redis database
2. Copy the **Redis connection string** (starts with `rediss://`) → `REDIS_URL` in `.env`

### 5. Run database migrations

```bash
npm run migrate
```

Name the migration `init` when prompted.

### 6. Seed the database (creates a demo tenant)

```bash
npm run db:seed
```

This outputs your demo API key — save it for testing.

Use this in your API requests ---
Header: Authorization: Bearer rp_test_demo_key_123456

### 7. Start the dev server

```bash
npm run dev
```

Server runs on `http://localhost:3000`.
API docs available at `http://localhost:3000/docs`.

---

## Deployment (Render)

### Main App

1. Push the `recoverpay/` folder to a GitHub repo
2. On [render.com](https://render.com) → New → Web Service → connect your repo
3. Build command: `npm install && npm run migrate:deploy`
4. Start command: `npm start`
5. Add all environment variables from `.env.example` in Render's Environment tab
6. Deploy

### Webhook Stub (separate service)

The webhook stub is a lightweight Express server that receives Nomba payment events.
Deploy it separately so you have a stable URL to submit to Nomba.

```bash
cd webhook-stub
npm install
```

1. Push `webhook-stub/` to its own GitHub repo (or a subfolder)
2. On Render → New → Web Service → connect it
3. Build command: `npm install`
4. Start command: `npm start`
5. Add `NOMBA_WEBHOOK_SECRET=NombaHackathon2026` in Render's environment tab
6. Deploy

Your webhook URL to submit to Nomba:
```
https://<your-stub-domain>.onrender.com/webhooks/nomba
```

---

## Testing the Full Flow

Use these credentials in the Nomba sandbox:

| Card | Outcome | What To Do After |
|---|---|---|
| `5434621074252808` | ✅ Success (needs OTP) | Enter OTP `9999` |
| `4000000000002503` | 3DS required | Follow 3DS flow |
| `5484497218317651` | ❌ Declined | Nothing — payment failed |

**PIN:** `1234` (required before OTP)
**OTP:** `9999` = approved, `1234` = timeout, `5464` = invalid

**Success flow:**
- Enter card: `5434621074252808`
- Enter PIN:  `1234`
- Enter OTP:  `9999`
→ Payment succeeds

- **Test bank transfer:** Wema Bank, account `0000000000`

### Step 1 — Create a plan

```bash
curl -X POST http://localhost:3000/v1/plans \
  -H "Authorization: Bearer rp_test_demo_key_123456" \
  -H "Content-Type: application/json" \
  -d '{"name": "Pro Monthly", "amount": 5000, "interval": "monthly"}'
```

### Step 2 — Start a checkout

```bash
curl -X POST http://localhost:3000/v1/checkout/start \
  -H "Authorization: Bearer rp_test_demo_key_123456" \
  -H "Content-Type: application/json" \
  -d '{"customerEmail": "test@example.com", "planId": "<plan_id_from_step_1>"}'
```

Open the `checkoutUrl` in your browser. Pay with the test card.

### Step 3 — Trigger a billing cycle (instead of waiting for the scheduler)

```bash
curl -X POST http://localhost:3000/v1/subscriptions/<sub_id>/charge \
  -H "Authorization: Bearer rp_test_demo_key_123456"
```

### Step 4 — Simulate a failed charge + dunning

Switch to the declined test card (`5484497218317651`) in your Nomba sandbox settings, then trigger the charge again. The system will:
1. Fail the charge
2. Schedule dunning retries (24h, 72h)
3. On attempt 3: create a virtual account and send a notification

---

## API Reference

Full docs at `/docs` when the server is running.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/v1/plans` | Create a plan |
| `GET` | `/v1/plans` | List plans |
| `GET` | `/v1/plans/:id` | Get a plan |
| `PATCH` | `/v1/plans/:id` | Update a plan |
| `DELETE` | `/v1/plans/:id` | Archive a plan |
| `POST` | `/v1/checkout/start` | Start a subscription checkout |
| `GET` | `/v1/checkout/complete` | Payment return URL (Nomba redirects here) |
| `GET` | `/v1/subscriptions` | List subscriptions |
| `GET` | `/v1/subscriptions/:id` | Get a subscription |
| `POST` | `/v1/subscriptions/:id/charge` | Manual billing trigger |
| `GET` | `/v1/portal/:customerId` | Customer overview |
| `GET` | `/v1/portal/:customerId/invoices` | Invoice history |
| `POST` | `/v1/portal/:customerId/subscriptions/:subId/cancel` | Cancel |
| `POST` | `/v1/portal/:customerId/subscriptions/:subId/pause` | Pause |
| `POST` | `/v1/portal/:customerId/subscriptions/:subId/resume` | Resume |
| `POST` | `/v1/webhooks/nomba` | Nomba webhook receiver |
| `GET` | `/health` | Health check |
| `GET` | `/docs` | Swagger UI |

---

## Security Notes

- `NOMBA_CLIENT_SECRET` and `NOMBA_WEBHOOK_SECRET` are loaded from environment variables — never committed to source
- All webhook payloads are verified via HMAC-SHA256 before processing
- Every charge uses a unique `orderReference` for idempotency
- Duplicate webhook events are rejected via `requestId` unique index
- Nomba tokens are cached in Redis and refreshed at 55-minute mark (token TTL is 60 minutes)

---

## Architecture

```
Customer browser
      │
      ▼
POST /v1/checkout/start
      │
      ▼
Nomba hosted checkout (tokenizeCard: true)
      │
      ▼
GET /v1/checkout/complete  ←── Nomba redirects here
      │                    ←── OR webhook fires payment_success
      ▼
Subscription: active, tokenKey saved
      │
      ▼
BillingScheduler (hourly)
      │
      ▼
chargeSubscriptionCycle → POST /v1/checkout/tokenized-card-payment
      │
  ┌───┴───┐
  │       │
SUCCESS  FAILED
  │       │
Update   scheduleDunning(invoiceId)
period        │
        ┌─────┼─────┐
        │     │     │
       24h   72h   7d
        │     │     │
     retryCard  fallbackToVirtualAccount
                     │
               createVirtualAccount
                     │
               notifyCustomer (WhatsApp/SMS/email)
                     │
               webhook: payment_success (vact_transfer)
                     │
               Subscription: active ✅
```

---

Built for the Nomba x DevCareer Hackathon 2026.
