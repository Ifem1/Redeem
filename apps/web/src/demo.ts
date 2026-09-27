export type DemoIssueValues = Record<string, string>;

export function makeDemoOutcomeValues(recurring = false): DemoIssueValues {
  return recurring
    ? {
        zeroCode: "MET",
        zeroDescription: "Promise met",
        paidCode: "MAJOR",
        paidDescription: "Major breach",
        paidBps: "10000",
      }
    : {
        zeroCode: "MET",
        zeroDescription: "Promise met",
        paidCode: "BREACH",
        paidDescription: "Promise breached",
        paidBps: "10000",
      };
}

export function makeDemoIssueValues(now = Date.now()): DemoIssueValues {
  const local = (offsetHours: number) => {
    const date = new Date(now + offsetHours * 60 * 60 * 1000);
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  return {
    beneficiary: "0x000000000000000000000000000000000000dEaD",
    title: "Demo guarantee — preview only",
    terms: "Sample terms for testing the issuance interface. Review these terms before choosing whether to fund.",
    escrow: "0.02",
    firstCoverageStart: local(1),
    coverageStart: local(-2),
    coverageEnd: local(48),
    evaluationAt: local(-1),
    claimDeadline: local(72),
    sourceLabel: "Demo evidence source",
    sourceUrl: "https://example.com/demo-evidence",
    authority: "PRIMARY",
    ...makeDemoOutcomeValues(),
  };
}
