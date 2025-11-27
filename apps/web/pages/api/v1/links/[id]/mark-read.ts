import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@linkwarden/prisma";
import verifyUser from "@/lib/api/verifyUser";
import getPermission from "@/lib/api/getPermission";
import { UsersAndCollections } from "@linkwarden/prisma/client";
import {
  enqueueArchiveJob,
} from "@linkwarden/lib/archiveQueue";

export default async function markRead(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (req.method !== "PUT") {
    res.setHeader("Allow", "PUT");
    return res.status(405).json({ response: "Method not allowed." });
  }

  if (process.env.NEXT_PUBLIC_DEMO === "true") {
    return res.status(400).json({
      response:
        "This action is disabled because this is a read-only demo of Linkwarden.",
    });
  }

  const linkId = Number(req.query.id);
  if (!Number.isFinite(linkId)) {
    return res.status(400).json({ response: "Invalid link id." });
  }

  const link = await prisma.link.findUnique({
    where: { id: linkId },
    include: { collection: true },
  });

  if (!link) {
    return res.status(404).json({ response: "Link not found." });
  }

  const collectionAccess = await getPermission({
    userId: user.id,
    collectionId: link.collectionId,
  });

  const memberHasAccess = collectionAccess?.members?.some(
    (member: UsersAndCollections) => member.userId === user.id && member.canUpdate
  );

  if (collectionAccess?.ownerId !== user.id && !memberHasAccess) {
    return res.status(403).json({ response: "Permission denied." });
  }

  const updatedLink = await prisma.link.update({
    where: { id: linkId },
    data: {
      readAt: new Date(),
    },
    select: {
      id: true,
      readAt: true,
      updatedAt: true,
      url: true,
      name: true,
      description: true,
      collectionId: true,
    },
  });

  await prisma.readingProgress.upsert({
    where: {
      userId_linkId: {
        userId: user.id,
        linkId,
      },
    },
    update: {
      percent: 100,
    },
    create: {
      userId: user.id,
      linkId,
      percent: 100,
    },
  });

  await enqueueArchiveJob(linkId);

  return res.status(200).json({
    response: {
      ...updatedLink,
    },
  });
}
