import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

// One-line joke excusing a missed deadline: the deadline missed ME,
// not the other way round — doorbell footage proves it.
const ENTRY =
  "The deadline showed up an hour early, knocked once, and left — I have the doorbell footage, so technically it missed me.";

// Validate the entry before writing anything.
// Gate: UTF-8 text, 1-200 characters, single line, not only whitespace.
function validateEntry(entry: string): void {
  // Count Unicode code points, not UTF-16 code units, so the em dash
  // and any other non-BMP character count as one character each.
  const charCount = [...entry].length;
  if (charCount < 1 || charCount > 200) {
    throw new Error(`Entry must be 1-200 characters, got ${charCount}`);
  }
  if (entry.trim().length === 0) {
    throw new Error("Entry must not be only whitespace");
  }
  if (entry.includes("\n") || entry.includes("\r")) {
    throw new Error("Entry must be a single line");
  }
  // Reject control characters other than the trailing newline we add.
  for (const ch of entry) {
    const code = ch.codePointAt(0) as number;
    if (code < 0x20 && ch !== "\t") {
      throw new Error(`Entry contains a control character U+${code.toString(16).padStart(4, "0")}`);
    }
  }
  // Must round-trip as UTF-8 exactly.
  if (Buffer.from(entry, "utf8").toString("utf8") !== entry) {
    throw new Error("Entry is not valid UTF-8 text");
  }
}

function resolveOutputDir(): string {
  const dir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  if (dir.trim().length === 0) {
    throw new Error("MAKEFUN_OUTPUT_DIR must not be empty");
  }
  return dir;
}

function main(): void {
  validateEntry(ENTRY);
  const outDir = resolveOutputDir();
  const outFile = join(outDir, "entry.txt");

  // Create the output directory if missing. Never remove it:
  // the grader filesystem is read-only there and removing it fails.
  mkdirSync(outDir, { recursive: true });

  const payload = ENTRY + "\n";
  writeFileSync(outFile, payload, "utf8");

  // Read back and verify byte for byte.
  const back = readFileSync(outFile);
  if (!back.equals(Buffer.from(payload, "utf8"))) {
    throw new Error("Verification failed: file contents do not match entry");
  }
}

main();
