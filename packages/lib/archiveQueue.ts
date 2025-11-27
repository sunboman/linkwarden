import { prisma } from "@linkwarden/prisma";

export async function enqueueArchiveJob(linkId: number) {
  if (!linkId || Number.isNaN(linkId)) return;

  // Reset lastPreserved to trigger the polling worker
  await prisma.link.update({
    where: { id: linkId },
    data: {
      lastPreserved: null,
    },
  });
}
