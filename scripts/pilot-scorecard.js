import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

function count(value, name) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(name + ' must be a non-negative integer.');
  return value;
}

export function pilotScorecard(observations) {
  const { windowStart, windowEnd, matureFollowers, returningFollowers,
    distinctRespondingActors, verifiedRecords, reviewerMinutes,
    independentPaidPilots } = observations;
  const days = (Date.parse(windowEnd) - Date.parse(windowStart)) / 86400000;
  if (!Number.isFinite(days) || days < 0) throw new Error('Provide an ordered observation window.');
  for (const [name, value] of Object.entries({ matureFollowers, returningFollowers,
    distinctRespondingActors, verifiedRecords, reviewerMinutes, independentPaidPilots })) count(value, name);
  if (returningFollowers > matureFollowers) throw new Error('Returning followers exceed the mature cohort.');
  const returnRate = matureFollowers ? returningFollowers / matureFollowers : null;
  return {
    windowStart, windowEnd, days,
    residentReturn: { numerator: returningFollowers, denominator: matureFollowers, rate: returnRate,
      targetMet: returnRate === null ? null : returnRate >= 0.3 },
    publicParticipation: { distinctRespondingActors, targetMet: distinctRespondingActors >= 2 },
    evidenceOperations: { verifiedRecords, reviewerMinutes, minutesPerRecord: verifiedRecords ? reviewerMinutes / verifiedRecords : null },
    commercialDemand: { independentPaidPilots, targetMet: independentPaidPilots >= 1 },
    fullPeriodObserved: days >= 90
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.argv[2]) throw new Error('Usage: node scripts/pilot-scorecard.js AGGREGATES.json');
  console.log(JSON.stringify(pilotScorecard(JSON.parse(await readFile(process.argv[2], 'utf8'))), null, 2));
}
