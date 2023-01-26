/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { map, get, find, filter, set, noop, forEach, has, merge, remove, pull, assign, union, includes, flatten, without, some } from 'lodash';

import { ADMIN_USER_IRI, REST_PREFIX } from '../../constants';
import { FOAF, USER } from '../../prefixes';
import { Group } from '../models/group.interface';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { User } from '../models/user.interface';
import { UtilService } from './util.service';

/**
 * @class shared.UserManagerService
 *
 * A service that provides access to the Mobi users and groups REST endpoints for adding, removing, and editing Mobi
 * users and groups.
 */
@Injectable()
export class UserManagerService {
    userPrefix = REST_PREFIX + 'users';
    groupPrefix = REST_PREFIX + 'groups';

    constructor(private http: HttpClient, private util: UtilService) {}

    /**
     * `groups` holds a list of Group objects representing the groups in Mobi.
     * @type {Group[]}
     */
    groups: Group[] = [];
    /**
     * `users` holds a list of objects representing the users in Mobi. 
     * @type {User[]}
     */
    users: User[] = [];

    /**
     * Resets all state variables.
     */
    reset(): void {
        this.users = [];
        this.groups = [];
    }
    /**
     * Initializes the `users` and `groups` lists. Uses the results of the GET /mobirest/users and the results of
     * the GET /mobirest/groups endpoints to retrieve the user and group lists, respectively. If an error occurs in
     * either of the HTTP calls, logs the error on the console. Returns a promise.
     *
     * @returns {Promise} A Promise that indicates the function has completed.
     */
    initialize(): Promise<void> {
        return this.getUsers()
            .then(data => {
                this.users = map(data, (jsonld: JSONLDObject) => this.getUserObj(jsonld));
                return this.getGroups();
            }, error => Promise.reject(error))
            .then(data => {
                this.groups = map(data, (jsonld: JSONLDObject) => this.getGroupObj(jsonld));
            }, error => console.log(this.util.getErrorMessage(error)));
    }
    /**
     * Calls the GET /mobirest/users endpoint which retrieves a list of Users without their passwords.
     *
     * @returns {Promise} A promise that resolves with the list of Users or rejects with an error message.
     */
    getUsers(): Promise<JSONLDObject[]> {
        return this.http.get(this.userPrefix)
            .toPromise()
            .then((response: JSONLDObject[]) => response, error => this.util.rejectError(error));
    }
    /**
     * Calls the GET /mobirest/groups endpoint which retrieves a list of Groups.
     *
     * @returns {Promise} A promise that resolves with the list of Groups or rejects with an error message.
     */
    getGroups(): Promise<JSONLDObject[]> {
        return this.http.get(this.groupPrefix)
            .toPromise()
            .then((response: JSONLDObject[]) => response, error => this.util.rejectError(error));
    }
    /**
     * Finds the username of the user associated with the passed IRI. If it has not been found before, calls the GET
     * /mobirest/users/username endpoint and saves the result in the `users` list. If it has been found before,
     * grabs the username from the users list. Returns a Promise that resolves with the username and rejects if the
     * endpoint fails.
     *
     * @param {string} iri The user IRI to search for
     * @returns {Promise} A Promise that resolves with the username if the user was found; rejects with an error
     * message otherwise
     */
    getUsername(iri: string): Promise<string> {
        const user = find(this.users, { iri });
        if (user) {
            return Promise.resolve(user.username);
        } else {
            return this.http.get(this.userPrefix + '/username', {params: this.util.createHttpParams({ iri }), responseType: 'text'})
                .toPromise()
                .then((response: string) => {
                    set(find(this.users, {username: response}), 'iri', iri);
                    return response;
                }, error => this.util.rejectError(error));
        }
    }

    /**
     * Calls the POST /mobirest/users endpoint to add the passed user to Mobi. Returns a Promise that resolves if
     * the addition was successful and rejects with an error message if it was not. Updates the `users` list
     * appropriately.
     *
     * @param {User} newUser the new user to add
     * @param {string} password the password for the new user
     * @returns {Promise} A Promise that resolves if the request was successful; rejects with an error message
     * otherwise
     */
    addUser(newUser: User, password: string): Promise<void> {
        const fd = new FormData();
        fd.append('username', newUser.username);
        fd.append('password', password);
        forEach(get(newUser, 'roles', []), role => fd.append('roles', role));
        if (newUser.firstName) {
            fd.append('firstName', newUser.firstName);
        }
        if (newUser.lastName) {
            fd.append('lastName', newUser.lastName);
        }
        if (newUser.email) {
            fd.append('email', newUser.email);
        }

        return this.http.post(this.userPrefix, fd, {responseType: 'text'})
            .toPromise()
            .then(() => {
                return this.getUser(newUser.username);
            }, error => Promise.reject(error))
            .then(noop, error => this.util.rejectError(error));
    }
    /**
     * Calls the GET /mobirest/users/{username} endpoint to retrieve a Mobi user with passed username. Returns a
     * Promise that resolves with the result of the call if it was successful and rejects with an error message if
     * it was not.
     *
     * @param {string} username the username of the user to retrieve
     * @returns {Promise} A Promise that resolves with the user if the request was successful; rejects with an error
     * message otherwise
     */
    getUser(username: string): Promise<User> {
        return this.http.get(this.userPrefix + '/' + encodeURIComponent(username))
            .toPromise()
            .then((response: JSONLDObject) => {
                const userObj: User = this.getUserObj(response);
                const existing: User = find(this.users, {iri: userObj.iri});
                if (existing) {
                    merge(existing, userObj);
                } else {
                    this.users.push(userObj);
                }
                return userObj;
            }, error => this.util.rejectError(error));
    }
    /**
     * Calls the PUT /mobirest/users/{username} endpoint to update a Mobi user specified by the passed username with
     * the passed new user. Returns a Promise that resolves if it was successful and rejects with an error message
     * if it was not. Updates the `users` list appropriately.
     *
     * @param {string} username the username of the user to retrieve
     * @param {User} newUser an object containing all the new user information to save. The structure of the
     * object should be the same as the structure of the user objects in the `users` list
     * @returns {Promise} A Promise that resolves if the request was successful; rejects with an error message
     * otherwise
     */
    updateUser(username: string, newUser: User): Promise<void> {
        return this.http.put(this.userPrefix + '/' + encodeURIComponent(username), newUser.jsonld)
            .toPromise()
            .then(() => {
                assign(find(this.users, {username}), newUser);
            }, error => this.util.rejectError(error));
    }
    /**
     * Calls the POST /mobirest/users/{username}/password endpoint to change the password of a Mobi user specified
     * by the passed username. Requires the user's current password to succeed. Returns a Promise that resolves if
     * it was successful and rejects with an error message if it was not.
     *
     * @param {string} username the username of the user to update
     * @param {string} password the current password of the user
     * @param {string} newPassword the new password to save for the user
     * @returns {Promise} A Promise that resolves if the request was successful; rejects with an error message
     * otherwise
     */
    changePassword(username: string, password: string, newPassword: string): Promise<void> {
        const params = {
            currentPassword: password,
            newPassword
        };
        return this.http.post(this.userPrefix + '/' + encodeURIComponent(username) + '/password', null, {params: this.util.createHttpParams(params)})
            .toPromise()
            .then(noop, error => this.util.rejectErrorObject(error));
    }
    /**
     * Calls the PUT /mobirest/users/{username}/password endpoint to reset the password of a Mobi user specified by
     * the passed username. Can only be performed by an admin user. Returns a Promise that resolves if it was
     * successful and rejects with an error message if it was not.
     *
     * @param {string} username the username of the user to update
     * @param {string} newPassword the new password to save for the user
     * @returns {Promise} A Promise that resolves if the request was successful; rejects with an error message
     * otherwise
     */
    resetPassword(username: string, newPassword: string): Promise<void> {
        return this.http.put(this.userPrefix + '/' + encodeURIComponent(username) + '/password', null, {params: this.util.createHttpParams({ newPassword })})
            .toPromise()
            .then(noop, error => this.util.rejectError(error));
    }
    /**
     * Calls the DELETE /mobirest/users/{username} endpoint to remove the Mobi user with passed username. Returns a
     * Promise that resolves if the deletion was successful and rejects with an error message if it was not. Updates
     * the `groups` list appropriately.
     *
     * @param {string} username the username of the user to remove
     * @returns {Promise} A Promise that resolves if the request was successful; rejects with an error message
     * otherwise
     */
    deleteUser(username: string): Promise<void> {
        return this.http.delete(this.userPrefix + '/' + encodeURIComponent(username))
            .toPromise()
            .then(() => {
                remove(this.users, {username});
                forEach(this.groups, group => pull(group.members, username));
            }, error => this.util.rejectError(error));
    }
    /**
     * Calls the PUT /mobirest/users/{username}/roles endpoint to add the passed roles to the Mobi user specified by
     * the passed username. Returns a Promise that resolves if the addition was successful and rejects with an error
     * message if not. Updates the `users` list appropriately.
     *
     * @param {string} username the username of the user to add a role to
     * @param {string[]} roles the roles to add to the user
     * @returns {Promise} A Promise that resolves if the request is successful; rejects with an error message
     * otherwise
     */
    addUserRoles(username: string, roles: string[]): Promise<void> {
        return this.http.put(this.userPrefix + '/' + encodeURIComponent(username) + '/roles', null, {params: this.util.createHttpParams({ roles })})
            .toPromise()
            .then(() => {
                const user: User = find(this.users, {username});
                user.roles = union(get(user, 'roles', []), roles);
            }, error => this.util.rejectError(error));
    }
    /**
     * Calls the DELETE /mobirest/users/{username}/roles endpoint to remove the passed role from the Mobi user
     * specified by the passed username. Returns a Promise that resolves if the deletion was successful and rejects
     * with an error message if not. Updates the `users` list appropriately.
     *
     * @param {string} username the username of the user to remove a role from
     * @param {string} role the role to remove from the user
     * @returns {Promise} A Promise that resolves if the request is successful; rejects with an error message
     * otherwise
     */
    deleteUserRole(username: string, role: string): Promise<void> {
        return this.http.delete(this.userPrefix + '/' + encodeURIComponent(username) + '/roles', { params: this.util.createHttpParams({ role })})
            .toPromise()
            .then(() => {
                pull(get(find(this.users, {username}), 'roles'), role);
            }, error => this.util.rejectError(error));
    }
    /**
     * Calls the PUT /mobirest/users/{username}/groups endpoint to add the Mobi user specified by the passed
     * username to the group specified by the passed group title. Returns a Promise that resolves if the addition
     * was successful and rejects with an error message if not. Updates the `groups` list appropriately.
     *
     * @param {string} username the username of the user to add to the group
     * @param {string} groupTitle the title of the group to add the user to
     * @returns {Promise} A Promise that resolves if the request is successful; rejects with an error message
     * otherwise
     */
    addUserGroup(username: string, groupTitle: string): Promise<void> {
        return this.http.put(this.userPrefix + '/' + encodeURIComponent(username) + '/groups', null, {params: this.util.createHttpParams({ group: groupTitle })})
            .toPromise()
            .then(() => {
                const group: Group = find(this.groups, {title: groupTitle});
                group.members = union(get(group, 'members', []), [username]);
            }, error => this.util.rejectError(error));
    }
    /**
     * Calls the DELETE /mobirest/users/{username}/groups endpoint to remove the Mobi user specified by the passed
     * username from the group specified by the passed group title. Returns a Promise that resolves if the deletion
     * was successful and rejects with an error message if not. Updates the `groups` list appropriately.
     *
     * @param {string} username the username of the user to remove from the group
     * @param {string} groupTitle the title of the group to remove the user from
     * @returns {Promise} A Promise that resolves if the request is successful; rejects with an error message
     * otherwise
     */
    deleteUserGroup(username: string, groupTitle: string): Promise<void> {
        return this.http.delete(this.userPrefix + '/' + encodeURIComponent(username) + '/groups', {params: this.util.createHttpParams({ group: groupTitle })})
            .toPromise()
            .then(() => {
                const group: Group = find(this.groups, {title: groupTitle});
                group.members = without(get(group, 'members'), username);
            }, error => this.util.rejectError(error));
    }
    /**
     * Calls the POST /mobirest/groups endpoint to add the passed group to Mobi. Returns a Promise that resolves if
     * the addition was successful and rejects with an error message if it was not. Updates the `groups` list
     * appropriately.
     *
     * @param {Group} newGroup the new group to add
     * @returns {Promise} A Promise that resolves if the request was successful; rejects with an error message
     * otherwise
     */
    addGroup(newGroup: Group): Promise<void> {
        const fd = new FormData();
        fd.append('title', newGroup.title);
        forEach(get(newGroup, 'members', []), member => fd.append('members', member));
        if (has(newGroup, 'description')) {
            fd.append('description', newGroup.description);
        }
        if (has(newGroup, 'roles')) {
            forEach(get(newGroup, 'roles', []), role => fd.append('roles', role));
        }

        return this.http.post(this.groupPrefix, fd, {responseType: 'text'})
            .toPromise()
            .then(() => {
                return this.getGroup(newGroup.title);
            }, error => Promise.reject(error))
            .then(noop, error => this.util.rejectError(error));
    }
    /**
     * Calls the GET /mobirest/groups/{groupTitle} endpoint to retrieve a Mobi group with passed title. If the
     * group does not already exist in the `groups` list, adds it. Returns a Promise that resolves with the result
     * of the call if it was successful and rejects with an error message if it was not.
     *
     * @param {string} groupTitle the title of the group to retrieve
     * @returns {Promise} A Promise that resolves with the group if the request was successful; rejects with an error
     * message otherwise
     */
    getGroup(groupTitle: string): Promise<Group> {
        return this.http.get(this.groupPrefix + '/' + encodeURIComponent(groupTitle))
            .toPromise()
            .then((response: JSONLDObject) => {
                const groupObj: Group = this.getGroupObj(response);
                const existing: Group = find(this.groups, {iri: groupObj.iri});
                if (existing) {
                    merge(existing, groupObj);
                } else {
                    this.groups.push(groupObj);
                }
                return groupObj;
            }, error => this.util.rejectError(error));
    }
    /**
     * Calls the PUT /mobirest/groups/{groupTitle} endpoint to update a Mobi group specified by the passed title
     * with the passed new group. Returns a Promise that resolves if it was successful and rejects with an error
     * message if it was not. Updates the `groups` list appropriately.
     *
     * @param {string} groupTitle the title of the group to update
     * @param {Group} newGroup an object containing all the new group information to
     * save. The structure of the object should be the same as the structure of the group objects in the `groups`
     * list
     * @returns {Promise} A Promise that resolves if the request was successful; rejects with an error message
     * otherwise
     */
    updateGroup(groupTitle: string, newGroup: Group): Promise<void> {
        return this.http.put(this.groupPrefix + '/' + encodeURIComponent(groupTitle), newGroup.jsonld)
            .toPromise()
            .then(() => {
                assign(find(this.groups, {title: groupTitle}), newGroup);
            }, error => this.util.rejectError(error));
    }
    /**
     * Calls the DELETE /mobirest/groups/{groupTitle} endpoint to remove the Mobi group with passed title. Returns a
     * Promise that resolves if the deletion was successful and rejects with an error message if it was not. Updates
     * the `groups` list appropriately.
     *
     * @param {string} groupTitle the title of the group to remove
     * @returns {Promise} A Promise that resolves if the request was successful; rejects with an error message
     * otherwise
     */
    deleteGroup(groupTitle: string): Promise<void> {
        return this.http.delete(this.groupPrefix + '/' + encodeURIComponent(groupTitle))
            .toPromise()
            .then(() => {
                remove(this.groups, {title: groupTitle});
            }, error => this.util.rejectError(error));
    }
    /**
     * Calls the PUT /mobirest/groups/{groupTitle}/roles endpoint to add the passed roles to the Mobi group
     * specified by the passed title. Returns a Promise that resolves if the addition was successful and rejects
     * with an error message if not. Updates the `groups` list appropriately.
     *
     * @param {string} groupTitle the title of the group to add a role to
     * @param {string[]} roles the roles to add to the group
     * @returns {Promise} A Promise that resolves if the request is successful; rejects with an error message
     * otherwise
     */
    addGroupRoles(groupTitle: string, roles: string[]): Promise<void> {
        return this.http.put(this.groupPrefix + '/' + encodeURIComponent(groupTitle) + '/roles', null, {params: this.util.createHttpParams({ roles })})
            .toPromise()
            .then(() => {
                const group: Group = find(this.groups, {title: groupTitle});
                group.roles = union(get(group, 'roles', []), roles);
            }, error => this.util.rejectError(error));
    }
    /**
     * Calls the DELETE /mobirest/groups/{groupTitle}/roles endpoint to remove the passed role from the Mobi group
     * specified by the passed title. Returns a Promise that resolves if the deletion was successful and rejects
     * with an error message if not. Updates the `groups` list appropriately.
     *
     * @param {string} groupTitle the title of the group to remove a role from
     * @param {string} role the role to remove from the group
     * @returns {Promise} A Promise that resolves if the request is successful; rejects with an error message
     * otherwise
     */
    deleteGroupRole(groupTitle: string, role: string): Promise<void> {
        return this.http.delete(this.groupPrefix + '/' + encodeURIComponent(groupTitle) + '/roles', {params: this.util.createHttpParams({ role })})
            .toPromise()
            .then(() => {
                pull(get(find(this.groups, {title: groupTitle}), 'roles'), role);
            }, error => this.util.rejectError(error));
    }
    /**
     * Calls the GET /mobirest/groups/{groupTitle}/users endpoint to retrieve the list of users assigned to the
     * Mobi group specified by the passed title. Returns a Promise that resolves with the result of the call is
     * successful and rejects with an error message if it was not.
     *
     * @param {string} groupTitle the title of the group to retrieve users from
     * @returns {Promise} A Promise that resolves if the request is successful; rejects with an error message
     * otherwise
     */
    getGroupUsers(groupTitle: string): Promise<JSONLDObject[]> {
        return this.http.get(this.groupPrefix + '/' + encodeURIComponent(groupTitle) + '/users')
            .toPromise()
            .then((response: JSONLDObject[]) => response, error => this.util.rejectError(error));
    }
    /**
     * Calls the PUT /mobirest/groups/{groupTitle}/users endpoint to add the Mobi users specified by the passed
     * array of usernames to the group specified by the passed group title. Returns a Promise that resolves if the
     * addition was successful and rejects with an error message if not. Updates the `groups` list appropriately.
     *
     * @param {string} groupTitle the title of the group to add users to
     * @param {string[]} users an array of usernames of users to add to the group
     * @returns {Promise} A Promise that resolves if the request is successful; rejects with an error message
     * otherwise
     */
    addGroupUsers(groupTitle: string, users: string[]): Promise<void> {
        return this.http.put(this.groupPrefix + '/' + encodeURIComponent(groupTitle) + '/users', null, {params: this.util.createHttpParams({ users })})
            .toPromise()
            .then(() => {
                const group: Group = find(this.groups, {title: groupTitle});
                group.members = union(get(group, 'members', []), users);
            }, error => this.util.rejectError(error));
    }
    /**
     * Calls the DELETE /mobirest/groups/{groupTitle}/users endpoint to remove the Mobi user specified by the passed
     * username from the group specified by the passed group title. Returns a Promise that resolves if the deletion
     * was successful and rejects with an error message if not. Updates the `groups` list appropriately.
     *
     * @param {string} groupTitle the title of the group to remove the user from
     * @param {string} username the username of the user to remove from the group
     * @returns {Promise} A Promise that resolves if the request is successful; rejects with an error message
     * otherwise
     */
    deleteGroupUser(groupTitle: string, username: string): Promise<void> {
        return this.http.delete(this.groupPrefix + '/' + encodeURIComponent(groupTitle) + '/users', {params: this.util.createHttpParams({ user: username })})
            .toPromise()
            .then(() => {
                pull(get(find(this.groups, {title: groupTitle}), 'members'), username);
            }, error => this.util.rejectError(error));
    }
    /**
     * Tests whether the user with the passed username is an admin or not by checking the roles assigned to the user
     * itself and the roles assigned to any groups the user is a part of.
     *
     * @param {string} username the username of the user to test whether they are an admin
     * @returns {boolean} true if the user is an admin; false otherwise
     */
    isAdmin(username: string): boolean {
        if (includes(get(find(this.users, {username}), 'roles', []), 'admin')) {
            return true;
        } else {
            const userGroups: Group[] = filter(this.groups, group => {
                return includes(group.members, username);
            });
            return includes(flatten(map(userGroups, 'roles')), 'admin');
        }
    }
    /**
     * Tests whether the user identified by the passed IRI is the admin user.
     *
     * @param {string} userIri the IRI of the user to test whether they are the admin user
     * @returns {boolean} true if the user is the admin user; false otherwise
     */
    isAdminUser(userIri: string): boolean {
        return userIri === ADMIN_USER_IRI;
    }
    /**
     * Determines whether the provided JSON-LD object is an ExternalUser or not.
     *
     * @param {JSONLDObject} jsonld a JSON-LD object
     * @returns {boolean} true if the JSON-LD object is an ExternalUser; false otherwise
     */
    isExternalUser(jsonld: JSONLDObject): boolean {
        return get(jsonld, '@type', []).includes(USER + 'ExternalUser');
    }
    /**
     * Determines whether the provided JSON-LD object is an ExternalGroup or not.
     *
     * @param {JSONLDObject} jsonld a JSON-LD object
     * @returns {boolean} true if the JSON-LD object is ExternalGroup; false otherwise
     */
    isExternalGroup(jsonld: JSONLDObject): boolean {
        return get(jsonld, '@type', []).includes(USER + 'ExternalGroup');
    }
    /**
     * Returns a human readable form of a user. It will default to the "firstName lastName". If both of those
     * properties are not present, it will return the "username". If the username is not present, it will return
     * "[Not Available]".
     *
     * @param {User} userObject the object which represents a user.
     * @returns {string} a string to identify for the provided user.
     */
    getUserDisplay(userObject: User): string {
        return (!!get(userObject, 'firstName') && !!get(userObject, 'lastName')) ? userObject.firstName + ' ' + userObject.lastName : get(userObject, 'username') ? userObject.username : '[Not Available]';
    }
    /**
     * Returns a user object from the provided JSON-LD. 
     * 
     * @param {JSONLDObject} jsonld The JSON-LD representation of a User
     * @returns {User} An object representing a user
     */
    getUserObj(jsonld: JSONLDObject): User {
        return {
            jsonld,
            external: this.isExternalUser(jsonld),
            iri: jsonld['@id'],
            username: this.util.getPropertyValue(jsonld, USER + 'username'),
            firstName: this.util.getPropertyValue(jsonld, FOAF + 'firstName'),
            lastName: this.util.getPropertyValue(jsonld, FOAF + 'lastName'),
            email: this.util.getPropertyId(jsonld, FOAF + 'mbox'),
            roles: map(jsonld[USER + 'hasUserRole'], role => this.util.getBeautifulIRI(role['@id']).toLowerCase())
        };
    }
    /**
     * @ngdoc method
     * @name getGroupObj
     * @methodOf shared.service:userManagerService
     *
     * @description
     * Returns a group object from the provided JSON-LD. 
     * 
     * @param {JSONLDObject} jsonld The JSON-LD representation of a Group
     * @returns {Group} An object representing a group
     */
    getGroupObj(jsonld: JSONLDObject): Group {
        return {
            jsonld,
            external: this.isExternalGroup(jsonld),
            iri: jsonld['@id'],
            title: this.util.getDctermsValue(jsonld, 'title'),
            description: this.util.getDctermsValue(jsonld, 'description'),
            members: map(jsonld[FOAF + 'member'], member => {
                const user = find(this.users, {'iri': member['@id']});
                if (user !== undefined) {
                    return user.username;
                }
            }),
            roles: map(jsonld[USER + 'hasGroupRole'], role => this.util.getBeautifulIRI(role['@id']).toLowerCase())
        };
    }
    /**
     * Filters the provided list of {@link User Users} by the provided search string and returns the filtered list.
     * Returned list is ordered by username. Matches are made based on any of the following values:
     *   user.username
     *   user.firstName
     *   user.lastName
     *   user.firstName + " " + user.lastName
     *   user.lastName + " " + user.firstName
     *   user.lastName + ," " + user.firstName
     * 
     * @param {User[]} users The list of Users to be filtered
     * @param {string} searchString The string to search for in the User list. Can be undefined
     * @returns {User[]} A filtered sorted list of Users
     */
    filterUsers(users: User[], searchString: string): User[] {
        let results = users;
        if (searchString) {
            const searchTermLower = searchString.toLowerCase();

            results = filter(results, (userObj: User) => {
                const searchFields = [
                    userObj.username.toLowerCase(),
                    userObj.firstName.toLowerCase(),
                    userObj.lastName.toLowerCase(),
                    (userObj.firstName + ' ' + userObj.lastName).toLowerCase(),
                    (userObj.lastName + ' ' + userObj.firstName).toLowerCase(),
                    (userObj.lastName + ', ' + userObj.firstName).toLowerCase()
                ];
                return some(searchFields, searchField => searchField.includes(searchTermLower));
            });
        }

        return results.sort((user1: User, user2: User) => user1.username.localeCompare(user2.username));
    }
    /**
     * Filters the provided list of {@link Group Groups} by the provided search string and returns the filtered list.
     * Returned list is ordered by title.
     * 
     * @param {Group[]} groups The list of Groups to be filtered
     * @param {string} searchString The string to search for in the Group list. Can be undefined
     * @returns {Group[]} A filtered sorted list of Groups
     */
    filterGroups(groups: Group[], searchString: string): Group[] {
        let results = groups;
        if (searchString) {
            const searchTermLower = searchString.toLowerCase();
            results = filter(results, (groupObj: Group) => groupObj.title.toLowerCase().includes(searchTermLower));
        }

        return results.sort((group1: Group, group2: Group) => group1.title.localeCompare(group2.title));
    }
}
