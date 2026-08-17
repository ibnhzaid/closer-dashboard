import { test } from "node:test";
import assert from "node:assert/strict";
import { compactSubmission, normalizeCloser, windowDates } from "./eod.mjs";

test("normalizes Nuh to Noah and leaves other names", () => {
  assert.equal(normalizeCloser("Nuh"), "Noah");
  assert.equal(normalizeCloser("Sajjad"), "Sajjad");
});

test("windowDates is inclusive of today over N days", () => {
  const { from, to } = windowDates(30, new Date("2026-08-17T15:00:00Z"));
  assert.equal(from, "2026-07-19");
  assert.equal(to, "2026-08-17");
});

test("compacts an EOD submission into dashboard records", () => {
  const record = compactSubmission({
    reportDate: "2026-08-11",
    closerName: "Nuh",
    newCalls: 4,
    showedUp: 3,
    offersMade: 2,
    cashCollected: "2428.00",
    paymentPlans: "0.00",
    revenueGenerated: "2428.00",
    followUpCalls: 1,
    callOutcomes: [{ outcome: "Closed", cashCollected: "2428.00" }],
    followUpCallOutcomes: [{ outcome: "Deposit", cashCollected: "135.00" }],
    paymentPlanOutcomes: [{ amountCollected: "1350.00" }],
    deferredCashOutcomes: [],
  });

  assert.deepEqual(record, {
    d: "2026-08-11",
    c: "Noah",
    nc: 4,
    su: 3,
    om: 2,
    cc: 2428,
    pp: 0,
    rv: 2428,
    fc: 1,
    ppOut: 1350,
    dcOut: 0,
    out: [
      { t: "new", o: "Closed", cc: "2428.00" },
      { t: "fu", o: "Deposit", cc: "135.00" },
    ],
  });
});
