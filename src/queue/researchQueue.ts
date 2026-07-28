import { Queue, QueueEvents } from "bullmq";
import { redisConfig, publisher } from "./redis";

import { DbCustomConfig } from "../graph/state";

export interface ResearchJobData {
  jobId: string;
  query: string;
  filePaths?: string[];
  dbConfig?: DbCustomConfig;
  createdAt: string;
}

export interface ResearchProgressEvent {
  jobId: string;
  status: "queued" | "indexing_documents" | "running_planner" | "retrieving_data" | "analyzing" | "generating_report" | "completed" | "failed";
  progress: number;
  message: string;
  timestamp: string;
  reportUrl?: string;
  error?: string;
}

export const RESEARCH_QUEUE_NAME = "research-queue";

export const researchQueue = new Queue<ResearchJobData>(RESEARCH_QUEUE_NAME, {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: false,
    removeOnFail: false,
  },
});

export const queueEvents = new QueueEvents(RESEARCH_QUEUE_NAME, {
  connection: redisConfig,
});

export async function publishJobProgress(event: ResearchProgressEvent) {
  const channel = `job-progress:${event.jobId}`;
  await publisher.publish(channel, JSON.stringify(event));

  // Also persist latest status in Redis hash for quick state recovery
  await publisher.hset(`job-meta:${event.jobId}`, {
    status: event.status,
    progress: event.progress.toString(),
    message: event.message,
    timestamp: event.timestamp,
    reportUrl: event.reportUrl || "",
    error: event.error || "",
  });
}

export async function getJobMeta(jobId: string) {
  return await publisher.hgetall(`job-meta:${jobId}`);
}
