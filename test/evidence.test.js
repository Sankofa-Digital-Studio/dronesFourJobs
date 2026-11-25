import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { sourceHealth } from '../public/source-registry.js';
import { archiveSnapshot } from '../scripts/archive-snapshot.js';

test('freshness distinguishes missing, failed, reviewed, and stale', () => {
  const now = Date.parse('2026-11-25T12:00:00Z');
  assert.equal(sourceHealth(undefined, now), 'missing');
  assert.equal(sourceHealth({ failed: true }, now), 'refresh-failed');
  assert.equal(sourceHealth({ mode: 'reviewed-snapshot' }, now), 'snapshot');
  const checkedAt = '2026-11-25T10:00:00Z';
  assert.equal(sourceHealth({ mode: 'scheduled', checkedAt, maxAgeMs: 3600000 }, now), 'stale');
  assert.equal(sourceHealth({ mode: 'scheduled', checkedAt, maxAgeMs: 7200000 }, now), 'current');
});

test('archives revisions, deduplicates repeated retrievals, and preserves prior evidence after rejection', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'politibru-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const input = { sourceId: 'notices', publicationDate: '2026-11-22', retrievedAt: '2026-11-24', records: [{ id: 'test' }] };
  const first = await archiveSnapshot(directory, input);
  assert.equal(first.alreadyArchived, false);
  assert.equal((await archiveSnapshot(directory, { ...input, retrievedAt: '2026-11-25' })).alreadyArchived, true);
  assert.equal((await archiveSnapshot(directory, { ...input, records: [{ id: 'revised' }] })).alreadyArchived, false);
  await assert.rejects(archiveSnapshot(directory, { ...input, records: [] }));
  assert.equal((await readdir(join(directory, 'notices'))).length, 2);
  assert.equal(JSON.parse(await readFile(first.destination)).reviewState, 'pending');
});
