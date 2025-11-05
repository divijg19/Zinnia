export default async function handler(_req: any, res: any) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(200);
    res.send("ok");
}
