import { createReadStream, createWriteStream, promises as fs } from "fs";
import { join, resolve } from "path";
import { tmpdir } from "os";
import { createInterface as readLines } from "readline";
import TOMLPrettifier from "@aduh95/toml-prettifier";

const LINE_LENGTH_LIMIT = 80;

export async function prettierFile(output, input) {
  const reader = readLines({
    input: createReadStream(input),
    crlfDelay: Infinity,
  });
  const writer = createWriteStream(output);
  let lineNumber = 0;
  for await (const line of TOMLPrettifier(reader)) {
    lineNumber++;
    writer.write(line + "\n");
    if (line.length > LINE_LENGTH_LIMIT) {
      console.warn(
        `${output}:${lineNumber} exceeds the ${LINE_LENGTH_LIMIT} char limit.`
      );
      process.exitCode = 1;
    }
  }
  return new Promise((done) => writer.end(done));
}

const TMP_DIR = join(tmpdir(), "prettier");
const TARGET_DIR = resolve(process.argv[2]);

Promise.all([fs.mkdtemp(TMP_DIR), fs.readdir(TARGET_DIR)])
  .then(([tmp, files]) =>
    Promise.all(
      files
        .filter((f) => f.endsWith(".toml"))
        .map((f) => [TARGET_DIR, tmp].map((d) => join(d, f)))
        .map((args) => fs.rename(...args).then(() => prettierFile(...args)))
    )
  )
  .catch(console.error);
