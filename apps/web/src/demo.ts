export type DemoIssueValues = Record<string, string>;

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
    coverageStart: local(1),
    coverageEnd: local(49),
    evaluationAt: local(25),
    claimDeadline: local(73),
    sourceLabel: "Demo evidence source",
    sourceUrl: "https://example.com/demo-evidence",
    authority: "PRIMARY",
    zeroCode: "MET",
    zeroDescription: "Promise met",
    paidCode: "BREACH",
    paidDescription: "Promise breached",
    paidBps: "10000",
  };
}
