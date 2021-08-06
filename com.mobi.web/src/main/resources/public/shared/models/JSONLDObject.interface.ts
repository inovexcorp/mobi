/**
 * Represents any JSON-LD object. Only requires the `@id` and `@type` properties, but other properties are allowed
 */
export interface JSONLDObject {
    '@id': string,
    '@type': string[],
    [key: string]: any
}