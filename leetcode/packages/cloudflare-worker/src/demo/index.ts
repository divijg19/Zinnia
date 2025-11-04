// @ts-nocheck
import { supported as themes } from "../../core/src";
import html from "./demo.html";
import { fonts } from "./google-fonts";

const selected_font = Math.floor(Math.random() * fonts.length);

const themeOptions = Object.keys(themes)
	.map(
		(theme) =>
			`<option value="${theme}" ${theme === "light" ? "selected" : ""}>${theme}</option>`,
	)
	.join("");

const fontOptions = fonts
	.map(
		(font, i) =>
			`<option value="${font}" ${i === selected_font ? "selected" : ""}>${font}</option>`,
	)
	.join("");

export default html
	.replace("${theme_options}", themeOptions)
	.replace("${font_options}", fontOptions);
