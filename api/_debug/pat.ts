import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
	try {
		const keys = ["PAT_1", "PAT_2", "PAT_3", "PAT_4", "PAT_5", "GITHUB_TOKEN"];
		const found: Record<string, string | undefined> = {};
		for (const k of keys) found[k] = process.env[k];
		const masked = Object.fromEntries(
			Object.entries(found).map(([k, v]) => [
				k,
				v ? `${String(v).slice(0, 6)}…${String(v).slice(-4)}` : null,
			]),
		);
		// Report only the token keys this endpoint already inspects. Never
		// enumerate process.env wholesale: the route is public, and key names
		// alone disclose infrastructure (presence of STRIPE_*, AWS_*, DB URLs…).
		const presentKeys = Object.keys(masked).filter((k) => masked[k]);
		res.setHeader("content-type", "application/json");
		res
			.status(200)
			.send(JSON.stringify({ visible: masked, presentKeys }, null, 2));
	} catch (e) {
		res.status(500).send(String(e));
	}
}
