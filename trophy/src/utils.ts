export function abridgeScore(score: number): string {
	if (Math.abs(score) < 1) {
		return "0pt";
	}
	if (Math.abs(score) > 999) {
		return `${(Math.sign(score) * (Math.abs(score) / 1000)).toFixed(1)}kpt`;
	}
	return `${(Math.sign(score) * Math.abs(score)).toString()}pt`;
}

export const CONSTANTS = {
	DEFAULT_PANEL_SIZE: 110,
	DEFAULT_NO_BACKGROUND: false,
	DEFAULT_NO_FRAME: false,
};

export enum RANK {
	SECRET = "SECRET",
	SSS = "SSS",
	SS = "SS",
	S = "S",
	AAA = "AAA",
	AA = "AA",
	A = "A",
	B = "B",
	C = "C",
	UNKNOWN = "?",
}

export const RANK_ORDER = Object.values(RANK);
