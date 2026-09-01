import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, ExternalLink, Image as ImageIcon, Info, Save, TriangleAlert, Upload } from "lucide-react";
import {
  removeLandingPageImageAction,
  updateLandingAnnouncementAction,
  updateLandingEventAction,
  updateLandingPageContentAction,
  updateLandingProductAction,
  uploadLandingPageImageAction,
} from "./actions";
import { AdminSidebar } from "@/components/admin-sidebar";
import { isAdmin } from "@/lib/auth";
import {
  getAnnouncements,
  getEvents,
  getLandingPageAssetMetadata,
  getLandingPageContent,
  getProducts,
  type LandingPageAssetMetadata,
} from "@/lib/db";
import { formatCurrency, formatEventDate, formatEventTime } from "@/lib/format";
import { landingImageUrl, landingPageFieldGroups } from "@/lib/landing-page-content";

export const metadata = { title: "Landing Page Editor" };

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ImageUploadCard({
  slot,
  title,
  description,
  alt,
  asset,
}: {
  slot: string;
  title: string;
  description: string;
  alt: string;
  asset?: LandingPageAssetMetadata;
}) {
  return (
    <article className="landing-image-card">
      <div className={`landing-image-preview ${asset ? "has-image" : ""}`}>
        {asset
          ? <img src={landingImageUrl(slot, asset.updated_at)} alt={alt} />
          : <span><ImageIcon size={24} />Default artwork is active</span>}
      </div>
      <div className="landing-image-copy">
        <h3>{title}</h3>
        <p>{description}</p>
        {asset && <small>{asset.file_name} · {formatBytes(Number(asset.byte_size))}</small>}
      </div>
      <form action={uploadLandingPageImageAction} className="landing-upload-form" encType="multipart/form-data">
        <input type="hidden" name="slot" value={slot} />
        <label>
          <span>Choose image</span>
          <input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required />
        </label>
        <button className="button button-dark button-small"><Upload size={15} />{asset ? "Replace" : "Upload"}</button>
      </form>
      {asset && (
        <form action={removeLandingPageImageAction}>
          <input type="hidden" name="slot" value={slot} />
          <button className="landing-remove-image">Restore default artwork</button>
        </form>
      )}
    </article>
  );
}

export default async function LandingPageEditor({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  const params = await searchParams;
  const [content, assets, events, announcements, products] = await Promise.all([
    getLandingPageContent(),
    getLandingPageAssetMetadata(),
    getEvents(),
    getAnnouncements(2),
    getProducts(),
  ]);
  const assetMap = new Map(assets.map((asset) => [asset.slot, asset]));
  const nextEvent = events[0];
  const visibleProducts = products.slice(0, 3);

  return (
    <div className="admin-shell">
      <AdminSidebar active="landing-page" />
      <main className="admin-main landing-editor-main">
        <header className="admin-topbar landing-editor-topbar">
          <div><p className="eyebrow">Website content</p><h1>Landing page editor</h1></div>
          <Link className="button button-outline button-small" href="/" target="_blank"><ExternalLink size={15} />Open live page</Link>
        </header>

        {params.saved && <div className="saved-toast"><CheckCircle2 size={17} />{params.saved}</div>}
        {params.error && <div className="editor-error-toast"><TriangleAlert size={17} />{params.error}</div>}

        <section className="landing-editor-note">
          <Info size={19} />
          <div><strong>Edit the English home page</strong><p>Save a text section or upload an image, then refresh the live preview. Event, announcement, and product changes also update their public detail pages.</p></div>
        </section>

        <div className="landing-editor-workspace">
          <form action={updateLandingPageContentAction} className="landing-copy-form">
            <div className="landing-form-heading">
              <div><h2>Page copy</h2><p>Every fixed English label, heading, description, button, and footer line on the home page.</p></div>
              <button className="button button-dark button-small"><Save size={15} />Save all text</button>
            </div>
            {landingPageFieldGroups.map((group, index) => (
              <details className="landing-field-group" key={group.title} open={index === 0}>
                <summary><span><strong>{group.title}</strong><small>{group.description}</small></span></summary>
                <div className="landing-field-grid">
                  {group.fields.map((field) => (
                    <label className={field.multiline ? "wide-field" : ""} key={field.key}>
                      {field.label}{field.note && <span className="label-note">{field.note}</span>}
                      {field.multiline
                        ? <textarea name={field.key} defaultValue={content[field.key]} rows={3} maxLength={2000} />
                        : <input name={field.key} defaultValue={content[field.key]} maxLength={2000} />}
                    </label>
                  ))}
                </div>
              </details>
            ))}
            <div className="landing-form-footer"><button className="button button-dark"><Save size={16} />Save all page text</button></div>
          </form>

          <aside className="landing-preview-panel">
            <div><strong>Live page preview</strong><a href="/" target="_blank">Open full size <ExternalLink size={13} /></a></div>
            <iframe src="/" title="Current landing page preview" />
            <p>The preview shows the last saved version. Refresh it after saving.</p>
          </aside>
        </div>

        <section className="admin-panel landing-media-panel" id="images">
          <div className="admin-panel-heading"><div><h2>Page images</h2><p>Upload optimized landscape images. JPG, PNG, WebP, or GIF; maximum 4 MB each.</p></div></div>
          <div className="landing-image-grid">
            <ImageUploadCard slot="logo" title="Brand logo" description="Replaces the leaf mark in the home page header and footer." alt={`${content.brandName} logo`} asset={assetMap.get("logo")} />
            <ImageUploadCard slot="hero" title="Hero image" description="Main visual at the top of the page. Portrait or 4:5 images work best." alt={content.heroImageAlt} asset={assetMap.get("hero")} />
            <ImageUploadCard slot="notification" title="Notification image" description="Replaces the phone mockup in the notification section." alt={content.notificationImageAlt} asset={assetMap.get("notification")} />
            <ImageUploadCard slot="membership" title="Membership background" description="Background image behind the final membership invitation." alt={content.membershipImageAlt} asset={assetMap.get("membership")} />
          </div>
        </section>

        <section className="admin-panel landing-live-panel" id="live-content">
          <div className="admin-panel-heading"><div><h2>Content shown from club records</h2><p>Edit the current featured event, news strip, and first three shop products without leaving this page.</p></div></div>

          <div className="landing-record-section">
            <div className="landing-record-heading"><div><span>Featured event</span><h3>{nextEvent?.title || "No upcoming event"}</h3></div><Link href="/admin?view=events">Manage all events</Link></div>
            {nextEvent ? (
              <div className="landing-record-grid">
                <form action={updateLandingEventAction} className="stack-form landing-record-form">
                  <input type="hidden" name="eventId" value={nextEvent.id} />
                  <label>Event title<input name="title" defaultValue={nextEvent.title} required /></label>
                  <label>Description<textarea name="description" rows={4} defaultValue={nextEvent.description} required /></label>
                  <label>Location<input name="location" defaultValue={nextEvent.location} required /></label>
                  <p className="landing-derived-copy">Date shown on the page: <strong>{formatEventDate(nextEvent.event_date, true)} at {formatEventTime(nextEvent.event_date)}</strong></p>
                  <button className="button button-dark button-small">Save featured event</button>
                </form>
                <ImageUploadCard
                  slot={`event-${nextEvent.id}`}
                  title="Featured event image"
                  description="Replaces the green and gold event artwork on the home page."
                  alt={content.eventImageAlt}
                  asset={assetMap.get(`event-${nextEvent.id}`)}
                />
              </div>
            ) : <p className="admin-empty">Create an upcoming event to populate this section.</p>}
          </div>

          <div className="landing-record-section">
            <div className="landing-record-heading"><div><span>News strip</span><h3>The two announcements currently shown</h3></div><Link href="/admin?view=announcements">Manage all announcements</Link></div>
            <div className="landing-record-cards two-up">
              {announcements.map((announcement) => (
                <form action={updateLandingAnnouncementAction} className="stack-form landing-record-form" key={announcement.id}>
                  <input type="hidden" name="announcementId" value={announcement.id} />
                  <label>Headline<input name="title" defaultValue={announcement.title} required /></label>
                  <label>Message<textarea name="message" rows={4} defaultValue={announcement.message} required /></label>
                  <label>Type<select name="kind" defaultValue={announcement.kind}><option value="community">Community</option><option value="event">Event</option><option value="promotion">Promotion</option></select></label>
                  <label className="check-line"><input type="checkbox" name="featured" defaultChecked={Boolean(announcement.featured)} /> <span>Feature this announcement</span></label>
                  <button className="button button-dark button-small">Save announcement</button>
                </form>
              ))}
              {announcements.length === 0 && <p className="admin-empty">Publish an announcement to populate the news strip.</p>}
            </div>
          </div>

          <div className="landing-record-section">
            <div className="landing-record-heading"><div><span>Wellness shop</span><h3>The first three active products currently shown</h3></div><Link href="/admin?view=products">Manage all products</Link></div>
            <div className="landing-record-cards product-editor-cards">
              {visibleProducts.map((product) => (
                <article className="landing-product-editor" key={product.id}>
                  <form action={updateLandingProductAction} className="stack-form landing-record-form">
                    <input type="hidden" name="productId" value={product.id} />
                    <label>Product name<input name="name" defaultValue={product.name} required /></label>
                    <label>Description<textarea name="description" rows={4} defaultValue={product.description} required /></label>
                    <div className="form-row two-columns"><label>Price<input name="price" type="number" min="0" step="0.01" defaultValue={Number(product.price)} required /></label><label>Category<input name="category" defaultValue={product.category} required /></label></div>
                    <label>Badge<input name="badge" defaultValue={product.badge} /></label>
                    <p className="landing-derived-copy">Current price: <strong>{formatCurrency(Number(product.price))}</strong></p>
                    <button className="button button-dark button-small">Save product</button>
                  </form>
                  <ImageUploadCard
                    slot={`product-${product.id}`}
                    title={`${product.name} image`}
                    description="Replaces this product card’s default icon artwork."
                    alt={product.name}
                    asset={assetMap.get(`product-${product.id}`)}
                  />
                </article>
              ))}
              {visibleProducts.length === 0 && <p className="admin-empty">Add an active product to populate the shop.</p>}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
