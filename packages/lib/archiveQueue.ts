import { Queue, JobsOptions } from "bullmq";
import { prisma } from "@linkwarden/prisma";

const redisUrl = process.env.REDIS_URL;

let queue: Queue | null = null;

if (redisUrl) {
  queue = new Queue("archive", {
    connection: { url: redisUrl },
  });
}

const defaultJobOptions: JobsOptions = {
  removeOnComplete: true,
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 1000,
  },
};

export async function enqueueArchiveJob(linkId: number) {
  if (!linkId || Number.isNaN(linkId)) return;

  if (queue) {
    await queue.add("archive", { linkId }, defaultJobOptions);
    return;
  }

  // Fallback to legacy flow by resetting archival fields.
  await prisma.link.update({
    where: { id: linkId },
    data: {
      image: null,
      pdf: null,
      readable: null,
      monolith: null,
      preview: null,
      lastPreserved: null,
      indexVersion: null,
      clientSide: false,
    },
  });
}

export function archiveQueueAvailable() {
  return Boolean(queue);
}
