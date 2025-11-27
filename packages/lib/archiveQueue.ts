import { prisma } from "@linkwarden/prisma";
import { Link } from "@linkwarden/prisma/client";

export async function enqueueArchiveJob(linkId: number) {
  if (!linkId || Number.isNaN(linkId)) return;

  // Reset archival fields to trigger the polling worker
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
  return false;
}
