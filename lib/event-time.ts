export function easternTimeInput(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((part) => part.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function easternTimeToIso(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error("请填写完整日期和时间");
  const target = Date.parse(`${value}:00Z`);
  if (!Number.isFinite(target)) throw new Error("日期或时间无效");
  let instant = target;
  for (let i = 0; i < 3; i++) {
    const shown = Date.parse(`${easternTimeInput(new Date(instant).toISOString())}:00Z`);
    instant += target - shown;
  }
  const iso = new Date(instant).toISOString();
  if (easternTimeInput(iso) !== value) throw new Error("该时间不存在，请检查夏令时转换日期");
  return iso;
}

export function eventHref(id: string, locale: "en" | "cn" = "en") {
  return `${locale === "cn" ? "/cn" : ""}/events/${id === "forum-2026-09-07" ? "ai-health-wealth-forum" : encodeURIComponent(id)}`;
}

export function isUpcomingEvent(event: { status: string; event_date: string; date_precision?: string }, now = new Date()) {
  return event.status === 'upcoming' && (event.date_precision === 'day'
    ? easternTimeInput(event.event_date).slice(0, 10) >= easternTimeInput(now.toISOString()).slice(0, 10)
    : new Date(event.event_date).getTime() > now.getTime());
}
