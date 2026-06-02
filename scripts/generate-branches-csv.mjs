import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const regions = ["luzon", "ncr", "vismin"];
const areas = Array.from({ length: 14 }, (_, i) => `Area ${i + 1}`);

const rows = ["branch_code,branch_name,area,region"];
let n = 1;
for (const area of areas) {
  const perArea = area === "Area 1" ? 12 : 10;
  for (let i = 0; i < perArea; i++) {
    const region = regions[(n - 1) % 3];
    const code = `BR${String(n).padStart(4, "0")}`;
    rows.push(`${code},Branch ${n},${area},${region}`);
    n++;
  }
}

const out = join(__dirname, "..", "data", "branches.csv");
writeFileSync(out, rows.join("\n") + "\n");
console.log(`Wrote ${n - 1} branches to ${out}`);
