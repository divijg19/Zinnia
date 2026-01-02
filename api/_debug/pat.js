export default function handler(_req, res) {
	try {
		const keys = ["PAT_1", "PAT_2", "PAT_3", "PAT_4", "PAT_5", "GITHUB_TOKEN"];
		const found = {};
		for (const k of keys)
			found[k] = process.env[k] ? String(process.env[k]) : undefined;
		const masked = Object.fromEntries(
			Object.entries(found).map(([k, v]) => [
				k,
				v ? `${String(v).slice(0, 6)}…${String(v).slice(-4)}` : null,
			]),
		);
		// Log for dev visibility
		try {
			console.debug(
				"_debug/pat: visible keys ->",
				Object.keys(masked).filter((k) => masked[k]),
			);
		} catch (_e) {}
		res.setHeader("content-type", "application/json");
		res
			.status(200)
			.send(
				JSON.stringify(
					{ visible: masked, presentKeys: Object.keys(process.env) },
					null,
					2,
				),
			);
	} catch (e) {
		res.status(500).send(String(e));
	}
}
