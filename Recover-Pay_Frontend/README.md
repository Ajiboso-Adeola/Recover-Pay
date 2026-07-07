# RecoverPay Frontend

## Tech stack
- **Next.js 15** (App Router)
- **Clerk** — authentication (sign up, sign in, sessions)
- **Tailwind CSS** — styling
- **TypeScript** — type safety

---

## Setup

### 1. Install dependencies
```bash
cd recoverpay-frontend
npm install
```

### 2. Create .env.local
```bash
cp .env.example .env.local
```

Fill in these values:

**Clerk keys** — go to https://dashboard.clerk.com:
1. Create a new application
2. Name it "RecoverPay"
3. Choose Email + Password as sign-in options
4. Copy the Publishable Key and Secret Key

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 3. Start the dev server (runs on port 3001)
```bash
npm run dev -- --port 3001
```

Make sure your backend is already running on port 3000.

---

## Page structure

```
/                           Landing page (marketing)
/sign-in                    Clerk sign-in
/sign-up                    Clerk sign-up
/dashboard                  Overview + stats
/dashboard/plans            Plans grid
/dashboard/plans/new        Create plan form
/dashboard/subscriptions    All subscriptions table
/dashboard/settings         API key + integration guide
```

---

## How auth works

1. Tenant signs up via Clerk (email + password)
2. Clerk creates a user account
3. Browser redirects to /dashboard
4. Dashboard layout calls POST /v1/auth/register with Clerk JWT
5. Backend creates Tenant record + generates API key (rp_sk_...)
6. Tenant copies API key from Settings page
7. Tenant uses API key in their own code to call RecoverPay endpoints

---

## API key flow

```
Tenant signs up
       ↓
Backend creates: Tenant { apiKey: "rp_sk_abc123..." }
       ↓
Tenant copies key from /dashboard/settings
       ↓
Tenant's app calls:
  POST /v1/checkout/start
  Authorization: Bearer rp_sk_abc123...
       ↓
RecoverPay processes their customers' payments
```

---

## Deployment

Deploy to Vercel (recommended for Next.js):
1. Push to GitHub
2. Connect repo to Vercel
3. Add all .env.local variables as Vercel environment variables
4. Update NEXT_PUBLIC_API_URL to your Render backend URL
5. Deploy

After deployment, update backend CORS with your Vercel URL.
