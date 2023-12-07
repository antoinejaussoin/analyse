import fs from "fs/promises";
import path from "path";

export async function getFiles() {
  const files = await fs.readdir("./docs");
  // files.forEach((file) => {
  //   console.log(path.resolve("./docs", file));
  // });
  return files.map((f) => path.resolve("./docs", f));
}

export async function saveResult(file: string, result: string) {
  await fs.writeFile(
    path.resolve(file, "../../results", path.basename(file) + ".json"),
    result
  );
}
