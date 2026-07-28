import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";

import { researchRouter } from "./routes/research";
import { documentsRouter } from "./routes/documents";
import { reportsRouter } from "./routes/reports";
import { healthRouter } from "./routes/health";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

// View Engine Setup (EJS)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets
app.use(express.static(path.join(__dirname, "public")));

// Register API Routes
app.use("/research", researchRouter);
app.use("/documents", documentsRouter);
app.use("/reports", reportsRouter);
app.use("/health", healthRouter);

// Main Dashboard Interface
app.get("/", (_req: Request, res: Response) => {
  res.render("index", {
    title: "Multi-Agent Autonomous Deep Research System",
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Multi-Agent Research Express Backend`);
  console.log(` Running on: http://localhost:${PORT}`);
  console.log(` Health Check: http://localhost:${PORT}/health`);
  console.log(` Dashboard: http://localhost:${PORT}`);
  console.log(`====================================================`);
});

export default app;
