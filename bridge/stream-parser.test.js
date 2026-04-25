/* eslint-disable no-console */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parseStreamLines, MAX_LINE_BYTES } = require("./stream-parser");

test("parses a single complete line", () => {
  const { events, rawLines, leftover } = parseStreamLines(
    '{"kind":"system","subtype":"init"}\n',
    "",
  );
  assert.equal(events.length, 1);
  assert.deepEqual(events[0], { kind: "system", subtype: "init" });
  assert.equal(rawLines.length, 0);
  assert.equal(leftover, "");
});

test("parses multiple complete lines in one chunk", () => {
  const chunk = [
    '{"a":1}',
    '{"b":2}',
    '{"c":3}',
    "",
  ].join("\n");
  const { events, rawLines, leftover } = parseStreamLines(chunk, "");
  assert.equal(events.length, 3);
  assert.deepEqual(events.map((e) => Object.keys(e)[0]), ["a", "b", "c"]);
  assert.equal(rawLines.length, 0);
  assert.equal(leftover, "");
});

test("carries partial line forward as leftover", () => {
  const { events, rawLines, leftover } = parseStreamLines(
    '{"a":1}\n{"b":',
    "",
  );
  assert.equal(events.length, 1);
  assert.deepEqual(events[0], { a: 1 });
  assert.equal(rawLines.length, 0);
  assert.equal(leftover, '{"b":');
});

test("joins leftover with next chunk to recover full line", () => {
  const first = parseStreamLines('{"a":1}\n{"b":', "");
  assert.equal(first.events.length, 1);
  assert.equal(first.leftover, '{"b":');

  const second = parseStreamLines('2}\n{"c":3}\n', first.leftover);
  assert.equal(second.events.length, 2);
  assert.deepEqual(second.events[0], { b: 2 });
  assert.deepEqual(second.events[1], { c: 3 });
  assert.equal(second.leftover, "");
});

test("malformed JSON line is surfaced as raw, valid lines still parse", () => {
  const chunk = [
    '{"good":1}',
    "this is not json",
    '{"good":2}',
    "",
  ].join("\n");
  const { events, rawLines, leftover } = parseStreamLines(chunk, "");
  assert.equal(events.length, 2);
  assert.deepEqual(events[0], { good: 1 });
  assert.deepEqual(events[1], { good: 2 });
  assert.equal(rawLines.length, 1);
  assert.equal(rawLines[0], "this is not json");
  assert.equal(leftover, "");
});

test("CRLF line endings strip trailing \\r before parsing", () => {
  const { events, rawLines, leftover } = parseStreamLines(
    '{"kind":"x"}\r\n',
    "",
  );
  assert.equal(events.length, 1);
  assert.deepEqual(events[0], { kind: "x" });
  assert.equal(rawLines.length, 0);
  assert.equal(leftover, "");
});

test("blank lines are skipped silently", () => {
  const { events, rawLines } = parseStreamLines(
    '{"a":1}\n\n\n{"b":2}\n',
    "",
  );
  assert.equal(events.length, 2);
  assert.equal(rawLines.length, 0);
});

test("oversized line is truncated and surfaced as raw", () => {
  const giant = "x".repeat(MAX_LINE_BYTES + 100);
  const chunk = `{"ok":true}\n${giant}\n{"after":1}\n`;
  const { events, rawLines, oversized, leftover } = parseStreamLines(chunk, "");
  assert.equal(events.length, 2);
  assert.deepEqual(events[0], { ok: true });
  assert.deepEqual(events[1], { after: 1 });
  assert.equal(rawLines.length, 1);
  assert.ok(rawLines[0].endsWith(" [truncated]"));
  assert.equal(oversized, 1);
  assert.equal(leftover, "");
});

test("truncates UTF-8 line by byte count for 2-byte chars", () => {
  // 2-byte char "é" × 600_000 = 1.2 MB — line-too-long path.
  const huge = "é".repeat(600_000);
  const { rawLines, oversized } = parseStreamLines(huge + "\n", "");
  // Strip the " [truncated]" marker that the caller appends if present.
  const got = (rawLines[0] ?? "").replace(/ \[truncated\]$/, "");
  const gotBytes = Buffer.byteLength(got, "utf-8");
  assert.ok(gotBytes <= MAX_LINE_BYTES, `expected ≤${MAX_LINE_BYTES}, got ${gotBytes}`);
  assert.ok(oversized >= 1);
});

test("truncates UTF-8 line by byte count for 4-byte emoji (boundary-split safe)", () => {
  // 4-byte emoji "😀" (U+1F600) × 300_000 = 1.2 MB — line-too-long path.
  // 4-byte chars don't divide evenly into 1 MB so the cut WILL land
  // inside a multi-byte sequence. With the bug, U+FFFD substitution would
  // push us past the cap.
  const huge = "😀".repeat(300_000);
  const { rawLines, oversized } = parseStreamLines(huge + "\n", "");
  const got = (rawLines[0] ?? "").replace(/ \[truncated\]$/, "");
  const gotBytes = Buffer.byteLength(got, "utf-8");
  assert.ok(gotBytes <= MAX_LINE_BYTES, `expected ≤${MAX_LINE_BYTES}, got ${gotBytes}`);
  assert.ok(oversized >= 1);
});

test("truncates UTF-8 leftover by byte count for 4-byte emoji", () => {
  // No trailing newline — content accumulates in leftover. Tests the
  // leftover-overflow guard path (different site than line-too-long).
  const huge = "😀".repeat(300_000);
  const { leftover, oversized } = parseStreamLines(huge, "");
  const leftoverBytes = Buffer.byteLength(leftover, "utf-8");
  assert.ok(
    leftoverBytes <= MAX_LINE_BYTES,
    `expected leftover ≤${MAX_LINE_BYTES}, got ${leftoverBytes}`,
  );
  assert.ok(oversized >= 1);
});

test("oversized leftover is dropped, not retained between chunks", () => {
  const giant = "x".repeat(MAX_LINE_BYTES + 100); // no newline → leftover
  const { events, rawLines, oversized, leftover } = parseStreamLines(
    giant,
    "",
  );
  assert.equal(events.length, 0);
  assert.equal(rawLines.length, 1);
  assert.ok(rawLines[0].endsWith(" [truncated]"));
  assert.equal(oversized, 1);
  assert.equal(leftover, "");
});

test("empty chunk with non-empty leftover is a no-op", () => {
  const { events, rawLines, leftover } = parseStreamLines("", '{"partial":');
  assert.equal(events.length, 0);
  assert.equal(rawLines.length, 0);
  assert.equal(leftover, '{"partial":');
});

test("byte-by-byte feed reconstructs full events", () => {
  const source = '{"alpha":1}\n{"beta":2}\n{"gamma":3}\n';
  let leftover = "";
  const allEvents = [];
  for (const ch of source) {
    const r = parseStreamLines(ch, leftover);
    leftover = r.leftover;
    allEvents.push(...r.events);
  }
  assert.equal(allEvents.length, 3);
  assert.deepEqual(allEvents.map((e) => Object.keys(e)[0]), ["alpha", "beta", "gamma"]);
  assert.equal(leftover, "");
});
