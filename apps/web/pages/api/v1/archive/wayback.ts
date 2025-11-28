import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const session = await getSession({ req });
	if (!session) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const { url, mode } = req.query;

	if (!url || typeof url !== "string") {
		return res.status(400).json({ message: "Missing or invalid URL" });
	}

	try {
		const response = await fetch(
			`http://archive.org/wayback/available?url=${encodeURIComponent(url)}`
		);
		const data = await response.json();

		if (data.archived_snapshots && data.archived_snapshots.closest) {
			const snapshotUrl = data.archived_snapshots.closest.url;

			if (mode === "readable") {
				const snapshotResponse = await fetch(snapshotUrl);
				const html = await snapshotResponse.text();

				const window = new JSDOM("").window;
				const purify = DOMPurify(window);
				const cleanedUpContent = purify.sanitize(html);
				const dom = new JSDOM(cleanedUpContent, { url: snapshotUrl });

				const article = new Readability(dom.window.document).parse();

				return res.status(200).json({
					url: snapshotUrl,
					readable: article,
				});
			}

			return res.status(200).json({ url: snapshotUrl });
		} else {
			return res.status(404).json({ message: "No snapshot found" });
		}
	} catch (error) {
		console.error("Error fetching from Wayback Machine:", error);
		return res.status(500).json({ message: "Internal Server Error" });
	}
}
