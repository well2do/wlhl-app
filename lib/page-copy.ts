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

export function validatePageCopy(page: EditablePage, locale: PageLocale, input: unknown): PageCopy {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid page content.");
  const fields = pageCopyFields(page, locale);
  const output: PageCopy = {};
  for (const [key, value] of Object.entries(input)) {
    if (!fields.includes(key) || typeof value !== "string" || value.length > 4000) throw new Error("Invalid page field.");
    if (/^https:\/\//.test(key)) {
      try { if (new URL(value).protocol !== "https:") throw new Error(); }
      catch { throw new Error("Registration links must use a valid HTTPS address."); }
    }
    output[key] = value;
  }
  return output;
}
