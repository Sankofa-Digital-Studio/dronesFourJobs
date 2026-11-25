export const sources = Object.freeze({
  notices: { publisher: 'Matjhabeng Local Municipality', url: 'https://matjhabeng.co.za/services/services-status', scope: 'Matjhabeng municipality', mode: 'reviewed-snapshot' },
  plans: { publisher: 'Matjhabeng Local Municipality', url: 'https://matjhabengmunicipality.co.za/IDP.html', scope: 'Matjhabeng municipality', mode: 'document-index' },
  finance: { publisher: 'National Treasury', url: 'https://municipaldata.treasury.gov.za/docs', scope: 'Municipal finance', mode: 'documented-api' }
});

export function sourceHealth(snapshot, now = Date.now()) {
  if (!snapshot) return 'missing';
  if (snapshot.failed) return 'refresh-failed';
  if (snapshot.mode !== 'scheduled') return 'snapshot';
  const checked = Date.parse(snapshot.checkedAt);
  if (!Number.isFinite(checked) || checked > now || !Number.isFinite(snapshot.maxAgeMs) || snapshot.maxAgeMs <= 0) return 'unknown';
  return now - checked > snapshot.maxAgeMs ? 'stale' : 'current';
}
