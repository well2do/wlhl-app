import defaults from "./page-copy-defaults.json";

export type PageLocale = "en" | "cn";
export type PageCopy = Record<string, string>;
export type EditablePage = keyof typeof defaults;

export const editablePages: { id: EditablePage; label: string; path: string; records?: string }[] = [
  { id: "about", label: "About the club", path: "/about", records: "/admin?view=experts" },
  { id: "events", label: "Events", path: "/events", records: "/admin/landing-page-editor#live-content" },
  { id: "join", label: "Membership application", path: "/join" },
  { id: "member", label: "Member portal", path: "/member", records: "/admin?view=members" },
  { id: "shop", label: "Shop, product and checkout pages", path: "/shop", records: "/admin/landing-page-editor#live-content" },
  { id: "forum", label: "Forum and registration", path: "/events/ai-health-wealth-forum", records: "/admin/landing-page-editor#images" },
];

export function isEditablePage(value: string): value is EditablePage {
  return editablePages.some((page) => page.id === value);
}

export function pageCopyFields(page: EditablePage, locale: PageLocale): readonly string[] {
  return defaults[page][locale];
}

export function createCopy(copy: PageCopy) {
  return (original: string): string => Object.hasOwn(copy, original) ? copy[original] : original;
}

type Translated<T> = T extends string ? string : T extends readonly (infer U)[] ? Translated<U>[] : { [K in keyof T]: Translated<T[K]> };

export function translateCopy<T>(value: T, copy: PageCopy): Translated<T> {
  if (typeof value === "string") return createCopy(copy)(value) as Translated<T>;
  if (Array.isArray(value)) return value.map((item) => translateCopy(item, copy)) as Translated<T>;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, translateCopy(item, copy)])) as Translated<T>;
  }
  return value as Translated<T>;
}

const registrationCopyAliases: Record<string, string> = {
  "Save your spot.": "Event registration",
  "Members can reserve from their personal portal. New here? Join the club in just a few minutes.": "Open an event to view fees, payment methods and registration details.",
  "预约您的席位。": "报名登记",
  "会员可以通过个人会员中心预约。第一次来到这里？几分钟即可申请加入俱乐部。": "打开活动详情查看费用和付款方式，并完成报名登记。",
  "Events reserved": "Registered events",
  "Reserve": "Register",
  "Reserve one above and it’ll appear here.": "Register above to see your member portal registrations here.",
  "已预约活动": "已报名活动",
  "预约": "报名登记",
  "在上方预约活动后，记录会显示在这里。": "完成活动报名登记后，可在这里查看站内报名记录。",
  "Reserve your seat": "Registration",
  "预约席位": "报名登记"
};

export function validatePageCopy(page: EditablePage, locale: PageLocale, input: unknown): PageCopy {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid page content.");
  const fields = pageCopyFields(page, locale);
  const output: PageCopy = {};
  for (const [storedKey, value] of Object.entries(input)) {
    const key = registrationCopyAliases[storedKey] || storedKey;
    if (!fields.includes(key) || typeof value !== "string" || value.length > 4000) throw new Error("Invalid page field.");
    if (/^https:\/\//.test(key)) {
      try { if (new URL(value).protocol !== "https:") throw new Error(); }
      catch { throw new Error("Registration links must use a valid HTTPS address."); }
    }
    if (storedKey !== key && Object.hasOwn(input, key)) continue;
    output[key] = value === storedKey ? key : value;
  }
  return output;
}
