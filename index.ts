import fs from "node:fs/promises";

const packageName = process.argv[0];
const outputFile = process.argv[1];

let arr: unknown[] = [];

const STEP = 36;

for (let i = 1; i < 1000; i++) {
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

await fs.writeFile(outputFile, JSON.stringify(arr), "utf8");
