// Translate interface labels only; never apply this to saved names or content.
export function organizationLabel(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/微信(?:支付)?商户号|商户|店铺/g, term => {
    if (term === '商户') return '分会';
    if (term === '店铺') return '部门';
    return term;
  });
}
