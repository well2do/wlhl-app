import { eventPageCopy, eventPageCopyFields } from '@/lib/event-page-copy';

export function EventPageCopyFields({ value, locale }: { value?: string; locale: 'en' | 'cn' }) {
  const copy = eventPageCopy(value, locale);
  return <div className="event-copy-field-grid">{eventPageCopyFields.map(field => <label key={field.key}>
    {field.label}{locale === 'en' ? '（英文）' : ''}
    <textarea name={`pageCopy${locale === 'cn' ? 'Cn' : ''}:${field.key}`} defaultValue={copy[field.key]}
      rows={field.multiline ? 3 : 2} maxLength={field.multiline ? 2000 : 200} required={!field.optional} />
    {field.optional && <small>可清空此项，隐藏这段说明。</small>}
  </label>)}</div>;
}
