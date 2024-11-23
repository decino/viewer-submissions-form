import path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import type { Request } from "express";

export class ObjectUtils {
    public static getEnumAsObject(obj: Record<string, unknown>): Record<string, unknown> {
        const retObj: Record<string, unknown> = {};
        for (const [propertyKey, propertyValue] of Object.entries(obj)) {
            if (!Number.isNaN(Number(propertyKey))) {
                continue;
            }
            // @ts-expect-error: type check infers the wrong prop
            retObj[propertyValue] = propertyKey;
        }
        return retObj;
    }

    public static removeObjectFromArray<T>(arr: T[], predicate: (itm: T) => boolean): void {
        let arrLen = arr.length;
        while (arrLen--) {
            const currentItem = arr[arrLen];
            if (predicate(currentItem)) {
                arr.splice(arrLen, 1);
            }
        }
    }
}

export class NetworkUtils {
    public static getIp(req: Request): string {
        const useCf = process.env.USE_CLOUDFLARE === "true";
        let ip: string;
        if (useCf && req.headers["cf-connecting-ip"]) {
            ip = req.headers["cf-connecting-ip"] as string;
        } else {
            ip = req.ip as string;
        }
        return this.extractIp(ip);
    }

    private static extractIp(ipString: string): string {
        const ipSplit = ipString.split(":");
        if (ipSplit.length === 1 || (ipSplit.length > 2 && !ipString.includes("]"))) {
            return ipString;
        }
        if (ipSplit.length === 2) {
            return ipSplit[0];
        }
        return ipSplit
            .slice(0, ipSplit.length - 1)
            .join(":")
            .replace(/\[/, "")
            .replace(/]/, "");
    }
}

export const wadDir = `${path.dirname(fileURLToPath(import.meta.url))}/../../customWads`;
