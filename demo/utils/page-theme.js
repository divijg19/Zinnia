// Page chrome theme (light/dark) for the demo overview itself.
// Widget SVGs are isolated <img> documents and keep their own theme
// colors regardless of this setting.

export const STORAGE_KEY = "zinnia-demo-page-theme";

export function getStoredTheme() {
	try {
		const stored = window.localStorage?.getItem(STORAGE_KEY);
		return stored === "light" || stored === "dark" ? stored : null;
	} catch {
		return null;
	}
}

export function getPreferredTheme() {
	try {
		if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
			return "dark";
		}
	} catch {}
	return "light";
}

export function resolveTheme() {
	return getStoredTheme() ?? getPreferredTheme();
}

export function applyTheme(theme) {
	const next = theme === "dark" ? "dark" : "light";
	document.documentElement.dataset.pageTheme = next;
	try {
		window.localStorage?.setItem(STORAGE_KEY, next);
	} catch {}
	return next;
}

export function initPageTheme(button) {
	const updateButton = (theme) => {
		if (!button) return;
		const dark = theme === "dark";
		button.setAttribute("aria-pressed", String(dark));
		button.setAttribute(
			"aria-label",
			dark ? "Switch to light mode" : "Switch to dark mode",
		);
	};

	const current = applyTheme(resolveTheme());
	updateButton(current);

	button?.addEventListener("click", () => {
		const next =
			document.documentElement.dataset.pageTheme === "dark" ? "light" : "dark";
		updateButton(applyTheme(next));
	});
}
