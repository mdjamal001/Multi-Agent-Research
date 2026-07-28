import { Router, Request, Response } from "express";
import { researchQueue } from "../queue/researchQueue";
import { publisher } from "../queue/redis";

export const healthRouter = Router();

healthRouter.get("/", async (_req: Request, res: Response) => {
  try {
    let redisStatus = "disconnected";
    try {
      const ping = await publisher.ping();
      if (ping === "PONG") redisStatus = "connected";
    } catch {
      redisStatus = "error";
    }

    const jobCounts = await researchQueue.getJobCounts(
      "active",
      "waiting",
      "completed",
      "failed",
      "delayed"
    );

    const isHealthy = redisStatus === "connected";

    return res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? "healthy" : "unhealthy",
      service: "Multi-Agent Research Backend API",
      timestamp: new Date().toISOString(),
      redis: redisStatus,
      queue: {
        name: researchQueue.name,
        counts: jobCounts,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      status: "unhealthy",
      error: err?.message || "Health check failed",
    });
  }
});
