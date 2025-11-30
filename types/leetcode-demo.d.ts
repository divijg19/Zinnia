// Global declaration for the demo module imported by `leetcode/api/index.ts`.
// Placed under `types/` so it is picked up by the root tsconfig include.
declare module "../packages/cloudflare-worker/src/demo/index.js" {
    const demo: string;
    export default demo;
}
