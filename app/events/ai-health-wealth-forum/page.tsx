import { getLandingPageAssetMetadata, getLandingPageContent } from "@/lib/db";
import { landingImageUrl } from "@/lib/landing-page-content";
import { createCopy } from "@/lib/page-copy";
import { getPageCopy } from "@/lib/page-copy-store";
import Link from "next/link";
import { ArrowLeft, Bot, CalendarDays, Clock3, HeartPulse, Landmark, MapPin, Mic2, Users } from "lucide-react";
import { Brand } from "@/components/brand";
import { ForumRegistrationForm } from "@/components/forum-registration-form";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PosterLightbox } from "@/components/poster-lightbox";

export const metadata = {
  title: "AI, Health & Wealth Legacy Forum | September 7",
  description: "Register for the September 7, 2026 bilingual forum on AI, healthy longevity, entrepreneurship, trusts, wills, and family wealth legacy in Rockville, Maryland.",
};

const speakers = [
  { name: "于建国", topic: "AI-powered health management, healthy aging, and a smarter future.", topicZh: "智启未来、健康管理与康养。", icon: HeartPulse },
  { name: "余晓晖", topic: "Trusts, wills, estate planning, and building a lasting family legacy.", topicZh: "财富传承、信托、遗嘱和遗产规划。", icon: Landmark },
  { name: "彭博", topic: "AI demonstrations for entrepreneurship, research, content, and growth.", topicZh: "小企业创业、AI 实操、市场研究与企业增长。", icon: Bot },
];

export async function ForumPageContent({ locale = "en" }: { locale?: "en" | "cn" }) {
  const copyText = createCopy(await getPageCopy("forum", locale));
  const cn = locale === "cn";
  const brand = await getLandingPageContent(locale);
  const poster = (await getLandingPageAssetMetadata()).find((asset) => asset.slot === "forum-poster");
  return (
    <main className="forum-page" lang={cn ? "zh-CN" : "en"}>
      <header className="forum-nav">
        <Brand inverse href={cn ? "/cn" : "/"} name={brand.brandName} tagline={brand.brandTagline} />
        <div className="forum-nav-actions">
          <LanguageSwitcher locale={locale} inverse />
          <Link href={cn ? "/cn/events" : "/events"}><ArrowLeft size={15} />{cn ? copyText("全部活动") : copyText("All club events")}</Link>
        </div>
      </header>

      <section className="forum-hero">
        <div className="forum-hero-copy">
          <div className="forum-date-pill"><CalendarDays size={16} />{cn ? copyText("2026年9月7日") : copyText("September 7, 2026")}</div>
          <p className="forum-kicker gold">{cn ? copyText("中英双语社区论坛") : copyText("Bilingual community forum")}</p>
          <h1>{cn ? <>{copyText("智启未来")}<br /><em>{copyText("健康与传承。")}</em></> : <>{copyText("AI empowers")}<br /><em>{copyText("health & legacy.")}</em></>}</h1>
          <h2>{cn ? copyText("健康长寿 · 财富传承") : copyText("Healthy longevity · Family legacy")}</h2>
          <p>{cn ? copyText("共同探讨 AI 时代的健康管理、康养生活、企业发展与家庭财富传承。") : copyText("Discover how artificial intelligence is reshaping healthy aging, small-business growth, and the way families plan for generations to come.")}</p>
          <div className="forum-quick-details">
            <div><Clock3 size={19} /><span><strong>{cn ? copyText("下午 2:00–5:00") : copyText("2:00–5:00 PM")}</strong>{cn ? copyText("星期一") : copyText("Monday")}</span></div>
            <div><MapPin size={19} /><span><strong>{copyText("7361 Calhoun Place")}</strong>{cn ? copyText("马里兰州洛克维尔 · 一楼会议室") : copyText("Rockville, MD 20855 · First-floor conference room")}</span></div>
          </div>
          <a className="forum-button coral" href="#register">{cn ? copyText("免费报名") : copyText("Register free")}</a>
        </div>
        <div className="forum-poster-wrap">
          <div className="forum-poster-glow" />
          <PosterLightbox locale={locale} copy={await getPageCopy("forum", locale)} src={poster ? landingImageUrl(poster.slot, poster.updated_at) : undefined} />
        </div>
      </section>

      <section className="forum-speakers">
        <div className="forum-section-heading">
          <p className="forum-kicker">{cn ? copyText("三大实用主题") : copyText("Three practical perspectives")}</p>
          <h2>{cn ? <>{copyText("健康长寿的新思路，")}<br /><em>{copyText("家业传承的新方法。")}</em></> : <>{copyText("Ideas for a longer life")}<br /><em>{copyText("and a stronger legacy.")}</em></>}</h2>
        </div>
        <div className="forum-speaker-grid">
          {speakers.map(({ name, topic, topicZh, icon: Icon }, index) => (
            <article key={name}>
              <span className="forum-speaker-number">0{index + 1}</span>
              <span className="forum-speaker-icon"><Icon size={23} /></span>
              <p>{cn ? copyText("主题演讲") : copyText("Featured speaker")}</p>
              <h3>{copyText(name)}</h3>
              <p>{copyText(cn ? topicZh : topic)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="forum-audience">
        <div className="forum-audience-card">
          <span><Users size={28} /></span>
          <div><p className="forum-kicker gold">{cn ? copyText("参会对象") : copyText("Who should attend")}</p><h2>{cn ? <>{copyText("关注未来的人士，")}<br /><em>{copyText("社区与行业领袖。")}</em></> : <>{copyText("Curious minds,")}<br /><em>{copyText("community leaders.")}</em></>}</h2></div>
          <p>{cn ? copyText("欢迎商会会员、企业主与管理者、健康和财富专业人士、协会与学生代表，以及所有关注健康生活和家庭未来的朋友参加。") : copyText("Chamber members, business owners and executives, health and wealth professionals, association and student representatives, and anyone interested in healthier lives and stronger family futures.")}</p>
        </div>
      </section>

      <section className="forum-register-section" id="register">
        <div className="forum-register-aside">
          <p className="forum-kicker gold">{cn ? copyText("9月7日 · 洛克维尔") : copyText("September 7 · Rockville")}</p>
          <h2>{cn ? <>{copyText("加入这场")}<br /><em>{copyText("精彩对话。")}</em></> : <>{copyText("Join the")}<br /><em>{copyText("conversation.")}</em></>}</h2>
          <p>{cn ? copyText("席位有限，请立即报名。活动信息将保存在您的会员中心。") : copyText("Seats are limited. Register now and we’ll keep your event details together in your club member home.")}</p>
          <div className="forum-detail-stack">
            <div><CalendarDays size={18} /><span><strong>{cn ? copyText("2026年9月7日，星期一") : copyText("Monday, September 7, 2026")}</strong></span></div>
            <div><Clock3 size={18} /><span><strong>{cn ? copyText("下午 2:00–5:00") : copyText("2:00–5:00 PM")}</strong></span></div>
            <div><MapPin size={18} /><span><strong>{copyText("7361 Calhoun Place")}</strong>{copyText("Rockville, Maryland 20855")}</span></div>
            <div><Mic2 size={18} /><span><strong>{cn ? copyText("周典主持") : copyText("Hosted by Zhou Dian")}</strong>{cn ? copyText("美国中美联合商会主办") : copyText("Hosted by the U.S.-China Chamber of Commerce")}</span></div>
          </div>
        </div>
        <div className="forum-form-card"><ForumRegistrationForm locale={locale} copy={await getPageCopy("forum", locale)} /></div>
      </section>
    </main>
  );
}

export default function ForumPage() {
  return <ForumPageContent />;
}
