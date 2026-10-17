# Website content and administrator access audit

Audited on October 17, 2026. All paths below also cover their `/cn` variants.

| Public page or content | Authorized editor |
| --- | --- |
| `/`, shared navigation, footer, contact and payment instructions | `/admin/landing-page-editor` |
| Shared logo, home artwork, product images and forum poster | `/admin/landing-page-editor#images` |
| `/about` | `/admin/pages?page=about`; expert records at `/admin?view=experts` |
| `/events` | `/admin/pages?page=events`; event records at `/shop-manager/events` |
| `/events/{id}` | `/shop-manager/events?event={id}`, including page wording, registration, fees and posters |
| `/events/ai-health-wealth-forum`, public registration and confirmation | `/admin/pages?page=forum` |
| `/join`, membership options, payment copy, application confirmation | `/admin/pages?page=join` |
| `/member`, login, profile labels, status labels and feedback | `/admin/pages?page=member`; private member records have their own protected administration forms |
| `/shop`, `/shop/{id}`, `/shop/success` | `/admin/pages?page=shop`; product records and images in the landing editor |
| `/news`, `/news/{id}`, home news preview | `/admin/pages?page=news`; article records and rich-text images in Fuint content management |
| Announcements, including hidden or nonfeatured records | Landing editor club records |
| `/september-7` | Redirects to the forum and uses its editor |

English and Chinese page copy are saved independently. Dynamic status labels are
editable display text; they never change stored approval, attendance or payment
states. Event ownership and revision checks apply to event wording as well as
dates, fees and poster uploads. Existing page edits survive this change.

## Administrator identities

- Existing signed website administrator sessions retain their access.
- A Fuint platform administrator must have a server-verified, active, unlocked
  account with merchant ID 0, store ID 0 and the current `admin` role. Its existing
  `Access-Token` is checked on every request, including Server Actions. Claims in
  browser storage or submitted ownership fields cannot grant global access.
- The platform administrator can read and edit event records across merchants,
  including legacy records without ownership metadata. Existing ownership stays
  intact. New website events belong to the configured website merchant.
- A merchant's `admin` role is insufficient for global website administration.
  Ordinary event managers retain the configured merchant and store scope.
- Fuint article reads and writes validate current account ownership and roles.
  The platform administrator can edit another merchant's article, while merchant
  and store editors cannot cross their scope. Destination stores must belong to
  the selected merchant. The backend still checks article API permissions.
- Website sign-out clears both administrator and Fuint browser cookies. Revoked
  or expired upstream sessions cannot continue editing through the website.

## Validation and limits

Integration tests exercise real rendered save forms for every page and language,
website and platform administrator sessions, cross-merchant event edits, rejected
ordinary accounts, stale versions and upstream revocation. Browser checks cover
the Fuint navigation link, publishing page copy, sign-out, ordinary account
denial, rich-text paste and image handling. Five isolated Java tests cover article
scope, destination ownership, current-account reassignment and a platform article
save. These tests do not write production content or submit payments.

Poster lettering requires editing and replacing the image. Google Forms and
Stripe-hosted pages are edited in their respective services. Browser-native
validation, administrative application controls and page layout code are not
public website editorial content. The Java backend patch is deployed separately
from Vercel; its installation script and tests live under `integrations/fuint-backend`
and `scripts/patch-fuint-backend.mjs`.
