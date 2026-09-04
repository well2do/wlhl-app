import { AboutPage } from "@/components/about-page";

export const metadata = {
  title: "关于俱乐部",
  description: "了解美国中美联合商会的宗旨、专家团队、会员方案与主动健康理念。",
};

export default function ChineseAboutPage() {
  return <AboutPage locale="cn" />;
}
