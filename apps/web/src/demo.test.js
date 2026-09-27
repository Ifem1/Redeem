import { describe, expect, it } from "vitest";
import { makeDemoIssueValues, makeDemoOutcomeValues } from "./demo";

describe("demo issue data", () => {
  it("provides complete, valid-looking preview fields", () => {
    const values = makeDemoIssueValues(0);
    expect(values.escrow).toBe("0.02");
    expect(values.sourceUrl).toMatch(/^https:\/\//);
    expect(values.zeroCode).toBe("MET");
    expect(values.paidCode).toBe("BREACH");
    expect(Number(values.paidBps)).toBe(10000);
    expect(new Date(values.coverageEnd).getTime()).toBeGreaterThan(new Date(values.coverageStart).getTime());
    expect(new Date(values.firstCoverageStart).getTime()).toBeGreaterThan(0);
    expect(values.terms).toContain("Review these terms");
  });

  it("uses the pinned recurring fixture outcome codes without changing single mode", () => {
    expect(makeDemoOutcomeValues(true)).toMatchObject({ zeroCode: "MET", paidCode: "MAJOR", paidBps: "10000" });
    expect(makeDemoOutcomeValues(false)).toMatchObject({ zeroCode: "MET", paidCode: "BREACH", paidBps: "10000" });
  });
});
