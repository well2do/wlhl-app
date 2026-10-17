export const eventPageCopyFields = [
  { key: 'backLink', label: '返回日历链接', en: 'Event calendar', cn: '返回活动日历' },
  { key: 'timezone', label: '时间旁的说明', en: '(Eastern Time)', cn: '（美国东部时间）', optional: true },
  { key: 'capacity', label: '人数说明（保留 {capacity}，自动显示人数）', en: 'Planned capacity: {capacity}', cn: '计划人数：{capacity} 人' },
  { key: 'feesHeading', label: '费用栏目标题', en: 'Event fees', cn: '活动费用' },
  { key: 'paymentHeading', label: '付款栏目标题', en: 'Payment methods', cn: '付款方式' },
  { key: 'registrationButton', label: '外部报名表按钮', en: 'Register', cn: '报名登记' },
  { key: 'memberRegistrationButton', label: '会员中心报名按钮（未填写外部报名链接时显示）', en: 'Register through the member portal', cn: '报名登记' },
  { key: 'registrationNote', label: '报名按钮下方说明', en: 'Complete the event registration form to sign up.', cn: '请填写活动报名表，完成报名登记。', optional: true, multiline: true },
  { key: 'paymentNote', label: '报名按钮下方付款提醒（有付款说明时显示）', en: 'Follow the payment instructions above.', cn: '请按上方说明支付活动费用。', optional: true, multiline: true },
  { key: 'endedMessage', label: '活动结束后的提示', en: 'This event has ended.', cn: '活动已结束。', multiline: true },
  { key: 'posterExpand', label: '海报上的查看大图文字', en: 'View high-resolution poster', cn: '点击查看高清大图' },
  { key: 'posterOriginal', label: '大图窗口的原图链接', en: 'Open original image', cn: '在新窗口打开原图' },
  { key: 'posterOpenLabel', label: '海报打开按钮的无障碍说明', en: 'Open a high-resolution view of the event poster', cn: '打开活动海报高清大图' },
  { key: 'posterDialogLabel', label: '海报大图窗口的无障碍说明', en: 'High-resolution event poster', cn: '活动海报高清大图' },
  { key: 'posterCloseLabel', label: '海报关闭按钮的无障碍说明', en: 'Close poster preview', cn: '关闭海报大图' },
] satisfies { key: string; label: string; en: string; cn: string; optional?: boolean; multiline?: boolean }[];

export type EventPageCopy = Record<string, string>;

export function validateEventPageCopy(input: unknown): EventPageCopy {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('活动网页文字格式无效');
  const output: EventPageCopy = {};
  for (const [key, value] of Object.entries(input)) {
    const field = eventPageCopyFields.find(item => item.key === key);
    if (!field || typeof value !== 'string' || value.length > (field.multiline ? 2000 : 200)
      || (!field.optional && !value.trim())) throw new Error('请检查活动网页文字：标题和按钮不能为空，短文字最多 200 字，说明最多 2000 字');
    if (key === 'capacity' && !value.includes('{capacity}')) throw new Error('人数说明必须保留 {capacity}，用于显示活动人数');
    output[key] = value;
  }
  return output;
}

export function storedEventPageCopy(value: unknown): EventPageCopy {
  if (typeof value !== 'string' || !value) return {};
  try { return validateEventPageCopy(JSON.parse(value)); }
  catch { return {}; }
}

export function eventPageCopy(value: unknown, locale: 'en' | 'cn'): EventPageCopy {
  return { ...Object.fromEntries(eventPageCopyFields.map(field => [field.key, field[locale]])), ...storedEventPageCopy(value) };
}

export function eventPosterCopy(copy: EventPageCopy, locale: 'en' | 'cn'): Record<string, string> {
  return Object.fromEntries(eventPageCopyFields.filter(field => field.key.startsWith('poster')).map(field => [field[locale], copy[field.key]]));
}
