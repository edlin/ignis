import { describe, it, expect, vi } from "vitest";
import { createFsSync } from "./sync.js";
import { resolvePath } from "./transforms.js";

function makeDeps() {
  const store = new Map();

  const metadataCache = {
    has: (p) => store.has(p),
    get: (p) => (store.has(p) ? store.get(p) : null),
    set: (p, m) => store.set(p, m),
    delete: (p) => store.delete(p),
    rename: (a, b) => {
      if (store.has(a)) {
        store.set(b, store.get(a));
        store.delete(a);
      }
    },
    toStat: (p) =>
      store.has(p)
        ? {
            type: store.get(p).type,
            isDirectory: () => store.get(p).type === "directory",
            isFile: () => store.get(p).type === "file",
          }
        : null,
    readdir: () => [],
  };

  const contentCache = {
    get: () => null,
    set: vi.fn(),
    delete: vi.fn(),
    invalidate: vi.fn(),
  };

  const transport = {
    mkdir: vi.fn(async () => {}),
    rmdir: vi.fn(async () => {}),
    rm: vi.fn(async () => {}),
    rename: vi.fn(async () => {}),
    copyFile: vi.fn(async () => {}),
    appendFile: vi.fn(async () => {}),
    utimes: vi.fn(async () => {}),
    stat: vi.fn(async () => ({ type: "file", size: 1 })),
  };

  return { metadataCache, contentCache, transport, store };
}

describe("sync fs mutations", () => {
  it("lstatSync mirrors statSync", () => {
    const deps = makeDeps();
    const fs = createFsSync(deps.metadataCache, deps.contentCache, deps.transport);
    deps.store.set(resolvePath("dir"), { type: "directory" });

    expect(fs.lstatSync("dir").isDirectory()).toBe(true);
  });

  it("mkdirSync updates the cache and fires the transport", () => {
    const deps = makeDeps();
    const fs = createFsSync(deps.metadataCache, deps.contentCache, deps.transport);

    fs.mkdirSync("newdir", { recursive: true });

    expect(deps.store.get("newdir")).toEqual({ type: "directory" });
    expect(deps.transport.mkdir).toHaveBeenCalledWith("newdir", true);
  });

  it("rmSync deletes from the cache and fires the transport", () => {
    const deps = makeDeps();
    const fs = createFsSync(deps.metadataCache, deps.contentCache, deps.transport);
    const key = resolvePath("gone.md");
    deps.store.set(key, { type: "file" });

    fs.rmSync("gone.md", { recursive: true });

    expect(deps.store.has(key)).toBe(false);
    expect(deps.transport.rm).toHaveBeenCalled();
  });

  it("renameSync moves cache metadata and fires the transport", () => {
    const deps = makeDeps();
    const fs = createFsSync(deps.metadataCache, deps.contentCache, deps.transport);
    const from = resolvePath("a.md");
    const to = resolvePath("b.md");
    deps.store.set(from, { type: "file", size: 2 });

    fs.renameSync("a.md", "b.md");

    expect(deps.store.has(from)).toBe(false);
    expect(deps.store.get(to)).toEqual({ type: "file", size: 2 });
    expect(deps.transport.rename).toHaveBeenCalled();
  });

  it("copyFileSync optimistically mirrors source metadata and fires the transport", () => {
    const deps = makeDeps();
    const fs = createFsSync(deps.metadataCache, deps.contentCache, deps.transport);
    const srcKey = resolvePath("src.md");
    const destKey = resolvePath("dest.md");
    deps.store.set(srcKey, { type: "file", size: 9 });

    fs.copyFileSync("src.md", "dest.md");

    expect(deps.store.get(destKey)).toEqual({ type: "file", size: 9 });
    expect(deps.transport.copyFile).toHaveBeenCalled();
  });

  it("utimesSync sets mtime and fires the transport", () => {
    const deps = makeDeps();
    const fs = createFsSync(deps.metadataCache, deps.contentCache, deps.transport);
    const key = resolvePath("note.md");
    deps.store.set(key, { type: "file", mtime: 0 });

    fs.utimesSync("note.md", 111, 222);

    expect(deps.store.get(key).mtime).toBe(222);
    expect(deps.transport.utimes).toHaveBeenCalled();
  });

  it("chmodSync is a no-op that does not throw", () => {
    const deps = makeDeps();
    const fs = createFsSync(deps.metadataCache, deps.contentCache, deps.transport);

    expect(() => fs.chmodSync("note.md", 0o644)).not.toThrow();
    expect(fs.chmodSync("note.md", 0o644)).toBeUndefined();
  });
});
