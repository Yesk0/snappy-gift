import { describe, it, expect } from "vitest";

// Mirror of the Sattolo algorithm from the edge function for unit testing
function generateDerangement(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    // Use Math.random for tests (crypto.getRandomValues not needed here)
    const j = Math.floor(Math.random() * i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function isDerangement(arr: number[]): boolean {
  return arr.every((v, i) => v !== i);
}

describe("Secret Santa derangement", () => {
  it("produces a derangement for n=3", () => {
    for (let trial = 0; trial < 100; trial++) {
      expect(isDerangement(generateDerangement(3))).toBe(true);
    }
  });

  it("produces a derangement for n=10", () => {
    for (let trial = 0; trial < 100; trial++) {
      expect(isDerangement(generateDerangement(10))).toBe(true);
    }
  });

  it("produces a derangement for n=50", () => {
    for (let trial = 0; trial < 50; trial++) {
      expect(isDerangement(generateDerangement(50))).toBe(true);
    }
  });

  it("output length equals input length", () => {
    [3, 5, 10, 20].forEach((n) => {
      expect(generateDerangement(n)).toHaveLength(n);
    });
  });

  it("output contains all indices exactly once (permutation)", () => {
    const n = 10;
    const result = generateDerangement(n);
    const sorted = [...result].sort((a, b) => a - b);
    expect(sorted).toEqual(Array.from({ length: n }, (_, i) => i));
  });
});
