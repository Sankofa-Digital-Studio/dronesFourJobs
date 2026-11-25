import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pilotScorecard } from '../scripts/pilot-scorecard.js';

const empty = { windowStart: '2026-11-25', windowEnd: '2026-11-26', matureFollowers: 0,
  returningFollowers: 0, distinctRespondingActors: 0, verifiedRecords: 0, reviewerMinutes: 0, independentPaidPilots: 0 };

test('keeps unmeasured rates unknown and partial periods visible', () => {
  const result = pilotScorecard(empty);
  assert.equal(result.residentReturn.rate, null);
  assert.equal(result.evidenceOperations.minutesPerRecord, null);
  assert.equal(result.fullPeriodObserved, false);
});

test('calculates observed rates and rejects incompatible cohorts', () => {
  const result = pilotScorecard({ ...empty, windowEnd: '2027-02-23', matureFollowers: 10,
    returningFollowers: 3, distinctRespondingActors: 2, verifiedRecords: 4, reviewerMinutes: 80, independentPaidPilots: 1 });
  assert.equal(result.residentReturn.rate, 0.3);
  assert.equal(result.residentReturn.targetMet, true);
  assert.equal(result.evidenceOperations.minutesPerRecord, 20);
  assert.equal(result.fullPeriodObserved, true);
  assert.throws(() => pilotScorecard({ ...empty, returningFollowers: 1 }));
});
