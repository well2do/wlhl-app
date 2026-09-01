export const defaultLandingPageContent = {
  brandName: "WLHL",
  brandTagline: "Washington Longevity Health Life Club",

  navAbout: "About",
  navEvents: "Events",
  navShop: "Wellness shop",
  navMember: "Member access",
  navJoin: "Join the club",

  heroEyebrow: "Washington, D.C.’s healthy life community",
  heroTitleLine: "More life in",
  heroTitleAccent: "every year.",
  heroDescription: "A welcoming club for people who want to stay active, feel connected, and make healthy living something to look forward to.",
  heroPrimaryButton: "Become a member",
  heroSecondaryButton: "Explore events",
  heroTrustTitle: "Growing stronger together",
  heroTrustText: "in the Washington community",
  heroAvatarOne: "JM",
  heroAvatarTwo: "AL",
  heroAvatarThree: "RB",
  heroAvatarFour: "+42",
  heroImageAlt: "A bright, growing wellness community",
  heroTopCardTitle: "Whole-person wellness",
  heroTopCardText: "Movement · food · connection",
  heroNextEventLabel: "Next gathering",
  heroNextEventFallback: "Coming soon",
  heroCaption: "Wellness looks good on you.",

  announcementLabel: "Club news",

  introEyebrow: "Well-being with good company",
  introTitleLine: "This chapter can be your",
  introTitleAccent: "healthiest one yet.",
  introDescription: "WLHL brings together the people, practices, and encouragement that make a vibrant life feel possible.",
  benefitOneTitle: "People who get you",
  benefitOneDescription: "Meet neighbors who believe that feeling better is easier—and more joyful—together.",
  benefitTwoTitle: "Practical wellness",
  benefitTwoDescription: "Friendly guidance on movement, nutrition, sleep, and healthy aging you can use every day.",
  benefitThreeTitle: "A reason to show up",
  benefitThreeDescription: "Events, workshops, walks, and celebrations that keep connection on your calendar.",

  eventArtworkSmallText: "Move gently.",
  eventArtworkLargeText: "Live fully.",
  eventImageAlt: "Club members enjoying the featured event",
  eventEyebrow: "Up next at WLHL",
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
  notificationPreviewApp: "WLHL · now",
  notificationPreviewTitle: "Wellness walk tomorrow",
  notificationPreviewMessage: "We’ll meet at the Arboretum at 9 AM. See you there!",

  membershipEyebrow: "Your invitation is open",
  membershipTitleLine: "A healthier life.",
  membershipTitleAccent: "A fuller calendar.",
  membershipDescription: "Join a community that helps you keep both.",
  membershipBenefitOne: "Local events and workshops",
  membershipBenefitTwo: "Member product offers",
  membershipBenefitThree: "Personalized event history",
  membershipBenefitFour: "Club news and reminders",
  membershipButton: "Start your membership",
  membershipNote: "Applications are free. Membership fees are confirmed before payment.",
  membershipImageAlt: "Members enjoying a healthy life together",

  footerDescription: "A welcoming Washington, D.C. community making healthy, connected living easier at every age.",
  footerExploreLabel: "Explore",
  footerEvents: "Events",
  footerMembership: "Membership",
  footerShop: "Wellness shop",
  footerConnectLabel: "Connect",
  footerContactFallback: "Contact details coming soon",
  footerMemberPortal: "Member portal",
  footerCopyright: "Washington Longevity Healthy Life Club",
  footerAdmin: "Club administration",
} as const satisfies Record<string, string>;

export type LandingPageContentKey = keyof typeof defaultLandingPageContent;
export type LandingPageContent = { [Key in LandingPageContentKey]: string };

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
      { key: "footerContactFallback", label: "Missing contact fallback" },
      { key: "footerMemberPortal", label: "Member portal link" },
      { key: "footerCopyright", label: "Copyright organization" },
      { key: "footerAdmin", label: "Administration link" },
    ],
  },
];

export const landingImageSlots = ["logo", "hero", "notification", "membership"] as const;

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
