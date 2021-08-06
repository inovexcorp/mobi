import { JSONLDObject } from './JSONLDObject.interface';

/**
 * Represents a group in the system. The `jsonld` and `iri` properties are optional as the interface is utilized for new
 * groups as well.
 */
export interface Group {
    jsonld?: JSONLDObject,
    external: boolean,
    iri?: string,
    title: string,
    description: string,
    roles: string[],
    members: string[]
}