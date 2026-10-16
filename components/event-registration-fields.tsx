import type { ClubEvent } from "@/lib/types";

export function EventRegistrationFields({ event, locale = "en", includeLink = true }: {
  event?: Partial<ClubEvent> | null;
  locale?: "en" | "cn";
  includeLink?: boolean;
}) {
  const cn = locale === "cn";
  return <>
    {includeLink && <label>{cn ? "报名登记链接（选填）" : "Registration form URL (optional)"}
      <input name="registrationUrl" type="url" maxLength={2048} placeholder="https://…" defaultValue={event?.registration_url || ""} />
      <small>{cn ? "填写后，报名按钮将打开此表单；报名记录保存在该表单中。留空则使用会员中心报名。" : "The registration button opens this form, which stores the signups. Leave blank to use member portal registration."}</small>
    </label>}
    <label>{cn ? "收费标准（选填，每项一行）" : "Event fees (optional, one item per line)"}
      <textarea name={cn ? "feeDetailsCn" : "feeDetails"} rows={4} maxLength={3000} defaultValue={(cn ? event?.fee_details_cn : event?.fee_details) || ""} />
    </label>
    <label>{cn ? "收费方法 / 付款说明（选填）" : "Payment methods and instructions (optional)"}
      <textarea name={cn ? "paymentInstructionsCn" : "paymentInstructions"} rows={3} maxLength={3000} defaultValue={(cn ? event?.payment_instructions_cn : event?.payment_instructions) || ""} />
      <small>{cn ? "填写付款方式、收款地址及现场支付说明。" : "Include the payment method, recipient and any on-site payment instructions."}</small>
    </label>
  </>;
}
