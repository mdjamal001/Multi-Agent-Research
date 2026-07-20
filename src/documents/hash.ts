import crypto from "crypto";
import fs from "fs/promises";

export async function generateFileHash(filePath: string): Promise<string> {
  const fileBuffer = await fs.readFile(filePath);

  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}
