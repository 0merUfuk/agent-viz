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

test("truncates UTF-8 content by byte count, not char count", () => {
  // 2-byte UTF-8 char ("é" = 0xC3 0xA9). 600k of these is 1.2MB,
  // but only 600k chars — naive char-index slicing would keep 1MB
  // of *chars* (= 2MB of bytes), exceeding the cap.
  const huge = "é".repeat(600_000); // 1.2 MB
  const { rawLines, oversized } = parseStreamLines(huge + "\n", "");
  assert.equal(rawLines.length, 1);
  const got = rawLines[0];
  // Strip the " [truncated]" suffix before measuring; the truncated
  // payload itself must be ≤ MAX_LINE_BYTES bytes.
  const suffix = " [truncated]";
  assert.ok(got.endsWith(suffix), "expected [truncated] suffix");
  const payload = got.slice(0, -suffix.length);
  const payloadBytes = Buffer.byteLength(payload, "utf-8");
  assert.ok(
    payloadBytes <= MAX_LINE_BYTES,
    `expected payload ≤${MAX_LINE_BYTES} bytes, got ${payloadBytes}`,
  );
  assert.equal(oversized, 1);
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
