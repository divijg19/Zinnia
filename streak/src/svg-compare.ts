import { normalizeSvg } from "./compare_helpers";

export type SvgCompareResult = {
	equal: boolean;
	diffs: Array<{ a: string; b: string }>;
};

export async function compareSvg(
	a: string,
	b: string,
): Promise<SvgCompareResult> {
	const na = normalizeSvg(a);
	const nb = normalizeSvg(b);

	if (na === nb) return { equal: true, diffs: [] };

	return { equal: false, diffs: [{ a: na, b: nb }] };
}
