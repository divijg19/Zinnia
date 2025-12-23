import { normalizeSvg } from "../../streak/src/compare_helpers";

export default {
    test(val: unknown) {
        return typeof val === "string" && /<svg[\s\S]*?>/i.test(val);
    },
    print(val: string) {
        try {
            return normalizeSvg(val as string);
        } catch {
            return String(val);
        }
    },
};
