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

export function ForumPageContent({ locale = "en" }: { locale?: "en" | "cn" }) {
  const cn = locale === "cn";
  return (
    <main className="forum-page" lang={cn ? "zh-CN" : "en"}>
      <header className="forum-nav">
        <Brand inverse href={cn ? "/cn" : "/"} />
        <div className="forum-nav-actions">
          <LanguageSwitcher locale={locale} inverse />
          <Link href={cn ? "/cn/events" : "/events"}><ArrowLeft size={15} />{cn ? "全部 WLHL 活动" : "All WLHL events"}</Link>
        </div>
      </header>

      <section className="forum-hero">
        <div className="forum-hero-copy">
          <div className="forum-date-pill"><CalendarDays size={16} />{cn ? "2026年9月7日" : "September 7, 2026"}</div>
          <p className="forum-kicker gold">{cn ? "中英双语社区论坛" : "Bilingual community forum"}</p>
          <h1>{cn ? <>智启未来<br /><em>健康与传承。</em></> : <>AI empowers<br /><em>health & legacy.</em></>}</h1>
          <h2>{cn ? "健康长寿 · 财富传承" : "Healthy longevity · Family legacy"}</h2>
          <p>{cn ? "共同探讨 AI 时代的健康管理、康养生活、企业发展与家庭财富传承。" : "Discover how artificial intelligence is reshaping healthy aging, small-business growth, and the way families plan for generations to come."}</p>
          <div className="forum-quick-details">
            <div><Clock3 size={19} /><span><strong>{cn ? "下午 2:00–5:00" : "2:00–5:00 PM"}</strong>{cn ? "星期一" : "Monday"}</span></div>
            <div><MapPin size={19} /><span><strong>7361 Calhoun Place</strong>{cn ? "马里兰州洛克维尔 · 一楼会议室" : "Rockville, MD 20855 · First-floor conference room"}</span></div>
          </div>
          <a className="forum-button coral" href="#register">{cn ? "免费报名" : "Register free"}</a>
        </div>
        <div className="forum-poster-wrap">
          <div className="forum-poster-glow" />
          <PosterLightbox locale={locale} />
        </div>
      </section>

      <section className="forum-speakers">
        <div className="forum-section-heading">
          <p className="forum-kicker">{cn ? "三大实用主题" : "Three practical perspectives"}</p>
          <h2>{cn ? <>健康长寿的新思路，<br /><em>家业传承的新方法。</em></> : <>Ideas for a longer life<br /><em>and a stronger legacy.</em></>}</h2>
        </div>
        <div className="forum-speaker-grid">
          {speakers.map(({ name, topic, topicZh, icon: Icon }, index) => (
            <article key={name}>
              <span className="forum-speaker-number">0{index + 1}</span>
              <span className="forum-speaker-icon"><Icon size={23} /></span>
              <p>{cn ? "主题演讲" : "Featured speaker"}</p>
              <h3>{name}</h3>
              <p>{cn ? topicZh : topic}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="forum-audience">
        <div className="forum-audience-card">
          <span><Users size={28} /></span>
          <div><p className="forum-kicker gold">{cn ? "参会对象" : "Who should attend"}</p><h2>{cn ? <>关注未来的人士，<br /><em>社区与行业领袖。</em></> : <>Curious minds,<br /><em>community leaders.</em></>}</h2></div>
          <p>{cn ? "欢迎商会会员、企业主与管理者、健康和财富专业人士、协会与学生代表，以及所有关注健康生活和家庭未来的朋友参加。" : "Chamber members, business owners and executives, health and wealth professionals, association and student representatives, and anyone interested in healthier lives and stronger family futures."}</p>
        </div>
      </section>

      <section className="forum-register-section" id="register">
        <div className="forum-register-aside">
          <p className="forum-kicker gold">{cn ? "9月7日 · 洛克维尔" : "September 7 · Rockville"}</p>
          <h2>{cn ? <>加入这场<br /><em>精彩对话。</em></> : <>Join the<br /><em>conversation.</em></>}</h2>
          <p>{cn ? "席位有限，请立即报名。活动信息将保存在您的 WLHL 会员中心。" : "Seats are limited. Register now and we’ll keep your event details together in your WLHL member home."}</p>
          <div className="forum-detail-stack">
            <div><CalendarDays size={18} /><span><strong>{cn ? "2026年9月7日，星期一" : "Monday, September 7, 2026"}</strong></span></div>
            <div><Clock3 size={18} /><span><strong>{cn ? "下午 2:00–5:00" : "2:00–5:00 PM"}</strong></span></div>
            <div><MapPin size={18} /><span><strong>7361 Calhoun Place</strong>Rockville, Maryland 20855</span></div>
            <div><Mic2 size={18} /><span><strong>{cn ? "周典主持" : "Hosted by Zhou Dian"}</strong>{cn ? "美国中美联合商会主办" : "Hosted by the U.S.-China Chamber of Commerce"}</span></div>
          </div>
        </div>
        <div className="forum-form-card"><ForumRegistrationForm locale={locale} /></div>
      </section>
    </main>
  );
}

export default function ForumPage() {
  return <ForumPageContent />;
}
