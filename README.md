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

Copy `.env.example` to `.env.local` and replace the example contact, Zelle, password, and secret values before using real member data. Keep both Turso values empty for local SQLite, or set both to real remote database credentials. Next.js does not load `.env.example`; restart the server after editing `.env.local`.

## Frontend and backend connection

The frontend and backend run in the same Next.js application. Membership and event
forms call Server Actions in `app/actions.ts`; the shop and push controls call
same-origin `/api` routes. No separate API server, browser database credentials,
or `NEXT_PUBLIC_API_URL` is needed.

Local development uses `data/wlhl.db` unless both Turso variables are configured.
Vercel uses its own Production environment variables and the hosted Turso database.
These databases are separate: a local signup will not appear in the production
admin workspace. To use a shared database, configure the same remote URL and token
in the intended environments. Do not copy placeholder credentials or commit secrets.

Public pages read database content at request time, so database changes appear on
the next page load instead of using a build-time snapshot. Admin actions also
invalidate the affected English and Chinese pages. A failed database initialization
can retry on a later request without restarting the application.

Check the running server and database together:

```bash
curl --fail http://localhost:3000/api/health
curl --fail https://wlhl.vercel.app/api/health
```

Success returns `{"status":"ok","database":"connected"}`. Database failure returns
HTTP 503 without exposing credentials. Vercel requires a remote database; missing
credentials never silently fall back to an ephemeral SQLite file there.

Stripe checkout separately requires `STRIPE_SECRET_KEY`, and signed webhook handling
requires `STRIPE_WEBHOOK_SECRET`. A healthy database does not enable payments when
those settings are absent. Email and SMS preferences are stored only; outbound
email/SMS providers are not integrated.

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
npm test
npm run test:integration
```

The integration suite starts production-mode servers against temporary databases.
It verifies live database reads, rendered membership and forum form submissions,
member login, admin approval, bilingual event publishing, member reservations,
shop routes, and signed webhook persistence without changing production data.

## Website editing and access

Sign in at `/admin/login`, then open **全站网页内容** at `/admin/pages?locale=cn`.
Alternatively, sign in to Fuint as a platform administrator and use **全站网页内容**
in its navigation. The website verifies the existing `Access-Token` with Fuint on
each request; only an active, unlocked account with merchant ID 0, store ID 0 and
the current `admin` role receives full website administration. Merchant `admin`
roles, ordinary store accounts and member sessions do not grant global access.
No new long-lived website administrator cookie is issued by this bridge.

| Content | Editing location | Who can save |
| --- | --- | --- |
| Home, navigation, footer, contact details and payment instructions | `/admin/landing-page-editor` | Administrator |
| About, events, join form, member portal, shop and checkout copy, forum | `/admin/pages` (English / 中文 tabs) | Administrator |
| News list, article detail labels, home news preview and feedback text | `/admin/pages?page=news` | Administrator |
| Event detail wording, posters and registration information across merchants | `/shop-manager/events` | Website or platform administrator; scoped shop manager |
| Every event, announcement and product, including past events and hidden products | Club records in `/admin/landing-page-editor` | Administrator |
| Event dates, capacity and status; product prices and translations | Club records in `/admin/landing-page-editor` | Administrator |
| Home and product images, shared logo, forum poster | Image forms in `/admin/landing-page-editor` | Administrator |
| Expert biographies, order and visibility | `/admin?view=experts` | Administrator |
| Member contact details and membership plan | `/admin/members/{id}` | Administrator |
| Member approval and attendance | Members and Attendance in `/admin` | Administrator |
| Own name, interests and notification preferences | Profile form in `/member` or `/cn/member` | Signed-in account owner |

The page editor saves plain text to `page_content` and escapes it on rendering.
Each language has a separate revision, and stale forms cannot overwrite newer
page edits. All administrative Server Actions check the administrator session
before reading submitted fields or writing data. Profile updates derive the
member ID from the verified session and ignore submitted identity or privilege
fields. An existing member must sign in before submitting a public forum form
for their email. Registration cannot reset staff-recorded attendance.

Sessions include a signed role and server-checked expiry. The session format
change requires existing members and administrators to sign in again. Production
cannot use the development signing fallback. Sign-in attempts are limited to ten
per fifteen minutes per member email or administrator source address. Membership
sign-in still uses the existing email and phone-suffix method; this is not a
password or MFA system.

The optional external news/member service and prebuilt applications under
`public/funit-application` and `public/wlhl-application` use their own backend
accounts and permissions. Their verified platform administrator can also use
the website editors, while scoped merchant and store sessions remain limited.
Their generated bundles are not committed. Existing bundles must be supplied
separately when deploying a checkout that needs those applications. This page
editor manages the Next.js website's content, not the external service's records.

The website editor links to the Fuint article editor for external article records.
`scripts/patch-fuint-backend.mjs /path/to/fuintBackend` installs the tracked article
authorization patch and its isolated Java tests. Build the application with tests
enabled and restart its existing service separately; a Vercel deployment does not
update the Java backend. The patch permits the active platform administrator to
edit articles across merchants, validates current account ownership and roles,
checks store boundaries and rejects mismatched destination stores. Editing content
does not change article ownership unless the authorized editor explicitly chooses
a valid destination. API permission annotations continue to apply.

The public content audit covers both languages: home and shared navigation/footer;
about and expert profiles; event calendar and individual details; the September 7
forum and registration; membership application and member portal; shop, product
details and checkout result; news list and article details. Redirect aliases share
their destination editor. Page copy, content records, images and private member
data have distinct editors linked from the central page. Poster lettering remains
part of the image and requires replacing that image. Browser-provided validation
messages, third-party Google Forms and Stripe-hosted pages are not website content.

`npm run test:integration` includes an isolated temporary database and exercises
actual rendered forms for public routes, both page languages, stale saves,
unauthorized action replay, member ownership, and forum account protection.
No production member data or real payments are used by these tests.

### Content management articles and images

Articles published in the standalone Fuint administration app appear in the home
page's latest news section and at `/news` or `/cn/news`. Each article has a public
detail page. Enabled articles are read without caching; switching back to the
public browser tab refreshes the list. Within the same sort priority, the most
recently updated article appears first. Disabled articles are excluded.

The server reads the public Fuint article API using `FUINT_API_URL` (falling back
to `NEXT_PUBLIC_FUINT_API`) and `FUINT_MERCHANT_NO` (default `10001`). It does not
use or expose an administrator token. Rich text is sanitized before publication.
`/api/content-media/static/...` serves only allowed media paths from the configured
backend, adds the tunnel bypass header, and rejects non-media responses. Existing
localhost image references are normalized when read, without altering stored
article content. Missing source files still need to be restored or re-uploaded.

The Fuint vendor source is maintained separately. This repository tracks the
editor override and reproducible build integration, not generated application
bundles. Build the administration app before deploying from a new checkout:

```bash
npm run build:content-admin -- /absolute/path/to/fuintAdmin
```

The source directory must have its own dependencies installed. The script uses
an isolated staging directory, preserves the original source and configuration,
and produces both existing administration entry points under `public/`. Previous
chunks remain available for open browser tabs. Uploads still require the current
Fuint account token and the backend's existing permissions. No account or password
is created or modified by this build.

The editor supports plain text, rich HTML, and image paste; screenshots and cover
images are limited to 5 MB. Failed uploads display an error. Saving is disabled
while an image upload is pending. `tests/content-browser.cjs` exercises paste,
selection replacement, uploads, failure handling, save/reopen, and public rendering
with intercepted fixture APIs, so it never writes production articles:

```bash
# Start a locally built application with an isolated local database first.
TEST_ORIGIN=http://127.0.0.1:3135 npm run test:content-browser
```

The browser test uses an installed Chrome browser through Playwright.

If a renamed merchant still shows its previous label in existing Fuint sessions,
`scripts/refresh-fuint-merchant-label.lua` updates only that label while preserving
the session token and expiration. Confirm the database name first, then invoke it
with the merchant ID, old name, and new name through the authenticated Redis CLI.

### Publishing website events as a shop manager

1. Sign in to `/wlhl-application/index.html` with the existing Fuint account.
2. Click **发布网站活动** in the top navigation, or open `/shop-manager/events`.
3. Click **新增活动**, enter the title, description, start/end times, location, and
   category, then upload a PNG/JPG/WebP poster up to 4 MB. Times always use
   `America/New_York`, regardless of the manager's device timezone. Planned
   capacity is optional; blank means unspecified. English text is optional.
4. Select **上线（即将举行）** and click **保存活动**. The event appears on both
   language calendars, with a poster and detail page. The nearest upcoming event
   also appears on both home pages. The confirmation links to the public page.
5. Use **编辑活动** to revise it. **草稿** is private; **下线 / 取消** removes the
   public event page and calendar entry. No code deployment is required for
   subsequent event edits or poster uploads.

The manager API validates the current Fuint session with `backendApi/login/getInfo`
for every request. It accepts only administrator/common roles in
`FUINT_MERCHANT_ID` (default `1`), with `content:article:index` and the appropriate
`content:article:add` or `content:article:edit` permission. Store accounts are
restricted to their own store; merchant accounts with store ID 0 can manage all
of that merchant's events. Existing site administrators retain full access.
These permissions do not grant access to the site's member database or other
administrator pages. Client-supplied owner/store IDs are ignored. Event saves and
poster writes are transactional, stale revisions are rejected, and drafts are
excluded from public event and poster pages.

`event_management` records ownership, revision, and modification time alongside
existing event rows; images remain in the persistent landing asset table. New
site-admin events belong to the configured merchant at store ID 0. Legacy events
without ownership metadata remain editable only by site administrators.

Validation: `npm test`, `npm run test:integration`, and
`npm run test:event-manager-browser`. The browser test starts isolated database
and permission fixtures and exercises publish, edit, poster viewing, mobile
layout, and unpublishing without writing production data.

### Event registration, fees and payment instructions

In the event manager, **活动网页文字** edits each event detail page's section
headings, registration buttons, help text, capacity template, ended message,
and poster viewer labels. Chinese and English are saved separately. Optional
notes can be cleared; the capacity template must retain `{capacity}`. These
plain-text settings share the event's ownership and revision checks and are
preserved when older editors save other fields. Existing events keep the
original wording until edited. `/shop-manager/events?event=EVENT_ID` opens a
specific event when the signed-in manager has access.

The manager's **网页上的文字在哪里改？** panel links website administrators to
the shared calendar copy at `/admin/pages?page=events&locale=cn` and navigation
and footer copy at `/admin/landing-page-editor?locale=cn`. Poster image lettering
requires uploading an edited image. The September 7 forum uses its existing
dedicated editor at `/admin/pages?page=forum&locale=cn`.

In `/shop-manager/events`, open an event and edit **报名登记与收费**. Set an
optional HTTPS registration form URL, fee details and payment instructions;
English versions are available in the English content section. Save a published
event to update its public detail page. Website administrators can also edit
these fields in the event creation form and the landing-page record editor.

When a registration URL is present, the public registration button opens that
form, including for visitors who are not club members. The external form stores
those submissions; they are not automatically imported into website attendance.
Without an external URL, the existing member registration flow remains active.
Payment instructions describe the organizer's payment methods and do not initiate
a payment or mark a registration as paid. Empty fee fields make no claim that an
event is free. Existing events retain their values when older clients omit the
new fields. The event manager's merchant/store scope and revision checks also
protect registration URLs, fees and payment details.

### Reviewing website membership applications

Open `/admin?view=approvals`, or choose **网站会员审核** in the Fuint sidebar.
The Fuint member directory also links to this queue. Both links use the existing
website administrator login; a shop session alone does not authorize access to
website member records. The login page preserves the approval destination.

The website dashboard has a **会员审核** navigation item with a pending count and
an overview reminder. The queue shows only pending website applications, with
contact details, membership tier, application date, and a profile link. Clicking
**审核通过** activates that member, records an audit entry, and returns to the
queue. Fuint shop members and website membership applications remain separate.

### Administrator login troubleshooting

Website administration at `/admin/login` takes the separate `ADMIN_PASSWORD` and
does not use a username. Retrieve the production value from the authorized Mac's
Keychain as documented above. Local ignored environment files may contain a copy
for the operator; never commit them or print their contents in diagnostics.
`FUINT_ADMIN_USERNAME` and `FUINT_ADMIN_PASSWORD` may also hold local operator
references. Editing these references does not reset a Fuint database account.

The website password field offers explicit paste and visibility controls. Pasting
replaces the existing field value, and denied clipboard access falls back to
manual paste. Successful website administrator logins clear their attempt counter;
ten consecutive failed attempts still block further attempts for 15 minutes.

Shop administration at `/wlhl-application/index.html#/login` uses Fuint accounts.
It starts with empty credentials and links to the website login. The remember
option stores only the username; legacy password cookies are removed, and the
browser password manager can fill the password. Expired sessions clear local
authentication without calling the expired logout endpoint. Relogin stays within
the same administration entry, including `/funit-application/index.html`.
Explicit logout also clears local credentials if the server logout call fails.

`npm run test:admin-login-browser` checks both entry points, invalid-password
retry, expired-session recovery, legacy cookies, and logout failure using mocked
backend requests. Set `TEST_ORIGIN` to select the deployed or local frontend.

### Organization labels

The Chinese administration interface calls merchants **分会** and stores
**部门**, including ownership fields, menus, filters, validation messages,
and event management. `build:content-admin` applies the terminology to staged
Vue views and backend route titles. Saved organization names, article content,
API identifiers, authorization scopes, and WeChat payment merchant numbers
are unchanged. Rebuild both administration entry points when changing labels.

### Historical events and meeting minutes

Publish meeting minutes through `/shop-manager/events` with status **已结束**.
The public Chinese and English calendars show completed events and elapsed
published events under **历史活动** / **Past events**, ordered by event date
newest first. Upcoming events keep chronological order. Drafts and cancelled
events are excluded from both public sections. Archive headings and link labels
remain editable through the event calendar page-copy editor.

Select **仅显示日期（未记录具体时间）** when only the meeting date is known.
The editor stores `date_precision = 'day'`, preserves the calendar date in
Eastern Time, and suppresses the internal time anchor in public displays.
The end time is optional. Existing clients preserve date precision when they
omit the new setting. Full minutes remain editable in the description field;
calendar cards show a short excerpt, and details without posters use the full
reading column.
