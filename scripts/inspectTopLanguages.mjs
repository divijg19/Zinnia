import { renderTopLanguages } from "../stats/src/cards/top-languages.js";

const langs = {
	HTML: { color: "#0f0", name: "HTML", size: 200 },
	javascript: { color: "#0ff", name: "javascript", size: 200 },
	css: { color: "#ff0", name: "css", size: 100 },
};

const out = renderTopLanguages(langs, { layout: "donut" });
console.log(out);
