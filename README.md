# WLHL Membership App

A complete, mobile-friendly membership and community management app for the **Washington Longevity Healthy Life Club**.

## Production

The application is deployed at **[https://wlhl.vercel.app](https://wlhl.vercel.app)**.

- Vercel project: `musical-basics/wlhl`
- Turso database: `wlhl`
- Production region: AWS US East
- Browser push credentials: configured

The production administrator password is stored in the local macOS Keychain rather than in the repository. Retrieve it on the authorized development Mac with:

```bash
security find-generic-password -a "wlhl-admin" -s "WLHL Vercel Admin" -w
```

Production Zelle and club contact details intentionally remain hidden until the real values are added to Vercel.

## What is included

- Public club website with events, announcements, wellness products, and Zelle payment instructions
- Complete EN / 中文 language switcher with Chinese public pages and member portal
- Membership application with notification preferences and interests
- Private member home using email + the last four digits of the registered phone number
- Event registration and personal attended/completed event history
- Password-protected admin workspace
- Member approval/status management and CSV export
- Event creation, registration, check-in, and completion tracking
- Announcement publishing with optional browser push delivery
- Product management, bilingual product pages, and Stripe test Checkout
- Bilingual expert-profile management with public display ordering and visibility controls
- Installable PWA metadata and responsive layouts for phones, tablets, and desktops
- Automatic schema creation and starter data

## Stripe test shop

The shop is available at `/shop` and `/cn/shop`. Every active database product has
its own `/shop/{id}` page and a hosted Stripe Checkout button. The existing tea,
resistance bands, and wellness journal are suitable test products. Prices are USD.
This integration deliberately rejects live keys and never enables real payments.

1. Save `STRIPE_SECRET_KEY=sk_test_...` in `.env.local`. A publishable key is not
   needed for hosted Checkout. Never commit or share the secret key.
2. Run `npm run stripe:sync` to create/reuse Stripe test Products and Prices for
   the local database. After deployment, run
   `npm run stripe:sync -- --site https://wlhl.vercel.app` to sync the production
   site's catalog, whose product IDs may differ from local records.
3. Add the same test secret to Vercel Production. Register the test webhook URL
   `https://wlhl.vercel.app/api/stripe/webhook` in Stripe for
   `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
   Add its signing secret as `STRIPE_WEBHOOK_SECRET` in Vercel, then redeploy.
4. For local webhook testing, run
   `stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded --forward-to localhost:3000/api/stripe/webhook`
   and save the printed signing secret as `STRIPE_WEBHOOK_SECRET` locally.
5. Open a product, select **Test checkout**, and use Stripe's test card
   `4242 4242 4242 4242`, any future expiry, and any three-digit CVC. Use
   `4000 0000 0000 0002` to test a decline. Do not use real card information.

The server derives the price from the database, creates/reuses the corresponding
Stripe Price, and charges one item. Price edits create a new Price without
modifying existing sessions. Canceled checkouts return to the product page.
The success page retrieves the session from Stripe before showing confirmation.
Signed webhooks and the verified success page insert paid test orders into
`shop_orders` idempotently. Administrators can inspect that table in
`/admin/database`. No fulfillment, shipping, taxes, discounts, or live payments
are enabled. Existing in-flight checkouts keep their original price snapshot.

Run `npm test`, `npm run typecheck`, and `npm run build` for local verification.
After building, run `npm run test:integration` to verify the HTTP routes and signed
webhook handling against a temporary database with local fixture credentials.
These checks do not make a Stripe payment; an actual test Checkout still needs
valid Stripe credentials and the test-card flow above.
References: [Stripe Checkout](https://docs.stripe.com/payments/checkout/how-checkout-works),
[webhook signatures](https://docs.stripe.com/webhooks), and
[test cards](https://docs.stripe.com/testing).

## Technology stack

- Next.js 16 App Router and React 19
- TypeScript
- SQLite through `@libsql/client`
- Local SQLite file for development
- Turso-hosted SQLite for persistent Vercel production storage
- Web Push for browser notifications

## Run locally

Prerequisite: Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The development database is created automatically at `data/wlhl.db`.

The local admin workspace is at [http://localhost:3000/admin](http://localhost:3000/admin). When no `.env.local` exists, the development-only password is:

```text
wlhl-admin
```

Copy `.env.example` to `.env.local` and replace the example contact, Zelle, password, and secret values before using real member data.

## Main routes

| Route | Purpose |
| --- | --- |
| `/` | Club website, announcements, products, payment details |
| `/cn` | 中文俱乐部网站、公告、产品与付款说明 |
| `/about` | Club mission, team, membership, and contact information |
| `/cn/about` | 中文俱乐部宗旨、专家团队、会员方案与联系方式 |
| `/events` | Public event calendar |
| `/cn/events` | 中文活动日历 |
| `/events/ai-health-wealth-forum` | Bilingual September 7 forum information and registration |
| `/cn/events/ai-health-wealth-forum` | 9月7日论坛中文入口与报名 |
| `/september-7` | Short redirect to the September 7 registration page |
| `/cn/september-7` | Chinese short redirect to the September 7 registration page |
| `/join` | Membership application |
| `/cn/join` | 中文会员申请 |
| `/member` | Member sign-in, reservations, and event history |
| `/cn/member` | 中文会员中心、活动预约与历史记录 |
| `/admin` | Club management, registrations, attendance, expert profiles, and activity logs |
| `/admin/landing-page-editor` | Edit English and Chinese home page text, localized featured records, and shared uploaded images |
| `/admin/database` | Authenticated, read-only browser for all database tables and raw records |
| `/admin/members/[id]` | Complete member registration, engagement, and audit history |
| `/api/admin/export` | Authenticated member CSV export |

## Data model

The production SQLite database includes these operational tables:

| Table | Purpose |
| --- | --- |
| `members` | Member identity, contact information, preferences, status, interests, and notes |
| `events` | Public and member event schedule |
| `event_registrations` | Full public signup submissions, organization, role, language, referral, consent, and status |
| `attendance` | Member registration, check-in, attendance, and completion history |
| `activity_logs` | Member, administrator, and system audit trail |
| `announcements` | Club news, promotions, and push notification content |
| `products` | Public wellness product catalog |
| `push_subscriptions` | Browser push notification subscriptions |
| `landing_page_content` | Editable English home page labels, headings, descriptions, and calls to action |
| `landing_page_assets` | Uploaded home page images stored as persistent database blobs |
| `expert_profiles` | Editable English and Chinese expert biographies, public ordering, links, and visibility |

The September 7 forum registration flow creates or matches an `Event Guest` contact, writes the full form to `event_registrations`, adds an `attendance` record, and records the action in `activity_logs`.

## Deploy to Vercel

Vercel Functions do not provide a durable local SQLite file. The production app therefore connects to a remote SQLite-compatible Turso database while keeping the zero-configuration local file for development.

1. Create a free Turso database and retrieve its URL and token.

   ```bash
   turso db create wlhl
   turso db show --url wlhl
   turso db tokens create wlhl
   ```

2. Push this project to a Git provider and import it into Vercel, or run `vercel` from the project directory.

3. Add these required variables in **Vercel → Project → Settings → Environment Variables**:

   ```text
   TURSO_DATABASE_URL
   TURSO_AUTH_TOKEN
   ADMIN_PASSWORD
   SESSION_SECRET
   NEXT_PUBLIC_CLUB_EMAIL
   NEXT_PUBLIC_CLUB_PHONE
   NEXT_PUBLIC_ZELLE_HANDLE
   NEXT_PUBLIC_ZELLE_RECIPIENT
   ```

4. Redeploy. Tables and starter content are created automatically on first use.

Use long, unique values for `ADMIN_PASSWORD` and `SESSION_SECRET`. Admin login is intentionally unavailable in production until `ADMIN_PASSWORD` is configured.

## Enable browser notifications

Generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

Add the generated values to local/Vercel environment settings:

```text
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:hello@wlhlclub.org
```

After redeploying, visitors can enable notifications from the home page. Publishing an announcement from the admin workspace sends it to subscribed browsers. Email and SMS preferences are saved for future provider integration; this version does not send outbound email or SMS.

## Payment workflow

Products and membership fees use direct Zelle payment. The public website displays the recipient and handle from environment variables. Buyers are instructed to put their name and purchase in the memo, and the club confirms fulfillment manually. No card or bank credentials are collected by this app.

## Verification

```bash
npm run typecheck
npm run build
```

Both commands pass on the current implementation.
