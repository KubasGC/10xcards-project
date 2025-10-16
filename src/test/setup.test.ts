import { describe, it, expect } from "vitest";

describe("Test Setup", () => {
  it("should work correctly", () => {
    expect(1 + 1).toBe(2);
  });

  it("should have access to testing utilities", () => {
    const mockData = { name: "test" };
    expect(mockData.name).toBe("test");
  });
});
