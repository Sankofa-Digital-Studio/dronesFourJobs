import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { sources } from '../public/source-registry.js';

export async function archiveSnapshot(directory, snapshot) {
  const { sourceId, publicationDate, retrievedAt, records } = snapshot ?? {};
  if (!Object.hasOwn(sources, sourceId) || !Number.isFinite(Date.parse(publicationDate)) ||
      !Number.isFinite(Date.parse(retrievedAt)) || Date.parse(publicationDate) > Date.parse(retrievedAt) ||
      !Array.isArray(records) || records.length === 0) {
    throw new Error('Provide a registered source, valid dates and at least one record.');
  }
  const source = sources[sourceId];
  const evidence = { sourceId, publisher: source.publisher, url: source.url, scope: source.scope, publicationDate, records };
  const hash = createHash('sha256').update(JSON.stringify(evidence)).digest('hex');
  const folder = join(directory, sourceId);
  await mkdir(folder, { recursive: true });
  const destination = join(folder, hash + '.json');
  const temporary = join(folder, randomUUID() + '.tmp');
  const lock = destination + '.lock';
  try {
    await mkdir(lock);
  } catch (error) {
    if (error.code === 'EEXIST') throw new Error('Snapshot is being archived. Retry after the active run.');
    throw error;
  }
  try {
    try {
      await readFile(destination);
      return { destination, alreadyArchived: true };
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    await writeFile(temporary, JSON.stringify({ ...evidence, retrievedAt, reviewState: 'pending', hash }, null, 2) + '\n', { flag: 'wx' });
    await rename(temporary, destination);
    return { destination, alreadyArchived: false };
  } finally {
    await rm(temporary, { force: true });
    await rm(lock, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [input, directory] = process.argv.slice(2);
  if (!input || !directory) throw new Error('Usage: node scripts/archive-snapshot.js INPUT.json ARCHIVE_DIRECTORY');
  const snapshot = JSON.parse(await readFile(input, 'utf8'));
  console.log(await archiveSnapshot(directory, snapshot));
}
