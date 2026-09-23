import { describe, expect, it } from "vitest";
import { makeDemoIssueValues } from "./demo";

describe("demo issue data", () => {
  it("provides complete, valid-looking preview fields", () => {
    const values = makeDemoIssueValues(0);
    expect(values.escrow).toBe("0.02");
    expect(values.sourceUrl).toMatch(/^https:\/\//);
    expect(values.zeroCode).toBe("MET");
    expect(values.paidCode).toBe("BREACH");
    expect(Number(values.paidBps)).toBe(10000);
    expect(new Date(values.coverageEnd).getTime()).toBeGreaterThan(new Date(values.coverageStart).getTime());
    expect(values.terms).toContain("Review these terms");
  });
});
