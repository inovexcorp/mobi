import { Group } from './group.interface';
import { User } from './user.interface';

/**
 * Represents an XACML Policy from the backend with some details extracted out.
 */
export interface Policy {
    policy: any,
    id: string,
    title: string,
    changed: boolean,
    everyone: boolean,
    selectedUsers: User[],
    selectedGroups: Group[]
}