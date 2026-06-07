import { describe, it, expect } from "vitest";
import { realpath } from "./realpath.js";

describe("fs realpath shim", () => {
  it("realpath invokes the callback with the path", async () => {
    const result = await new Promise((resolve) =>
      realpath("/a/b.md", (err, p) => resolve(p)),
    );

    expect(result).toBe("/a/b.md");
  });

  it("realpath accepts an options argument before the callback", async () => {
    const result = await new Promise((resolve) =>
      realpath("/a/b.md", "utf8", (err, p) => resolve(p)),
    );

    expect(result).toBe("/a/b.md");
  });
});
