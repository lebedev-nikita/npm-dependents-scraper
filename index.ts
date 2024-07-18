#!/usr/bin/env bun
import fs from "node:fs/promises";
import { parseArgs } from "@std/cli/parse-args";

const HELP = `
bun run index.ts <package-name>
bun run index.ts <package-name> <output-file>.json
bun run index.ts <package-name> <output-file>.json --no-trace --no-indent
bun run index.ts --help
`.trim();

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  console.log(HELP);
  process.exit(0);
}

if (!args._[0]) {
  console.log(HELP);
  process.exit(-1);
}

const packageName = args._[0]?.toString();
const outputFile = args._[1]?.toString();
const noTrace = Boolean(args["no-trace"] || !outputFile);
const noIndent = Boolean(args["no-indent"]);

const data = JSON.stringify(await scrape(), null, noIndent ? 0 : 2);

if (outputFile) {
  await fs.writeFile(outputFile, data, "utf8");
} else {
  console.log(data);
}

async function scrape() {
  let arr: unknown[] = [];

  const STEP = 36;

  for (let i = 0; i < 1000; i++) {
    if (!noTrace) {
      console.log(i);
    }

    const res = await fetch(
      `https://www.npmjs.com/browse/depended/${packageName}?offset=${i * STEP}`,
      { headers: { "X-Spiferack": "1" } }
    );

    if (res.headers.get("content-type") !== "application/json") {
      console.error(`content-type: ${res.headers.get("content-type")}`);
      break;
    }

    if (!res.ok) {
      const msg: any = await res.json();
      if (msg.errorMessage != "Pagination limit reached") {
        console.error(`status: ${res.status}`);
        console.error(msg);
      }
      break;
    }

    const result = await res.json();
    arr = arr.concat(result);
  }

  return arr;
}
