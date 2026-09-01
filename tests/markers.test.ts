import { describe, expect, test } from "bun:test";
import { BLOCK_BEGIN, BLOCK_END, extractBlock, upsertBlock } from "../src/markers.ts";

const body = "# tod rules\n\nDo good work.";

function unwrap<T>(result: { status: string; value?: T }): T {
  expect(result.status).toBe("ok");
  return (result as { value: T }).value;
}

describe("upsertBlock", () => {
  test("a missing file becomes just the block", () => {
    const content = unwrap(upsertBlock(null, body, "x.md"));
    expect(content.startsWith(BLOCK_BEGIN)).toBe(true);
    expect(content.trimEnd().endsWith(BLOCK_END)).toBe(true);
    expect(content).toContain(body);
  });

  test("appends to a file without markers, preserving content byte-for-byte", () => {
    const existing = "# My own instructions\n\nAlways answer in French.\n";
    const content = unwrap(upsertBlock(existing, body, "x.md"));
    expect(content.startsWith(existing)).toBe(true);
    expect(content).toContain(BLOCK_BEGIN);
  });

  test("replaces only what is between markers", () => {
    const before = "above the block\n\n";
    const after = "below the block\n";
    const existing = `${before}${BLOCK_BEGIN}\nold body\n${BLOCK_END}\n${after}`;
    const content = unwrap(upsertBlock(existing, body, "x.md"));
    expect(content.startsWith(before)).toBe(true);
    expect(content.endsWith(after)).toBe(true);
    expect(content).toContain(body);
    expect(content).not.toContain("old body");
  });

  test("is idempotent", () => {
    const once = unwrap(upsertBlock("# Mine\n", body, "x.md"));
    const twice = unwrap(upsertBlock(once, body, "x.md"));
    expect(twice).toBe(once);
  });

  test("errors on duplicated markers without changing anything", () => {
    const existing = `${BLOCK_BEGIN}\na\n${BLOCK_END}\n${BLOCK_BEGIN}\nb\n${BLOCK_END}\n`;
    const result = upsertBlock(existing, body, "x.md");
    expect(result.status).toBe("error");
  });

  test("errors on an unbalanced marker", () => {
    const result = upsertBlock(`${BLOCK_BEGIN}\nno end\n`, body, "x.md");
    expect(result.status).toBe("error");
  });
});

describe("extractBlock", () => {
  test("returns the body between markers", () => {
    const content = unwrap(upsertBlock("# Mine\n", body, "x.md"));
    expect(extractBlock(content)).toBe(body);
  });

  test("returns null when no block exists", () => {
    expect(extractBlock("just some text")).toBeNull();
  });
});
