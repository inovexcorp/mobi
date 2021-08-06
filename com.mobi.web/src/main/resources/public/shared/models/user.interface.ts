import { JSONLDObject } from './JSONLDObject.interface';

/**
 * Represents a user in the system. The `jsonld` and `iri` properties are optional as the interface is utilized for new
 * users as well.
 */
export interface User {
    jsonld?: JSONLDObject,
    external: boolean,
    iri?: string,
    username: string,
    firstName: string,
    lastName: string,
    email: string,
    roles: string[]
}