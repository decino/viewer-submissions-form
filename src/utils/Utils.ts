export class ObjectUtils {

    public static getEnumAsObject(obj: Record<string, unknown>): Record<string, unknown> {
        const retObj: Record<string, unknown> = {};
        for (const [propertyKey, propertyValue] of Object.entries(obj)) {
            if (!Number.isNaN(Number(propertyKey))) {
                continue;
            }
            // @ts-ignore
            retObj[propertyValue] = propertyKey;
        }
        return retObj;
    }
}
