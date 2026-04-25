/* eslint-disable no-console */
/**
 * Line-delimited JSON parser for Claude `--output-format=stream-json` output.
 *
 * Stdout from `claude` arrives in arbitrary-sized chunks; a single JSON
 * record may straddle two chunks. This module re-assembles complete lines
 * across chunks and JSON-parses each one independently, surfacing both
 * structured events and any non-JSON noise (warnings, info logs Claude
 * occasionally writes outside of stream-json frames).
 */

const MAX_LINE_BYTES = 1 * 1024 * 1024; // 1MB hard cap per line

/**
 * Parse a chunk of stdout text plus any leftover from the previous call.
 *
 * @param {string} chunk    new bytes from stdout (already utf-8 decoded)
 * @param {string} leftover partial line carried over from the prior chunk
 * @returns {{ events: object[], rawLines: string[], leftover: string, oversized: number }}
 *   - events:     successfully JSON-parsed records
 *   - rawLines:   non-empty lines that failed JSON.parse
 *   - leftover:   incomplete trailing line to feed back into the next call
 *   - oversized:  count of lines that were truncated for exceeding MAX_LINE_BYTES
 */
function parseStreamLines(chunk, leftover) {
  const combined = (leftover || "") + (chunk || "");
  const events = [];
  const rawLines = [];
  let oversized = 0;

  // Split on \n; the last element is everything after the final \n
  // (possibly empty, possibly a partial line).
  const parts = combined.split("\n");
  const newLeftover = parts.pop();

  for (const rawLine of parts) {
    // Strip a trailing \r in case Claude ever emits CRLF.
    let line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
    if (!line) continue;

    if (Buffer.byteLength(line, "utf-8") > MAX_LINE_BYTES) {
      oversized += 1;
      line = line.slice(0, MAX_LINE_BYTES) + " [truncated]";
      rawLines.push(line);
      continue;
    }

    try {
      const parsed = JSON.parse(line);
      events.push(parsed);
    } catch {
      rawLines.push(line);
    }
  }

  // Guard against the leftover itself growing without bound when Claude
  // emits a single absurdly long line. We keep what fits, drop the rest,
  // and surface a synthetic raw line so the consumer can warn.
  let safeLeftover = newLeftover || "";
  if (Buffer.byteLength(safeLeftover, "utf-8") > MAX_LINE_BYTES) {
    oversized += 1;
    rawLines.push(safeLeftover.slice(0, MAX_LINE_BYTES) + " [truncated]");
    safeLeftover = "";
  }

  return { events, rawLines, leftover: safeLeftover, oversized };
}

module.exports = { parseStreamLines, MAX_LINE_BYTES };
