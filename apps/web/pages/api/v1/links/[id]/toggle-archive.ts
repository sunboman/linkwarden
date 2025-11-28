import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@linkwarden/prisma";
import verifyUser from "@/lib/api/verifyUser";
import { UsersAndCollections } from "@linkwarden/prisma/client";
import getPermission from "@/lib/api/getPermission";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== "PUT") {
		return res.status(405).json({ response: "Method not allowed" });
	}

	const user = await verifyUser({ req, res });
	if (!user) return;

	const linkId = Number(req.query.id);

	const link = await prisma.link.findUnique({
		where: {
			id: linkId,
		},
		include: { collection: { include: { owner: true } } },
	});

	if (!link)
		return res.status(404).json({
			response: "Link not found.",
		});

	const collectionIsAccessible = await getPermission({
		userId: user.id,
		collectionId: link.collectionId,
	});

	const memberHasAccess = collectionIsAccessible?.members.some(
		(e: UsersAndCollections) => e.userId === user.id && e.canUpdate
	);

	if (!(collectionIsAccessible?.ownerId === user.id || memberHasAccess))
		return res.status(401).json({
			response: "Permission denied.",
		});

	if (process.env.NEXT_PUBLIC_DEMO === "true")
		return res.status(400).json({
			response:
				"This action is disabled because this is a read-only demo of Linkwarden.",
		});

	const updatedLink = await prisma.link.update({
		where: {
			id: linkId,
		},
		data: {
			archived: !link.archived,
		},
	});

	return res.status(200).json({
		response: updatedLink.archived ? "Link archived." : "Link unarchived.",
		data: updatedLink,
	});
}
