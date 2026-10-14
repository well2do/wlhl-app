export const defaultLandingPageContent = {
  brandName: "WLHL",
  brandTagline: "Washington Longevity Health Life Club",

  navAbout: "About",
  navEvents: "Events",
  navShop: "Club picks",
  navMember: "Member access",
  navJoin: "Join the club",

  heroEyebrow: "Washington Longevity Health Life Club · Welcome",
  heroTitleLine: "More life in",
  heroTitleAccent: "every year.",
  heroDescription: "We warmly welcome everyone who hopes to pursue longevity and grow younger at heart. Join the Washington Longevity Health Life Club — a platform to exchange ideas and grow together for a healthier life.",
  heroPrimaryButton: "Become a member",
  heroSecondaryButton: "Explore events",
  heroTrustTitle: "Growing stronger together",
  heroTrustText: "in the Washington community",
  heroAvatarOne: "JM",
  heroAvatarTwo: "AL",
  heroAvatarThree: "RB",
  heroAvatarFour: "+42",
  heroImageAlt: "A bright, growing wellness community",
  heroTopCardTitle: "Our club purpose",
  heroTopCardText: "Let’s grow older together—happily and healthily.",
  heroNextEventLabel: "Next gathering",
  heroNextEventFallback: "Coming soon",
  heroCaption: "Member practice: eat well, keep moving, sleep well.",

  announcementLabel: "Club news",

  introEyebrow: "Happy longevity. Proactive health.",
  introTitleLine: "Let’s grow older",
  introTitleAccent: "happily and healthily.",
  introDescription: "The club provides joyful guidance on food and lifestyle, wellness activity opportunities, and a longevity consultation platform — an exchange and growth space for healthier living.",
  introAboutButton: "Learn about the club",
  benefitOneTitle: "Goal one · Live to 100",
  benefitOneDescription: "Turn healthy habits into daily routines and walk steadily toward a century of life.",
  benefitTwoTitle: "Goal two · Live to 120",
  benefitTwoDescription: "With a science-based healthy lifestyle, continue gracefully toward 120 wonderful years.",
  benefitThreeTitle: "Goal three · Never age",
  benefitThreeDescription: "Keep exploring the possibilities of longevity and youthful aging—every chapter full of promise.",

  eventArtworkSmallText: "Move gently.",
  eventArtworkLargeText: "Live fully.",
  eventImageAlt: "Club members enjoying the featured event",
  eventEyebrow: "Up next at the club",
  eventPrimaryButton: "Reserve your spot",
  eventSecondaryButton: "See all upcoming events",

  shopEyebrow: "The wellness shelf",
  shopTitleLine: "Small things that support",
  shopTitleAccent: "better days.",
  shopDescription: "Thoughtfully selected by our community for simple, sustainable healthy habits.",
  paymentTitle: "Simple direct payment with Zelle",
  paymentConfiguredText: "Send to {{recipient}} at {{handle}}. Include your name and item in the memo. We’ll confirm every order directly.",
  paymentFallbackText: "Contact a club coordinator before sending payment. Your confirmed Zelle recipient and order total will be provided directly.",

  notificationEyebrow: "Never miss what’s next",
  notificationTitleLine: "Good things are",
  notificationTitleAccent: "worth showing up for.",
  notificationDescription: "Get a gentle heads-up when a new event, promotion, or club announcement is posted.",
  notificationButtonIdle: "Turn on notifications",
  notificationButtonLoading: "Setting up…",
  notificationButtonEnabled: "Notifications are on",
  notificationError: "Notifications aren’t available yet. You can still receive email updates.",
  notificationImageAlt: "A club notification preview",
  notificationPreviewTime: "9:41",
  notificationPreviewApp: "俱乐部 · 现在",
  notificationPreviewTitle: "Wellness walk tomorrow",
  notificationPreviewMessage: "We’ll meet at the Arboretum at 9 AM. See you there!",

  membershipEyebrow: "Your invitation is open",
  membershipTitleLine: "A healthier life.",
  membershipTitleAccent: "A fuller calendar.",
  membershipDescription: "Our standard: turn benchmarks into action, and live up to the standard. Enjoy wellness activities, longevity consultations, and a community that grows older—happily and healthily.",
  membershipBenefitOne: "Local events and workshops",
  membershipBenefitTwo: "Member product offers",
  membershipBenefitThree: "Personalized event history",
  membershipBenefitFour: "Club news and reminders",
  membershipButton: "Start your membership",
  membershipNote: "Our standard: turn benchmarks into action. Applications are free. Membership fees are confirmed before payment.",
  membershipImageAlt: "Members enjoying a healthy life together",

  footerDescription: "A non-profit company–run Washington Longevity Health Life Club, operating independently under the guidance of the Chamber of Commerce, making healthy, connected living easier at every age.",
  footerExploreLabel: "Explore",
  footerEvents: "Events",
  footerMembership: "Membership",
  footerShop: "Club picks",
  footerConnectLabel: "Connect",
  contactEmail: "",
  contactPhone: "",
  zelleHandle: "",
  zelleRecipient: "",
  footerContactFallback: "Contact details coming soon",
  footerMemberPortal: "Member portal",
  footerCopyright: "Washington Longevity Health Life Club",
  footerAdmin: "Club administration",
} as const satisfies Record<string, string>;

export type LandingPageContentKey = keyof typeof defaultLandingPageContent;
export type LandingPageContent = { [Key in LandingPageContentKey]: string };
export type LandingPageLocale = "en" | "cn";

export const defaultChineseLandingPageContent: LandingPageContent = {
  brandName: "华盛顿长寿康养俱乐部",
  brandTagline: "快乐长寿 · 主动健康",

  navAbout: "关于我们",
  navEvents: "活动",
  navShop: "康养优选",
  navMember: "会员中心",
  navJoin: "加入俱乐部",

  heroEyebrow: "华盛顿长寿康养俱乐部 · 热忱欢迎您",
  heroTitleLine: "让每一年",
  heroTitleAccent: "都更有生命力。",
  heroDescription: "我们热忱欢迎所有希望追求长寿、渴望实现逆龄生长的朋友们！诚挚邀请您参加华盛顿长寿康养俱乐部，为追求健康生活的您提供一个交流与成长的平台。",
  heroPrimaryButton: "申请成为会员",
  heroSecondaryButton: "查看活动",
  heroTrustTitle: "一起成长，更有力量",
  heroTrustText: "扎根华盛顿社区",
  heroAvatarOne: "健",
  heroAvatarTwo: "康",
  heroAvatarThree: "友",
  heroAvatarFour: "+42",
  heroImageAlt: "充满活力的健康社区",
  heroTopCardTitle: "俱乐部宗旨",
  heroTopCardText: "让我们一起快乐健康地慢慢变老！",
  heroNextEventLabel: "下一场活动",
  heroNextEventFallback: "即将公布",
  heroCaption: "会员任务：管好嘴，迈开腿，睡好觉。",

  announcementLabel: "俱乐部公告",

  introEyebrow: "快乐长寿，主动健康",
  introTitleLine: "让我们一起快乐健康地",
  introTitleAccent: "慢慢变老！",
  introDescription: "华盛顿长寿康养俱乐部提供吃喝玩乐的健康指导、康养活动的机会和长寿咨询服务平台，为追求健康生活的您搭建一个交流与成长的平台。",
  introAboutButton: "进一步了解俱乐部",
  benefitOneTitle: "小目标 · 长命百岁",
  benefitOneDescription: "把健康习惯融入日常，稳稳迈向百岁人生，让长寿从愿景变成每一天的行动。",
  benefitTwoTitle: "中目标 · 一百廿岁",
  benefitTwoDescription: "在科学健康生活方式的陪伴下，向一百二十岁的美好人生继续从容前行。",
  benefitThreeTitle: "大目标 · 长生不老",
  benefitThreeDescription: "持续探索长寿与逆龄生长的可能，让人生的每一程都充满期待与精彩。",

  eventArtworkSmallText: "轻松运动。",
  eventArtworkLargeText: "活力生活。",
  eventImageAlt: "俱乐部会员参加精选活动",
  eventEyebrow: "俱乐部下一场活动",
  eventPrimaryButton: "预约席位",
  eventSecondaryButton: "查看全部活动",

  shopEyebrow: "健康生活精选",
  shopTitleLine: "小小选择，成就",
  shopTitleAccent: "更好的每一天。",
  shopDescription: "由社区精心挑选，帮助您建立简单、可持续的健康习惯。",
  paymentTitle: "使用 Zelle 直接付款，简单方便",
  paymentConfiguredText: "请汇款至 {{recipient}}，账号 {{handle}}，并在备注中填写姓名与产品。俱乐部会直接确认每一笔订单。",
  paymentFallbackText: "付款前请先联系俱乐部负责人。我们会直接提供已确认的 Zelle 收款人和订单总额。",

  notificationEyebrow: "不错过每一次精彩",
  notificationTitleLine: "好活动，",
  notificationTitleAccent: "值得准时参加。",
  notificationDescription: "新活动、优惠或俱乐部公告发布时，及时收到温馨提醒。",
  notificationButtonIdle: "开启通知",
  notificationButtonLoading: "正在设置…",
  notificationButtonEnabled: "通知已开启",
  notificationError: "暂时无法启用通知，您仍可接收电子邮件更新。",
  notificationImageAlt: "俱乐部通知预览",
  notificationPreviewTime: "9:41",
  notificationPreviewApp: "华盛顿长寿康养俱乐部 · 刚刚",
  notificationPreviewTitle: "明天一起健康步行",
  notificationPreviewMessage: "上午 9 点在植物园集合，期待见到您！",

  membershipEyebrow: "诚邀您的加入",
  membershipTitleLine: "更健康的生活，",
  membershipTitleAccent: "更丰富的日程。",
  membershipDescription: "俱乐部以“对标行动，达标生活”为要求，为您提供康养活动机会与长寿咨询服务，陪您一起快乐健康地慢慢变老。",
  membershipBenefitOne: "本地活动与健康讲座",
  membershipBenefitTwo: "会员专属产品优惠",
  membershipBenefitThree: "个人活动参与记录",
  membershipBenefitFour: "俱乐部新闻与提醒",
  membershipButton: "开始会员申请",
  membershipNote: "俱乐部要求：对标行动，达标生活。申请免费，付款前会向您确认会员费用。",
  membershipImageAlt: "会员一起享受健康生活",

  footerDescription: "非盈利性公司运营的华盛顿长寿康养俱乐部，在商会指导下相对独立运营，为每个年龄阶段提供更健康、更有活力、更有连接的康养生活。",
  footerExploreLabel: "探索",
  footerEvents: "活动",
  footerMembership: "会员申请",
  footerShop: "康养优选",
  footerConnectLabel: "联系我们",
  contactEmail: "",
  contactPhone: "",
  zelleHandle: "",
  zelleRecipient: "",
  footerContactFallback: "联系信息即将公布",
  footerMemberPortal: "会员中心",
  footerCopyright: "华盛顿长寿康养俱乐部",
  footerAdmin: "俱乐部管理",
};

export const landingPageDefaults: Record<LandingPageLocale, LandingPageContent> = {
  en: defaultLandingPageContent,
  cn: defaultChineseLandingPageContent,
};

export type LandingPageField = {
  key: LandingPageContentKey;
  label: string;
  multiline?: boolean;
  note?: string;
};

export type LandingPageFieldGroup = {
  title: string;
  description: string;
  fields: LandingPageField[];
};

export const landingPageFieldGroups: LandingPageFieldGroup[] = [
  {
    title: "Brand and navigation",
    description: "Text shown in the header and brand lockup on the home page.",
    fields: [
      { key: "brandName", label: "Brand name" },
      { key: "brandTagline", label: "Brand tagline" },
      { key: "navAbout", label: "About link" },
      { key: "navEvents", label: "Events link" },
      { key: "navShop", label: "Shop link" },
      { key: "navMember", label: "Member link" },
      { key: "navJoin", label: "Join button" },
    ],
  },
  {
    title: "Hero",
    description: "The first message and call to action visitors see.",
    fields: [
      { key: "heroEyebrow", label: "Eyebrow" },
      { key: "heroTitleLine", label: "Headline — first line" },
      { key: "heroTitleAccent", label: "Headline — accent line" },
      { key: "heroDescription", label: "Description", multiline: true },
      { key: "heroPrimaryButton", label: "Primary button" },
      { key: "heroSecondaryButton", label: "Secondary button" },
      { key: "heroTrustTitle", label: "Community proof heading" },
      { key: "heroTrustText", label: "Community proof detail" },
      { key: "heroAvatarOne", label: "Avatar 1 initials" },
      { key: "heroAvatarTwo", label: "Avatar 2 initials" },
      { key: "heroAvatarThree", label: "Avatar 3 initials" },
      { key: "heroAvatarFour", label: "Avatar 4 text" },
      { key: "heroImageAlt", label: "Uploaded image description", note: "Used by screen readers." },
      { key: "heroTopCardTitle", label: "Wellness card heading" },
      { key: "heroTopCardText", label: "Wellness card detail" },
      { key: "heroNextEventLabel", label: "Next event label" },
      { key: "heroNextEventFallback", label: "No-event fallback" },
      { key: "heroCaption", label: "Image caption" },
    ],
  },
  {
    title: "News and introduction",
    description: "Announcement strip and the three club benefit cards.",
    fields: [
      { key: "announcementLabel", label: "News strip label" },
      { key: "introEyebrow", label: "Introduction eyebrow" },
      { key: "introTitleLine", label: "Introduction headline — first line" },
      { key: "introTitleAccent", label: "Introduction headline — accent line" },
      { key: "introDescription", label: "Introduction description", multiline: true },
      { key: "introAboutButton", label: "About page button" },
      { key: "benefitOneTitle", label: "Benefit 1 title" },
      { key: "benefitOneDescription", label: "Benefit 1 description", multiline: true },
      { key: "benefitTwoTitle", label: "Benefit 2 title" },
      { key: "benefitTwoDescription", label: "Benefit 2 description", multiline: true },
      { key: "benefitThreeTitle", label: "Benefit 3 title" },
      { key: "benefitThreeDescription", label: "Benefit 3 description", multiline: true },
    ],
  },
  {
    title: "Featured event and shop",
    description: "Labels around the live event and product data managed below.",
    fields: [
      { key: "eventArtworkSmallText", label: "Event artwork small text" },
      { key: "eventArtworkLargeText", label: "Event artwork large text" },
      { key: "eventImageAlt", label: "Uploaded event image description", note: "Used by screen readers." },
      { key: "eventEyebrow", label: "Event eyebrow" },
      { key: "eventPrimaryButton", label: "Reserve button" },
      { key: "eventSecondaryButton", label: "All events link" },
      { key: "shopEyebrow", label: "Shop eyebrow" },
      { key: "shopTitleLine", label: "Shop headline — first line" },
      { key: "shopTitleAccent", label: "Shop headline — accent line" },
      { key: "shopDescription", label: "Shop description", multiline: true },
      { key: "paymentTitle", label: "Payment heading" },
      { key: "paymentConfiguredText", label: "Payment instructions", multiline: true, note: "Keep {{recipient}} and {{handle}} where those values should appear." },
      { key: "paymentFallbackText", label: "Payment fallback", multiline: true },
    ],
  },
  {
    title: "Notifications",
    description: "Browser notification callout and its phone preview.",
    fields: [
      { key: "notificationEyebrow", label: "Eyebrow" },
      { key: "notificationTitleLine", label: "Headline — first line" },
      { key: "notificationTitleAccent", label: "Headline — accent line" },
      { key: "notificationDescription", label: "Description", multiline: true },
      { key: "notificationButtonIdle", label: "Notification button" },
      { key: "notificationButtonLoading", label: "Loading state" },
      { key: "notificationButtonEnabled", label: "Enabled state" },
      { key: "notificationError", label: "Unavailable message", multiline: true },
      { key: "notificationImageAlt", label: "Uploaded image description", note: "Used by screen readers." },
      { key: "notificationPreviewTime", label: "Preview time" },
      { key: "notificationPreviewApp", label: "Preview app line" },
      { key: "notificationPreviewTitle", label: "Preview title" },
      { key: "notificationPreviewMessage", label: "Preview message", multiline: true },
    ],
  },
  {
    title: "Membership call to action",
    description: "The final invitation before the footer.",
    fields: [
      { key: "membershipEyebrow", label: "Eyebrow" },
      { key: "membershipTitleLine", label: "Headline — first line" },
      { key: "membershipTitleAccent", label: "Headline — accent line" },
      { key: "membershipDescription", label: "Description", multiline: true },
      { key: "membershipBenefitOne", label: "Benefit 1" },
      { key: "membershipBenefitTwo", label: "Benefit 2" },
      { key: "membershipBenefitThree", label: "Benefit 3" },
      { key: "membershipBenefitFour", label: "Benefit 4" },
      { key: "membershipButton", label: "Join button" },
      { key: "membershipNote", label: "Fine print", multiline: true },
      { key: "membershipImageAlt", label: "Uploaded image description", note: "Used by screen readers." },
    ],
  },
  {
    title: "Footer",
    description: "Footer description, headings, and link labels.",
    fields: [
      { key: "footerDescription", label: "Club description", multiline: true },
      { key: "footerExploreLabel", label: "Explore heading" },
      { key: "footerEvents", label: "Events link" },
      { key: "footerMembership", label: "Membership link" },
      { key: "footerShop", label: "Shop link" },
      { key: "footerConnectLabel", label: "Connect heading" },
      { key: "contactEmail", label: "Contact email", note: "Leave empty to use the configured club email." },
      { key: "contactPhone", label: "Contact phone", note: "Leave empty to use the configured club phone." },
      { key: "zelleHandle", label: "Zelle payment handle", note: "Used together with the recipient name on the home page." },
      { key: "zelleRecipient", label: "Zelle recipient name" },
      { key: "footerContactFallback", label: "Missing contact fallback" },
      { key: "footerMemberPortal", label: "Member portal link" },
      { key: "footerCopyright", label: "Copyright organization" },
      { key: "footerAdmin", label: "Administration link" },
    ],
  },
];

export const landingImageSlots = ["logo", "hero", "notification", "membership", "forum-poster"] as const;

export function isAllowedLandingImageSlot(slot: string) {
  return landingImageSlots.includes(slot as (typeof landingImageSlots)[number])
    || /^(event|product)-[A-Za-z0-9-]{1,100}$/.test(slot);
}

export function landingImageUrl(slot: string, version?: string) {
  const suffix = version ? `?v=${encodeURIComponent(version)}` : "";
  return `/api/landing-page-assets/${encodeURIComponent(slot)}${suffix}`;
}

export function fillLandingTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
    template,
  );
}
