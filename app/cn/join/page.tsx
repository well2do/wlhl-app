import { Check, HeartHandshake, Leaf, ShieldCheck } from "lucide-react";
import { JoinForm } from "@/components/join-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "申请加入俱乐部" };

export default function ChineseJoinPage() {
  return (
    <>
      <SiteHeader locale="cn" />
      <main className="join-page" lang="zh-CN">
        <section className="join-intro"><div className="join-intro-inner"><p className="eyebrow eyebrow-light">从这里开始成为会员</p><h1>您的下一个好习惯，<br />也许就是 <em>CAUCC。</em></h1><p>请简单介绍自己。我们会帮助您找到志同道合的伙伴、适合的活动和舒服的健康节奏。</p><div className="join-perks"><span><Check size={16} /> 温暖友善、尊重每个年龄阶段</span><span><Check size={16} /> 适合不同节奏与经验的活动</span><span><Check size={16} /> 提交申请无需付款</span></div><div className="join-art" aria-hidden="true"><Leaf size={170} /><HeartHandshake size={80} /></div></div></section>
        <section className="join-form-wrap"><div className="join-form-heading"><span className="step-chip">仅需 1 步</span><h2>让我们认识您。</h2><p>会员信息将严格保密，仅用于俱乐部运营。</p></div><JoinForm locale="cn" /><div className="privacy-note"><ShieldCheck size={18} /><span><strong>我们会妥善保护您的信息。</strong> 绝不会出售会员数据。</span></div></section>
      </main>
      <SiteFooter locale="cn" />
    </>
  );
}
