/// <reference types="node" />
// The `irrational` bin: wires run() to the process, or serves MCP on stdio.

import { readFile, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import { run } from "./run";
import { handleLine } from "./stdio";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of process.stdin) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

function serve(): void {
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
  rl.on("line", (line) => {
    const out = handleLine(line);
    if (out) process.stdout.write(`${out}\n`);
  });
}

const r = await run(process.argv.slice(2), {
  isTTY: Boolean(process.stdin.isTTY),
  readStdin,
  readFile: (p) => readFile(p, "utf8"),
  writeFile: (p, s) => writeFile(p, s),
});

if (r.serve) serve();
else {
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  process.exitCode = r.code;
}
