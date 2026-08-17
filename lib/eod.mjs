const CLOSER_ALIASES = { Nuh: "Noah" };

export const normalizeCloser = (name) => CLOSER_ALIASES[name] || name;

export const windowDates = (days, now = new Date()) => {
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - (days - 1));
  const iso = (d) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
};

const sumAmounts = (rows, key) =>
  (rows || []).reduce((total, row) => total + (parseFloat(row[key]) || 0), 0);

const compactOutcomes = (rows, type) =>
  (rows || [])
    .filter((row) => row.outcome)
    .map((row) => ({
      t: type,
      o: row.outcome,
      cc: row.cashCollected ?? null,
    }));

export const compactSubmission = (sub) => ({
  d: sub.reportDate,
  c: normalizeCloser(sub.closerName),
  nc: sub.newCalls || 0,
  su: sub.showedUp || 0,
  om: sub.offersMade || 0,
  cc: parseFloat(sub.cashCollected) || 0,
  pp: parseFloat(sub.paymentPlans) || 0,
  rv: parseFloat(sub.revenueGenerated) || 0,
  fc: sub.followUpCalls || 0,
  ppOut: sumAmounts(sub.paymentPlanOutcomes, "amountCollected"),
  dcOut: sumAmounts(sub.deferredCashOutcomes, "amountCollected"),
  out: [
    ...compactOutcomes(sub.callOutcomes, "new"),
    ...compactOutcomes(sub.followUpCallOutcomes, "fu"),
  ],
});
