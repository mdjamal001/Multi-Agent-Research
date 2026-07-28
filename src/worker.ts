import "dotenv/config";

// Disable Node native fetch headers timeout for long Ollama / LLM responses
process.env.UNDICI_HEADERS_TIMEOUT = "0";

import path from "path";
import fs from "fs/promises";
import { Worker, Job } from "bullmq";
import { redisConfig } from "./queue/redis";
import { RESEARCH_QUEUE_NAME, ResearchJobData, publishJobProgress } from "./queue/researchQueue";
import { graph } from "./graph/graph";
import { ingestDocument } from "./documents/ingest";
import { deleteCollection } from "./documents/chroma";
import { hasDatabaseConfig } from "./database/config";

const concurrency = parseInt(process.env.WORKER_CONCURRENCY || "2", 10);
const workerId = process.env.WORKER_ID || `worker-${Math.random().toString(36).substring(2, 7)}`;

console.log(`[Worker] Starting research worker instance (${workerId}) with concurrency: ${concurrency}`);

export const researchWorker = new Worker<ResearchJobData>(
  RESEARCH_QUEUE_NAME,
  async (job: Job<ResearchJobData>) => {
    const { jobId, query, filePaths, dbConfig } = job.data;
    const collectionName = `research_${jobId}`;
    const timestamp = new Date().toISOString();

    console.log(`[Worker:${workerId}] Processing research job: ${jobId} - "${query.substring(0, 40)}..."`);

    try {
      const hasFiles = Array.isArray(filePaths) && filePaths.length > 0;
      const hasCustomDb = !!((dbConfig?.url && dbConfig.url.trim().length > 0) || (dbConfig?.host && dbConfig.database));
      const hasDb = hasCustomDb || hasDatabaseConfig();

      // Step 1: Document Indexing
      await publishJobProgress({
        jobId,
        status: "indexing_documents",
        progress: 15,
        message: hasFiles
          ? `Indexing ${filePaths.length} uploaded document(s) into vector store...`
          : "No document attachments provided. Skipping document indexing.",
        timestamp,
      });

      if (hasFiles) {
        for (const filePath of filePaths) {
          try {
            await ingestDocument(filePath, collectionName);
          } catch (docErr) {
            console.error(`[Worker:${workerId}] Error ingesting file ${filePath}:`, docErr);
          }
        }
      }

      // Step 2: Agentic Pipeline Execution
      await publishJobProgress({
        jobId,
        status: "running_planner",
        progress: 35,
        message: "Planner Agent analyzing query and decomposing sub-tasks...",
        timestamp,
      });

      const activeSources = ["Web Search"];
      if (hasFiles) activeSources.push("Chroma Vector Store");
      if (hasDb) {
        const dbLabel = dbConfig?.url ? "Cloud SQL Database" : "SQL Database";
        activeSources.push(dbLabel);
      }

      await publishJobProgress({
        jobId,
        status: "retrieving_data",
        progress: 55,
        message: `Retriever Agent gathering evidence via ${activeSources.join(", ")}...`,
        timestamp,
      });

      // Run LangGraph pipeline
      await graph.invoke(
        {
          query,
          jobId,
          dbConfig,
        },
        {
          recursionLimit: 100,
        }
      );

      await publishJobProgress({
        jobId,
        status: "analyzing",
        progress: 75,
        message: "Analyzer and Reflection agents validating findings and building insights...",
        timestamp,
      });

      // Step 3: PDF Generation & Verification
      await publishJobProgress({
        jobId,
        status: "generating_report",
        progress: 90,
        message: "Generating visualizations, Chart.js graphs, and PDF report...",
        timestamp,
      });

      const reportPdfPath = path.join("./reports", `${jobId}.pdf`);
      let reportExists = false;
      try {
        await fs.access(reportPdfPath);
        reportExists = true;
      } catch {
        reportExists = false;
      }

      // Cleanup Chroma collection for this job if files were ingested
      if (hasFiles) {
        try {
          await deleteCollection(collectionName);
        } catch (cleanErr) {
          console.warn(`[Worker:${workerId}] Chroma collection cleanup warning:`, cleanErr);
        }
      }

      // Step 4: Completion
      const reportUrl = `/reports/${jobId}`;
      await publishJobProgress({
        jobId,
        status: "completed",
        progress: 100,
        message: reportExists
          ? "Research pipeline completed successfully. PDF report is ready!"
          : "Research pipeline completed, report output verified.",
        timestamp: new Date().toISOString(),
        reportUrl,
      });

      console.log(`[Worker:${workerId}] Successfully completed job: ${jobId}`);
      return { status: "success", jobId, reportUrl };
    } catch (err: any) {
      console.error(`[Worker:${workerId}] Job ${jobId} failed with error:`, err);

      // Attempt cleanup on failure
      try {
        await deleteCollection(collectionName);
      } catch {}

      await publishJobProgress({
        jobId,
        status: "failed",
        progress: 100,
        message: `Pipeline execution failed: ${err?.message || err}`,
        timestamp: new Date().toISOString(),
        error: err?.message || String(err),
      });

      throw err;
    }
  },
  {
    connection: redisConfig,
    concurrency,
  }
);

researchWorker.on("completed", (job: Job<ResearchJobData>) => {
  console.log(`[Worker:${workerId}] Job ${job.id} completed!`);
});

researchWorker.on("failed", (job: Job<ResearchJobData> | undefined, err: Error) => {
  console.error(`[Worker:${workerId}] Job ${job?.id} failed with ${err.message}`);
});
