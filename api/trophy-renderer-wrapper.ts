// Lightweight wrapper that re-exports the trophy renderer from the
// trophy subrepo. This creates a stable, static import path for the
// Vercel function so the renderer isn't dynamically resolved at runtime.
import { renderTrophySVG } from "../trophy/src/renderer";

export default renderTrophySVG;
