import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendErrorSvg, type ErrorCode } from "../lib/errors.js";
import { filterThemeParam, getUsername } from "../lib/params.js";
import { getGithubPAT } from "../lib/tokens.js";
import {
    resolveCacheSeconds,
    setCacheHeaders,
    setEtagAndMaybeSend304,
    setSvgHeaders,
} from "./_utils.js";

interface StatsHandlerConfig {
    importPath: string;
    patErrorMessage: string;
    usernameErrorCode: ErrorCode;
    internalErrorMessage: string;
    internalErrorCode: ErrorCode;
    cacheEnvVars: string[];
    defaultCacheSeconds: number;
    defaultUrl: string;
}

/**
 * Shared handler wrapper for stats-based endpoints to reduce code duplication
 */
export function createStatsHandler(
    config: StatsHandlerConfig,
): (req: VercelRequest, res: VercelResponse) => Promise<any> {
    return async (req: VercelRequest, res: VercelResponse) => {
        try {
            if (!getGithubPAT()) {
                return sendErrorSvg(
                    req,
                    res,
                    config.patErrorMessage,
                    "STATS_RATE_LIMIT",
                );
            }

            // Dynamic import of the handler
            const { default: requestHandler } = (await import(
                config.importPath
            )) as unknown as { default: (req: Request) => Promise<Response> };

            // Build URL from request
            const proto = (req.headers["x-forwarded-proto"] || "https").toString();
            const host = (req.headers.host || "localhost").toString();
            const url = new URL(
                (req.url as string) || config.defaultUrl,
                `${proto}://${host}`,
            );

            // Validate username
            const uname = getUsername(url, ["username"]);
            if (!uname) {
                return sendErrorSvg(
                    req,
                    res,
                    "Missing or invalid ?username=",
                    config.usernameErrorCode,
                );
            }

            filterThemeParam(url);

            // Build Headers from request
            const headers = new Headers();
            for (const [k, v] of Object.entries(
                req.headers as Record<string, string>,
            )) {
                if (typeof v === "string") headers.set(k, v);
            }

            // Call the handler
            const webReq = new Request(url.toString(), {
                method: req.method,
                headers,
            });
            const webRes = await requestHandler(webReq as unknown as Request);
            const body = await webRes.text();

            // Set response headers
            setSvgHeaders(res);
            const cacheSeconds = resolveCacheSeconds(
                url,
                config.cacheEnvVars,
                config.defaultCacheSeconds,
            );

            const cacheHeader = webRes.headers.get("cache-control");
            if (cacheHeader) {
                res.setHeader("Cache-Control", cacheHeader);
            } else {
                setCacheHeaders(res, cacheSeconds);
            }

            res.status(200);
            if (setEtagAndMaybeSend304(req.headers as any, res, body)) {
                return res.send("");
            }
            return res.send(body);
        } catch (_err) {
            return sendErrorSvg(
                req,
                res,
                config.internalErrorMessage,
                config.internalErrorCode,
            );
        }
    };
}
