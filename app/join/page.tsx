import { createCopy } from "@/lib/page-copy";
import { getPageCopy } from "@/lib/page-copy-store";
import { Check, HeartHandshake, Leaf, ShieldCheck } from "lucide-react";
import { JoinForm } from "@/components/join-form";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Join the Club" };

export default async function JoinPage() {
  const copyText = createCopy(await getPageCopy("join", "en"));
  return (
    <>
      <SiteHeader />
      <main className="join-page">
        <section className="join-intro">
          <div className="join-intro-inner">
            <p className="eyebrow eyebrow-light">{copyText("Membership begins here")}</p>
            <h1>{copyText("Your next good habit")}<br />{copyText("might be ")}<em>{copyText("us.")}</em></h1>
            <p>{copyText("Tell us a little about yourself. We’ll help you find your people, your events, and a rhythm that feels good.")}</p>
            <div className="join-perks">
              <span><Check size={16} />{copyText(" Welcoming, age-positive community")}</span>
              <span><Check size={16} />{copyText(" Events for every pace and experience")}</span>
              <span><Check size={16} />{copyText(" No payment required to apply")}</span>
            </div>
            <div className="join-art" aria-hidden="true"><Leaf size={170} /><HeartHandshake size={80} /></div>
          </div>
        </section>
        <section className="join-form-wrap">
          <div className="join-form-heading"><span className="step-chip">{copyText("Step 1 of 1")}</span><h2>{copyText("Let’s get acquainted.")}</h2><p>{copyText("Membership information stays private and is only used to run the club.")}</p></div>
          <JoinForm copy={await getPageCopy("join", "en")} />
          <div className="privacy-note"><ShieldCheck size={18} /><span><strong>{copyText("Your information is cared for.")}</strong>{copyText(" We never sell member data.")}</span></div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
