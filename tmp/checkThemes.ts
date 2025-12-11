import { renderGistCard } from "../stats/src/cards/gist.js";
import { getCardColors } from "../stats/src/common/utils.js";
import { themes } from "../stats/themes/index.js";

for (const name of Object.keys(themes) as unknown as string[]) {
    try {
        // cast to any to avoid narrow theme-name types from the themes import
        const colors = getCardColors({ theme: name as unknown as any });
        const svg = renderGistCard(
            {
                name: "test",
                nameWithOwner: "someone/test",
                description: "desc",
                language: "TypeScript",
                starsCount: 1,
                forksCount: 0,
            },
            { theme: name as unknown as any },
        );
        const m = svg.match(/<rect[\s\S]*?fill="([^"]+)"/);
        const fill = m ? m[1] : null;
        const expected = [`#${(themes as any)[name].bg_color}`, "url(#gradient)"];
        const ok = expected.includes(fill ?? "");
        if (!ok)
            console.log(
                "Mismatch for",
                name,
                "bgColorResolved=",
                colors.bgColor,
                "rectFill=",
                fill,
                "expected=",
                expected,
            );
        else console.log("OK", name, "->", fill);
    } catch (e) {
        if (e instanceof Error) {
            console.error("err for", name, e.message);
        } else {
            console.error("err for", name, String(e));
        }
    }
}
