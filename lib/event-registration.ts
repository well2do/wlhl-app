export function safeEventRegistrationUrl(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
  } catch {
    return "";
  }
}

export function readEventRegistrationFields(input: Record<string, unknown>) {
  const field = (key: string, max: number) => {
    const value = typeof input[key] === "string" ? input[key].trim() : "";
    if (value.length > max) throw new Error("报名链接或收费说明过长，请缩短后重试。");
    return value;
  };
  const registrationUrl = field("registrationUrl", 2048);
  if (registrationUrl && !safeEventRegistrationUrl(registrationUrl)) {
    throw new Error("报名链接必须是有效的 HTTPS 网址，且不能包含登录凭据。");
  }
  return {
    registrationUrl: safeEventRegistrationUrl(registrationUrl),
    feeDetails: field("feeDetails", 3000),
    feeDetailsCn: field("feeDetailsCn", 3000),
    paymentInstructions: field("paymentInstructions", 3000),
    paymentInstructionsCn: field("paymentInstructionsCn", 3000),
  };
}
