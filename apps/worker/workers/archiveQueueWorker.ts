import { Worker } from "bullmq";
import archiveHandler from "../lib/archiveHandler";
import { prisma } from "@linkwarden/prisma";
import { launchBrowser } from "../lib/browser";
import { LinkWithCollectionOwnerAndTags } from "@linkwarden/types";

const redisUrl = process.env.REDIS_URL;

export function startArchiveQueueWorker() {
  if (!redisUrl) {
    console.log("Archive queue disabled. Set REDIS_URL to enable BullMQ worker.");
    return;
  }

  const worker = new Worker(
    "archive",
    async (job) => {
      const linkId = Number(job.data?.linkId);
      if (!linkId) return;

      const link = await prisma.link.findUnique({
        where: { id: linkId },
        include: {
          collection: { include: { owner: true } },
          tags: true,
        },
      });

      if (!link) {
        return;
      }

      const browser = await launchBrowser();
      try {
        await archiveHandler(link as LinkWithCollectionOwnerAndTags, browser);
      } finally {
        if (browser?.isConnected()) {
          await browser.close();
        }
      }
    },
    {
      connection: { url: redisUrl },
    }
  );

  worker.on("completed", (job) => {
    console.log(`Archive job ${job.id} for link ${job.data?.linkId} completed.`);
  });

  worker.on("failed", (job, err) => {
    console.error(
      `Archive job ${job?.id} for link ${job?.data?.linkId} failed:`,
      err
    );
  });
}
