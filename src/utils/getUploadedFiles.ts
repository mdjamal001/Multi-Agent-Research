import fs from "fs/promises";
import path from "path";

export async function getUploadedFiles(folder: string) {
  const files = await fs.readdir(folder);

  return files.map((file) => path.join(folder, file));
}
