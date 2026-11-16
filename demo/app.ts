import { ThemeDemoApp } from "./theme-demo-app.js";

/**
 * The demo page entry point.
 *
 * The page itself lives in `theme-demo-app.ts`; this file only starts it,
 * so the application can be driven from a test without a DOM event.
 */
const app = new ThemeDemoApp();
document.addEventListener("DOMContentLoaded", () => app.init());
