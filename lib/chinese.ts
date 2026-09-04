import type { Announcement, ClubEvent, Product } from "./types";

const eventCopy: Record<string, Partial<ClubEvent>> = {
  "forum-2026-09-07": {
    title: "AI 时代健康与财富传承论坛",
    description: "中英双语社区论坛，探讨 AI 赋能健康长寿、健康管理、企业发展、信托遗嘱与家庭财富传承。",
    category: "专题论坛",
  },
};

const eventByTitle: Record<string, Partial<ClubEvent>> = {
  "Morning Mobility & Tai Chi": { title: "晨间关节活动与太极", description: "温和而充满活力的课程，帮助提升平衡、柔韧性与日常力量。", category: "运动健身" },
  "Longevity Nutrition Workshop": { title: "长寿营养工作坊", description: "学习如何把色彩丰富、有益心脏的健康餐食轻松融入日常生活。", category: "营养健康" },
  "Community Wellness Walk": { title: "社区健康步行", description: "与邻里一起，以轻松节奏完成两英里的花园导览步行。", category: "社区活动" },
};

const announcementByTitle: Record<string, Pick<Announcement, "title" | "message">> = {
  "September 7: AI, Health & Wealth Legacy Forum": { title: "9月7日：AI 时代健康与财富传承论坛", message: "洛克维尔中英双语论坛现已开放报名，主题涵盖健康长寿、AI、企业发展与家庭财富规划。" },
  "A healthier season starts together": { title: "一起开启更健康的新季节", message: "秋季活动日历现已开放，欢迎预约运动、营养和社区健康活动。" },
  "Member wellness bundle": { title: "会员健康生活组合优惠", message: "本月会员购买养生茶、健康手帐和阻力带组合可优惠 12 美元。" },
};

const productByName: Record<string, Partial<Product>> = {
  "Daily Vitality Tea": { name: "每日活力养生茶", description: "无咖啡因草本配方，融合姜、洛神花与温暖香料。", category: "健康生活", badge: "会员喜爱" },
  "Strong for Life Bands": { name: "健康力量阻力带", description: "三种阻力等级，适合在家安全、循序渐进地锻炼力量。", category: "运动健身", badge: "新品" },
  "90-Day Wellness Journal": { name: "90 天健康生活手帐", description: "通过简洁的每日记录，关注运动、饮水、睡眠与感恩。", category: "正念生活" },
};

export function chineseEvent(event: ClubEvent): ClubEvent {
  const fallback = { ...(eventByTitle[event.title] || {}), ...(eventCopy[event.id] || {}) };
  return {
    ...event,
    ...fallback,
    title: event.title_cn || fallback.title || event.title,
    description: event.description_cn || fallback.description || event.description,
    location: event.location_cn || fallback.location || event.location,
    category: event.category_cn || fallback.category || event.category,
  };
}

export function chineseEventTitle(title: string) {
  if (title === "AI, Health & Wealth Legacy Forum") return "AI 时代健康与财富传承论坛";
  return String(eventByTitle[title]?.title || title);
}

export function chineseAnnouncement(item: Announcement): Announcement {
  const fallback = announcementByTitle[item.title] || {};
  return {
    ...item,
    ...fallback,
    title: item.title_cn || fallback.title || item.title,
    message: item.message_cn || fallback.message || item.message,
  };
}

export function chineseProduct(product: Product): Product {
  const fallback = productByName[product.name] || {};
  return {
    ...product,
    ...fallback,
    name: product.name_cn || fallback.name || product.name,
    description: product.description_cn || fallback.description || product.description,
    category: product.category_cn || fallback.category || product.category,
    badge: product.badge_cn || fallback.badge || product.badge,
  };
}

export function formatChineseEventDate(value: string, includeYear = false) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "long",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  }).format(new Date(value));
}

export function formatChineseEventTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
