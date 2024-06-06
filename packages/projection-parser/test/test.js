import { parser } from "../dist/index.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
let caseDir = path.dirname(fileURLToPath(import.meta.url));

const sample = fs.readFileSync(path.join(caseDir, "./test.txt"), "utf-8");
const result = parser.parse(sample);
printTree(result.cursor(), sample);

function printTree(cursor, sample, indent = 0) {
  const nodeType = cursor.name;
  const nodeContent =
    cursor.from === cursor.to ? "" : `: ${JSON.stringify(sample.slice(cursor.from, cursor.to))}`;

  console.log(" ".repeat(indent * 2) + indent + " " + nodeType + nodeContent);

  if (cursor.firstChild()) {
    do {
      printTree(cursor, sample, indent + 1);
    } while (cursor.nextSibling());
    cursor.parent();
  }
}
