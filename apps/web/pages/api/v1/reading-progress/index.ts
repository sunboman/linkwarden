import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@linkwarden/prisma";
import verifyUser from "@/lib/api/verifyUser";
import getPermission from "@/lib/api/getPermission";
import { UsersAndCollections } from "@linkwarden/prisma/client";

function parseLinkId(raw: unknown) {
  const asNumber = Number(raw);
  if (!Number.isFinite(asNumber) || asNumber <= 0) return null;
  return asNumber;
}

function serializeAnchor(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

function parseAnchor(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function ensureLinkAccess(userId: number, linkId: number) {
  const link = await prisma.link.findUnique({
    where: { id: linkId },
    include: { collection: true },
  });

  if (!link) {
    return { status: 404, message: "Link not found." } as const;
  }

  const collectionAccess = await getPermission({
    userId,
    collectionId: link.collectionId,
  });

  const memberHasAccess = collectionAccess?.members?.some(
    (member: UsersAndCollections) => member.userId === userId && member.canUpdate
  );

  if (collectionAccess?.ownerId !== userId && !memberHasAccess) {
    return { status: 403, message: "Permission denied." } as const;
  }

  return { status: 200, link } as const;
}

export default async function readingProgress(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (req.method === "GET") {
    const linkId = parseLinkId(req.query.linkId);
    if (!linkId) {
      return res.status(400).json({ response: "Invalid linkId." });
    }

    const access = await ensureLinkAccess(user.id, linkId);
    if (access.status !== 200) {
      return res.status(access.status).json({ response: access.message });
    }

    const progress = await prisma.readingProgress.findUnique({
      where: {
        userId_linkId: {
          userId: user.id,
          linkId,
        },
      },
    });

    return res.status(200).json({
      response: {
        percent: progress?.percent ?? 0,
        textQuote: parseAnchor(progress?.textQuote ?? null),
        textPosition: parseAnchor(progress?.textPosition ?? null),
        cssSelector: progress?.cssSelector ?? null,
        updatedAt: progress?.updatedAt ?? null,
      },
    });
  }

  if (req.method === "PUT") {
    if (process.env.NEXT_PUBLIC_DEMO === "true") {
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });
    }

    const { linkId: rawLinkId, percent, textQuote, textPosition, cssSelector } =
      req.body ?? {};
    const linkId = parseLinkId(rawLinkId);

    if (!linkId) {
      return res.status(400).json({ response: "Invalid linkId." });
    }

    if (typeof percent !== "number" || percent < 0 || percent > 100) {
      return res
        .status(400)
        .json({ response: "Percent must be a number between 0 and 100." });
    }

    const access = await ensureLinkAccess(user.id, linkId);
    if (access.status !== 200) {
      return res.status(access.status).json({ response: access.message });
    }

    const payload = {
      percent: Math.round(percent),
      textQuote: serializeAnchor(textQuote),
      textPosition: serializeAnchor(textPosition),
      cssSelector: serializeAnchor(cssSelector),
    };

    const progress = await prisma.readingProgress.upsert({
      where: {
        userId_linkId: {
          userId: user.id,
          linkId,
        },
      },
      update: payload,
      create: {
        ...payload,
        userId: user.id,
        linkId,
      },
    });

    return res.status(200).json({
      response: {
        percent: progress.percent,
        textQuote: parseAnchor(progress.textQuote ?? null),
        textPosition: parseAnchor(progress.textPosition ?? null),
        cssSelector: progress.cssSelector ?? null,
        updatedAt: progress.updatedAt,
      },
    });
  }

  res.setHeader("Allow", "GET, PUT");
  return res.status(405).json({ response: "Method not allowed." });
}
