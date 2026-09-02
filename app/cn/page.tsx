import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  HeartHandshake,
  Leaf,
  MapPin,
  MoveUpRight,
  Quote,
  Salad,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import { NotificationButton } from "@/components/notification-button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { chineseAnnouncement, chineseEvent, chineseProduct, formatChineseEventDate, formatChineseEventTime } from "@/lib/chinese";
import { getAnnouncements, getEvents, getProducts } from "@/lib/db";
import { formatCurrency } from "@/lib/format";

export const metadata = {
  title: "华盛顿健康长寿生活俱乐部",
  description: "WLHL 华盛顿健康长寿生活俱乐部中文网站：会员、健康活动、社区公告及健康产品。",
};

const benefits = [
  { icon: Users, title: "志同道合的伙伴", copy: "认识同样重视健康、活力与社区连接的朋友，让健康生活更轻松、更快乐。" },
  { icon: Salad, title: "实用的健康知识", copy: "获得运动、营养、睡眠和健康长寿方面友善、可实践的日常建议。" },
  { icon: HeartHandshake, title: "丰富的社区活动", copy: "通过讲座、工作坊、步行与庆祝活动，把健康和连接放进您的日程。" },
];

export default async function ChineseHomePage() {
  const [rawEvents, rawAnnouncements, rawProducts] = await Promise.all([getEvents(), getAnnouncements(3), getProducts()]);
  const events = rawEvents.map(chineseEvent);
  const announcements = rawAnnouncements.map(chineseAnnouncement);
  const products = rawProducts.map(chineseProduct);
  const nextEvent = events[0];
  const zelleHandle = process.env.NEXT_PUBLIC_ZELLE_HANDLE;
  const zelleRecipient = process.env.NEXT_PUBLIC_ZELLE_RECIPIENT;
  const clubEmail = process.env.NEXT_PUBLIC_CLUB_EMAIL;

  return (
    <>
      <SiteHeader locale="cn" />
      <main lang="zh-CN">
        <section className="hero">
          <div className="hero-orbit hero-orbit-one" /><div className="hero-orbit hero-orbit-two" />
          <div className="hero-content">
            <div className="hero-copy">
              <p className="eyebrow eyebrow-light"><Sparkles size={14} /> 华盛顿地区健康生活社区</p>
              <h1>让每一年<br /><em>都更有生命力。</em></h1>
              <p className="hero-lede">一个温暖友善的俱乐部，陪伴您保持活力、连接社区，让健康生活成为值得期待的日常。</p>
              <div className="hero-actions">
                <Link className="button button-coral" href="/cn/join">申请成为会员 <ArrowRight size={17} /></Link>
                <Link className="button button-ghost-light" href="/cn/events">查看活动</Link>
              </div>
              <div className="hero-trust"><div className="avatar-stack" aria-hidden="true"><span>健</span><span>康</span><span>友</span><span>+42</span></div><p><strong>一起成长，更有力量</strong><br />扎根华盛顿社区</p></div>
            </div>
            <div className="hero-visual" aria-label="充满活力的健康社区">
              <div className="sun-disc"><span /></div><div className="botanical botanical-left"><Leaf size={90} /></div><div className="botanical botanical-right"><Leaf size={130} /></div>
              <div className="hero-card hero-card-top"><span className="mini-icon"><ShieldCheck size={18} /></span><div><strong>全方位健康生活</strong><small>运动 · 营养 · 社区连接</small></div></div>
              <div className="hero-card hero-card-bottom"><span className="pulse-dot" /><div><strong>下一场活动</strong><small>{nextEvent ? formatChineseEventDate(nextEvent.event_date) : "即将公布"}</small></div></div>
              <div className="hero-figure"><div className="figure-head" /><div className="figure-body" /><div className="figure-arm figure-arm-left" /><div className="figure-arm figure-arm-right" /></div>
              <span className="hero-caption">健康，让生活更美好。</span>
            </div>
          </div>
          <div className="hero-wave" />
        </section>

        <section className="announcement-strip" aria-label="俱乐部最新公告">
          <div className="announcement-label"><span className="live-dot" /> 俱乐部公告</div>
          <div className="announcement-items">{announcements.slice(0, 2).map((item) => <p key={item.id}><strong>{item.title}</strong><span>{item.message}</span></p>)}</div>
        </section>

        <section className="section section-intro" id="about">
          <div className="section-heading centered-heading"><p className="eyebrow">健康生活，良友相伴</p><h2>人生这一程，可以成为<br /><em>最健康、最精彩的一程。</em></h2><p>WLHL 汇聚伙伴、实践方法与相互鼓励，让充满活力的生活触手可及。</p><Link className="about-intro-link" href="/cn/about">进一步了解俱乐部 <ArrowRight size={15} /></Link></div>
          <div className="benefit-grid">{benefits.map(({ icon: Icon, title, copy }, index) => <article className="benefit-card" key={title}><span className={`benefit-icon benefit-${index + 1}`}><Icon size={24} /></span><span className="card-number">0{index + 1}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
        </section>

        {nextEvent && <section className="section event-feature-section"><div className="event-feature">
          <div className="event-art"><div className="event-art-ring" /><div className="event-art-leaf"><Leaf size={130} /></div><div className="event-art-copy"><small>轻松运动。</small><strong>活力生活。</strong></div></div>
          <div className="event-feature-copy"><p className="eyebrow">WLHL 下一场活动</p><h2>{nextEvent.title}</h2><p>{nextEvent.description}</p><div className="event-meta-grid"><span><CalendarDays size={19} /><strong>{formatChineseEventDate(nextEvent.event_date, true)}</strong></span><span><Clock3 size={19} /><strong>{formatChineseEventTime(nextEvent.event_date)}</strong></span><span className="wide-meta"><MapPin size={19} /><strong>{nextEvent.location}</strong></span></div><Link className="button button-dark" href={nextEvent.id === "forum-2026-09-07" ? "/cn/events/ai-health-wealth-forum" : "/cn/member"}>预约席位 <ArrowRight size={17} /></Link><Link className="under-link" href="/cn/events">查看全部活动</Link></div>
        </div></section>}

        <section className="section shop-section" id="shop">
          <div className="section-heading split-heading"><div><p className="eyebrow">健康生活精选</p><h2>小小选择，成就<br /><em>更好的每一天。</em></h2></div><p>由社区精心挑选，帮助您建立简单、可持续的健康习惯。</p></div>
          <div className="product-grid">{products.slice(0, 3).map((product, index) => <article className="product-card" key={product.id}><div className={`product-art product-art-${index + 1}`}>{index === 0 ? <Leaf size={70} /> : index === 1 ? <MoveUpRight size={66} /> : <Quote size={62} />}{product.badge && <span className="product-badge">{product.badge}</span>}</div><div className="product-copy"><small>{product.category}</small><h3>{product.name}</h3><p>{product.description}</p><div><strong>{formatCurrency(Number(product.price))}</strong><a href={clubEmail ? `mailto:${clubEmail}?subject=${encodeURIComponent(`WLHL 产品咨询：${product.name}`)}` : "/cn/join"} aria-label={`咨询购买${product.name}`}><ShoppingBag size={17} /></a></div></div></article>)}</div>
          <div className="payment-note"><ShieldCheck size={22} /><div><strong>使用 Zelle 直接付款，简单方便</strong>{zelleHandle && zelleRecipient ? <span>请汇款至 <b>{zelleRecipient}</b>，账号 <b>{zelleHandle}</b>，并在备注中填写姓名与产品。俱乐部会直接确认每一笔订单。</span> : <span>付款前请先联系俱乐部负责人。我们会直接提供已确认的 Zelle 收款人和订单总额。</span>}</div></div>
        </section>

        <section className="notification-section"><div className="notification-copy"><span className="eyebrow eyebrow-light">不错过每一次精彩</span><h2>好活动，<br /><em>值得准时参加。</em></h2><p>新活动、优惠或俱乐部公告发布时，及时收到温馨提醒。</p><NotificationButton publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY} locale="cn" /></div><div className="phone-preview" aria-hidden="true"><div className="phone-speaker" /><div className="phone-time">9:41</div><div className="phone-leaf"><Leaf size={88} /></div><div className="phone-alert"><span className="brand-mark"><Leaf size={14} /></span><div><small>WLHL · 刚刚</small><strong>明天一起健康步行</strong><p>上午 9 点在植物园集合，期待见到您！</p></div></div></div></section>

        <section className="section membership-cta"><div className="membership-card"><div><p className="eyebrow eyebrow-light">诚邀您的加入</p><h2>更健康的生活，<br /><em>更丰富的日程。</em></h2><p>加入一个帮助您同时拥有两者的社区。</p></div><div className="membership-details"><p><Check size={17} /> 本地活动与健康讲座</p><p><Check size={17} /> 会员专属产品优惠</p><p><Check size={17} /> 个人活动参与记录</p><p><Check size={17} /> 俱乐部新闻与提醒</p><Link className="button button-coral button-full" href="/cn/join">开始会员申请 <ArrowRight size={17} /></Link><small>申请免费。付款前会向您确认会员费用。</small></div></div></section>
      </main>
      <SiteFooter locale="cn" />
    </>
  );
}
