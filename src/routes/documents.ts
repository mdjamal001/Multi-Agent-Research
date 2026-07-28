import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import fs from "fs";

const storageDir = path.resolve("./uploads");
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, storageDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = `${Date.now()}-${randomUUID().substring(0, 8)}`;
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

export const documentsRouter = Router();

documentsRouter.post("/upload", upload.array("documents", 10), (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No documents uploaded." });
    }

    const uploaded = files.map((file) => ({
      id: path.basename(file.filename, path.extname(file.filename)),
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
    }));

    return res.json({
      message: "Documents uploaded successfully.",
      files: uploaded,
    });
  } catch (err: any) {
    console.error("Document upload error:", err);
    return res.status(500).json({ error: err?.message || "Failed to upload documents." });
  }
});
