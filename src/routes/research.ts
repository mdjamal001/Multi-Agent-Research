import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import { researchQueue, getJobMeta, publishJobProgress } from "../queue/researchQueue";
import { createRedisClient } from "../queue/redis";

export const researchRouter = Router();

// POST /research - Submit a new research task
researchRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { query, filePaths, dbConfig } = req.body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({ error: "Research query is required." });
    }

    const jobId = randomUUID();
    const createdAt = new Date().toISOString();

    const initialEvent = {
      jobId,
      status: "queued" as const,
      progress: 5,
      message: "Job received and enqueued for research worker processing...",
      timestamp: createdAt,
    };

    // Store initial metadata in Redis
    await publishJobProgress(initialEvent);

    // Enqueue job in BullMQ
    await researchQueue.add("research-task", {
      jobId,
      query: query.trim(),
      filePaths: Array.isArray(filePaths) ? filePaths : [],
      dbConfig: dbConfig && typeof dbConfig === "object" ? dbConfig : undefined,
      createdAt,
    });

    return res.status(202).json({
      jobId,
      status: "queued",
      message: "Research job successfully enqueued.",
      streamUrl: `/research/${jobId}/stream`,
      statusUrl: `/research/${jobId}`,
    });
  } catch (err: any) {
    console.error("Error enqueuing research job:", err);
    return res.status(500).json({ error: err?.message || "Failed to enqueue research job." });
  }
});

// POST /research/queue/clear - Clear all jobs from BullMQ research queue
researchRouter.post("/queue/clear", async (_req: Request, res: Response) => {
  try {
    await researchQueue.drain();
    await researchQueue.obliterate({ force: true });
    return res.json({ message: "Research job queue cleared successfully." });
  } catch (err: any) {
    console.error("Error clearing queue:", err);
    return res.status(500).json({ error: err?.message || "Failed to clear queue." });
  }
});

// GET /research/:jobId - Get current status of a job
researchRouter.get("/:jobId", async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const meta = await getJobMeta(jobId);

    if (!meta || !meta.status) {
      return res.status(404).json({ error: "Research job not found." });
    }

    return res.json({
      jobId,
      status: meta.status,
      progress: parseInt(meta.progress || "0", 10),
      message: meta.message,
      timestamp: meta.timestamp,
      reportUrl: meta.reportUrl || null,
      error: meta.error || null,
    });
  } catch (err: any) {
    console.error("Error fetching job status:", err);
    return res.status(500).json({ error: "Failed to fetch job status." });
  }
});

// GET /research/:jobId/stream - Real-time Server-Sent Events (SSE) progress stream
researchRouter.get("/:jobId/stream", async (req: Request, res: Response) => {
  const { jobId } = req.params;

  // Set SSE Headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const subscriber = createRedisClient();
  const channel = `job-progress:${jobId}`;

  // Send current state immediately on connection
  const initialMeta = await getJobMeta(jobId);
  if (initialMeta && initialMeta.status) {
    res.write(`data: ${JSON.stringify({
      jobId,
      status: initialMeta.status,
      progress: parseInt(initialMeta.progress || "0", 10),
      message: initialMeta.message,
      timestamp: initialMeta.timestamp,
      reportUrl: initialMeta.reportUrl || null,
      error: initialMeta.error || null,
    })}\n\n`);
  }

  // Subscribe to Redis PubSub channel for real-time updates
  try {
    await subscriber.subscribe(channel);
  } catch (err) {
    console.error(`[SSE] Subscription error on channel ${channel}:`, err);
  }

  subscriber.on("message", (subChannel: string, message: string) => {
    if (subChannel === channel) {
      res.write(`data: ${message}\n\n`);

      try {
        const parsed = JSON.parse(message);
        if (parsed.status === "completed" || parsed.status === "failed") {
          // Close connection gracefully when job finishes
          setTimeout(() => {
            subscriber.unsubscribe(channel);
            subscriber.quit();
            res.end();
          }, 1000);
        }
      } catch {}
    }
  });

  // Client disconnect cleanup
  req.on("close", () => {
    subscriber.unsubscribe(channel);
    subscriber.quit();
  });
});
