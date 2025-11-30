// Declarations for dynamic demo import used by `leetcode/api/index.ts`.
// Placed inside `leetcode/api` so TypeScript (tsconfig include) picks it up.
declare module "../packages/cloudflare-worker/src/demo/index.js" {
    const demo: string;
    export default demo;
}
