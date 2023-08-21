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
import { Injectable } from '@angular/core';
import { get, find, filter, set, forEach, has, merge, remove, pull, assign, union, includes, flatten, without, some } from 'lodash';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { ADMIN_USER_IRI, REST_PREFIX } from '../../constants';
import { FOAF, USER } from '../../prefixes';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { Group } from '../models/group.interface';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { User } from '../models/user.interface';
import { createHttpParams, getBeautifulIRI, getDctermsValue, getPropertyId, getPropertyValue, handleError, handleErrorObject } from '../utility';

/**
 * @class shared.UserManagerService
 *
 * A service that provides access to the Mobi users and groups REST endpoints for adding, removing, and editing Mobi
 * users and groups.
 */
@Injectable()
export class UserManagerService {
    userPrefix = `${REST_PREFIX}users`;
    groupPrefix = `${REST_PREFIX}groups`;

    constructor(private http: HttpClient, private spinnerSvc: ProgressSpinnerService) {}

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
     * either of the HTTP calls, logs the error on the console. Returns an observable.
     *
     * @returns {Observable} An Observable that indicates the function has completed.
     */
    initialize(): Observable<null> {
        return this.getUsers()
            .pipe(
                switchMap(data => {
                    this.users = data.map((jsonld: JSONLDObject) => this.getUserObj(jsonld));
                    return this.getGroups();
                }),
                map(data => {
                    this.groups = data.map((jsonld: JSONLDObject) => this.getGroupObj(jsonld));
                    return null;
                }),
                catchError(error => {
                    console.error(error.statusText);
                    return of(null);
                })
            );
    }
    /**
     * Calls the GET /mobirest/users endpoint which retrieves a list of Users without their passwords.
     *
     * @returns {Observable} An Observable that resolves with the list of Users or rejects with an error message.
     */
    getUsers(): Observable<JSONLDObject[]> {
        return this.spinnerSvc.track(this.http.get<JSONLDObject[]>(this.userPrefix))
            .pipe(catchError(handleError));
    }
    /**
     * Calls the GET /mobirest/groups endpoint which retrieves a list of Groups.
     *
     * @returns {Observable} An Observable that resolves with the list of Groups or rejects with an error message.
     */
    getGroups(): Observable<JSONLDObject[]> {
        return this.spinnerSvc.track(this.http.get<JSONLDObject[]>(this.groupPrefix))
            .pipe(catchError(handleError));
    }
    /**
     * Finds the username of the user associated with the passed IRI. If it has not been found before, calls the GET
     * /mobirest/users/username endpoint and saves the result in the `users` list. If it has been found before,
     * grabs the username from the users list. Returns an observable that resolves with the username and rejects if the
     * endpoint fails.
     *
     * @param {string} iri The user IRI to search for
     * @returns {Observable} An Observable that resolves with the username if the user was found; rejects with an error
     * message otherwise
     */
    getUsername(iri: string): Observable<string> {
        const user = find(this.users, { iri });
        if (user) {
            return of(user.username);
        } else {
            return this.spinnerSvc.track(this.http.get(`${this.userPrefix}/username`, {
              params: createHttpParams({ iri }), 
              responseType: 'text'
            })).pipe(
                catchError(handleError),
                map((response: string) => {
                    set(find(this.users, {username: response}), 'iri', iri);
                    return response;
                })
            );
        }
    }

    /**
     * Calls the POST /mobirest/users endpoint to add the passed user to Mobi. Returns an observable that resolves if
     * the addition was successful and rejects with an error message if it was not. Updates the `users` list
     * appropriately.
     *
     * @param {User} newUser the new user to add
     * @param {string} password the password for the new user
     * @returns {Observable} An Observable that resolves if the request was successful; rejects with an error message
     * otherwise
     */
    addUser(newUser: User, password: string): Observable<void> {
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

        return this.spinnerSvc.track(this.http.post(this.userPrefix, fd, {responseType: 'text'}))
            .pipe(
                catchError(handleError),
                switchMap(() => {
                    return this.getUser(newUser.username);
                }),
                map(() => {})
            );
    }
    /**
     * Calls the GET /mobirest/users/{username} endpoint to retrieve a Mobi user with passed username. Returns a
     * Promise that resolves with the result of the call if it was successful and rejects with an error message if
     * it was not.
     *
     * @param {string} username the username of the user to retrieve
     * @returns {Observable} An Observable that resolves with the user if the request was successful; rejects with an error
     * message otherwise
     */
    getUser(username: string): Observable<User> {
        return this.spinnerSvc.track(this.http.get<JSONLDObject>(`${this.userPrefix}/${encodeURIComponent(username)}`))
            .pipe(
                catchError(handleError),
                map((response: JSONLDObject) => {
                    const userObj: User = this.getUserObj(response);
                    const existing: User = find(this.users, {iri: userObj.iri});
                    if (existing) {
                        merge(existing, userObj);
                    } else {
                        this.users.push(userObj);
                    }
                    return userObj;
                })
            );
    }
    /**
     * Calls the PUT /mobirest/users/{username} endpoint to update a Mobi user specified by the passed username with
     * the passed new user. Returns an observable that resolves if it was successful and rejects with an error message
     * if it was not. Updates the `users` list appropriately.
     *
     * @param {string} username the username of the user to retrieve
     * @param {User} newUser an object containing all the new user information to save. The structure of the
     * object should be the same as the structure of the user objects in the `users` list
     * @returns {Observable} An Observable that resolves if the request was successful; rejects with an error message
     * otherwise
     */
    updateUser(username: string, newUser: User): Observable<void> {
        return this.spinnerSvc.track(this.http.put(`${this.userPrefix}/${encodeURIComponent(username)}`, newUser.jsonld))
            .pipe(
                catchError(handleError),
                map(() => {
                    assign(find(this.users, {username}), newUser);
                })
            );
    }
    /**
     * Calls the POST /mobirest/users/{username}/password endpoint to change the password of a Mobi user specified
     * by the passed username. Requires the user's current password to succeed. Returns an observable that resolves if
     * it was successful and rejects with an error message if it was not.
     *
     * @param {string} username the username of the user to update
     * @param {string} password the current password of the user
     * @param {string} newPassword the new password to save for the user
     * @returns {Observable} An Observable that resolves if the request was successful; rejects with an error message
     * otherwise
     */
    changePassword(username: string, password: string, newPassword: string): Observable<void> {
        const params = {
            currentPassword: password,
            newPassword
        };
        return this.spinnerSvc.track(this.http.post(`${this.userPrefix}/${encodeURIComponent(username)}/password`, null, 
          {params: createHttpParams(params)})).pipe(
            catchError(handleErrorObject),
            map(() => {})
        );
    }
    /**
     * Calls the PUT /mobirest/users/{username}/password endpoint to reset the password of a Mobi user specified by
     * the passed username. Can only be performed by an admin user. Returns an observable that resolves if it was
     * successful and rejects with an error message if it was not.
     *
     * @param {string} username the username of the user to update
     * @param {string} newPassword the new password to save for the user
     * @returns {Observable} An Observable that resolves if the request was successful; rejects with an error message
     * otherwise
     */
    resetPassword(username: string, newPassword: string): Observable<void> {
        return this.spinnerSvc.track(this.http.put(`${this.userPrefix}/${encodeURIComponent(username)}/password`, null, 
          {params: createHttpParams({ newPassword })})).pipe(
            catchError(handleError),
            map(() => {})
        );
    }
    /**
     * Calls the DELETE /mobirest/users/{username} endpoint to remove the Mobi user with passed username. Returns a
     * Promise that resolves if the deletion was successful and rejects with an error message if it was not. Updates
     * the `groups` list appropriately.
     *
     * @param {string} username the username of the user to remove
     * @returns {Observable} An Observable that resolves if the request was successful; rejects with an error message
     * otherwise
     */
    deleteUser(username: string): Observable<void> {
        return this.spinnerSvc.track(this.http.delete(`${this.userPrefix}/${encodeURIComponent(username)}`))
            .pipe(
                catchError(handleError),
                map(() => {
                    remove(this.users, {username});
                    forEach(this.groups, group => pull(group.members, username));
                })
            );
    }
    /**
     * Calls the PUT /mobirest/users/{username}/roles endpoint to add the passed roles to the Mobi user specified by
     * the passed username. Returns an observable that resolves if the addition was successful and rejects with an error
     * message if not. Updates the `users` list appropriately.
     *
     * @param {string} username the username of the user to add a role to
     * @param {string[]} roles the roles to add to the user
     * @returns {Observable} An Observable that resolves if the request is successful; rejects with an error message
     * otherwise
     */
    addUserRoles(username: string, roles: string[]): Observable<void> {
        return this.spinnerSvc.track(this.http.put(`${this.userPrefix}/${encodeURIComponent(username)}/roles`, null, 
          {params: createHttpParams({ roles })}))
            .pipe(
                catchError(handleError),
                map(() => {
                    const user: User = find(this.users, {username});
                    user.roles = union(get(user, 'roles', []), roles);
                })
            );
    }
    /**
     * Calls the DELETE /mobirest/users/{username}/roles endpoint to remove the passed role from the Mobi user
     * specified by the passed username. Returns an observable that resolves if the deletion was successful and rejects
     * with an error message if not. Updates the `users` list appropriately.
     *
     * @param {string} username the username of the user to remove a role from
     * @param {string} role the role to remove from the user
     * @returns {Observable} An Observable that resolves if the request is successful; rejects with an error message
     * otherwise
     */
    deleteUserRole(username: string, role: string): Observable<void> {
        return this.spinnerSvc.track(this.http.delete(`${this.userPrefix}/${encodeURIComponent(username)}/roles`, 
          { params: createHttpParams({ role })}))
            .pipe(
                catchError(handleError),
                map(() => {
                    pull(get(find(this.users, {username}), 'roles'), role);
                })
            );
    }
    /**
     * Calls the PUT /mobirest/users/{username}/groups endpoint to add the Mobi user specified by the passed
     * username to the group specified by the passed group title. Returns an observable that resolves if the addition
     * was successful and rejects with an error message if not. Updates the `groups` list appropriately.
     *
     * @param {string} username the username of the user to add to the group
     * @param {string} groupTitle the title of the group to add the user to
     * @returns {Observable} An Observable that resolves if the request is successful; rejects with an error message
     * otherwise
     */
    addUserGroup(username: string, groupTitle: string): Observable<void> {
        return this.spinnerSvc.track(this.http.put(`${this.userPrefix}/${encodeURIComponent(username)}/groups`, null, 
          {params: createHttpParams({ group: groupTitle })}))
            .pipe(
                catchError(handleError),
                map(() => {
                    const group: Group = find(this.groups, {title: groupTitle});
                    group.members = union(get(group, 'members', []), [username]);
                })
            );
    }
    /**
     * Calls the DELETE /mobirest/users/{username}/groups endpoint to remove the Mobi user specified by the passed
     * username from the group specified by the passed group title. Returns an observable that resolves if the deletion
     * was successful and rejects with an error message if not. Updates the `groups` list appropriately.
     *
     * @param {string} username the username of the user to remove from the group
     * @param {string} groupTitle the title of the group to remove the user from
     * @returns {Observable} An Observable that resolves if the request is successful; rejects with an error message
     * otherwise
     */
    deleteUserGroup(username: string, groupTitle: string): Observable<void> {
        return this.spinnerSvc.track(this.http.delete(`${this.userPrefix}/${encodeURIComponent(username)}/groups`, 
          {params: createHttpParams({ group: groupTitle })}))
            .pipe(
                catchError(handleError),
                map(() => {
                    const group: Group = find(this.groups, {title: groupTitle});
                    group.members = without(get(group, 'members'), username);
                })
            );
    }
    /**
     * Calls the POST /mobirest/groups endpoint to add the passed group to Mobi. Returns an observable that resolves if
     * the addition was successful and rejects with an error message if it was not. Updates the `groups` list
     * appropriately.
     *
     * @param {Group} newGroup the new group to add
     * @returns {Observable} An Observable that resolves if the request was successful; rejects with an error message
     * otherwise
     */
    addGroup(newGroup: Group): Observable<void> {
        const fd = new FormData();
        fd.append('title', newGroup.title);
        forEach(get(newGroup, 'members', []), member => fd.append('members', member));
        if (has(newGroup, 'description')) {
            fd.append('description', newGroup.description);
        }
        if (has(newGroup, 'roles')) {
            forEach(get(newGroup, 'roles', []), role => fd.append('roles', role));
        }

        return this.spinnerSvc.track(this.http.post(this.groupPrefix, fd, {responseType: 'text'}))
            .pipe(
                catchError(handleError),
                switchMap(() => {
                    return this.getGroup(newGroup.title);
                }),
                map(() => {})
            );
    }
    /**
     * Calls the GET /mobirest/groups/{groupTitle} endpoint to retrieve a Mobi group with passed title. If the
     * group does not already exist in the `groups` list, adds it. Returns an observable that resolves with the result
     * of the call if it was successful and rejects with an error message if it was not.
     *
     * @param {string} groupTitle the title of the group to retrieve
     * @returns {Observable} An Observable that resolves with the group if the request was successful; rejects with an error
     * message otherwise
     */
    getGroup(groupTitle: string): Observable<Group> {
        return this.spinnerSvc.track(this.http.get<JSONLDObject>(`${this.groupPrefix}/${encodeURIComponent(groupTitle)}`))
            .pipe(
                catchError(handleError),
                map((response: JSONLDObject) => {
                    const groupObj: Group = this.getGroupObj(response);
                    const existing: Group = find(this.groups, {iri: groupObj.iri});
                    if (existing) {
                        merge(existing, groupObj);
                    } else {
                        this.groups.push(groupObj);
                    }
                    return groupObj;
                })
            );
    }
    /**
     * Calls the PUT /mobirest/groups/{groupTitle} endpoint to update a Mobi group specified by the passed title
     * with the passed new group. Returns an observable that resolves if it was successful and rejects with an error
     * message if it was not. Updates the `groups` list appropriately.
     *
     * @param {string} groupTitle the title of the group to update
     * @param {Group} newGroup an object containing all the new group information to
     * save. The structure of the object should be the same as the structure of the group objects in the `groups`
     * list
     * @returns {Observable} An Observable that resolves if the request was successful; rejects with an error message
     * otherwise
     */
    updateGroup(groupTitle: string, newGroup: Group): Observable<void> {
        return this.spinnerSvc.track(this.http.put(`${this.groupPrefix}/${encodeURIComponent(groupTitle)}`, 
          newGroup.jsonld))
            .pipe(
                catchError(handleError),
                map(() => {
                    assign(find(this.groups, {title: groupTitle}), newGroup);
                })
            );
    }
    /**
     * Calls the DELETE /mobirest/groups/{groupTitle} endpoint to remove the Mobi group with passed title. Returns a
     * Promise that resolves if the deletion was successful and rejects with an error message if it was not. Updates
     * the `groups` list appropriately.
     *
     * @param {string} groupTitle the title of the group to remove
     * @returns {Observable} An Observable that resolves if the request was successful; rejects with an error message
     * otherwise
     */
    deleteGroup(groupTitle: string): Observable<void> {
        return this.spinnerSvc.track(this.http.delete(`${this.groupPrefix}/${encodeURIComponent(groupTitle)}`))
            .pipe(
                catchError(handleError),
                map(() => {
                    remove(this.groups, {title: groupTitle});
                })
            );
    }
    /**
     * Calls the PUT /mobirest/groups/{groupTitle}/roles endpoint to add the passed roles to the Mobi group
     * specified by the passed title. Returns an observable that resolves if the addition was successful and rejects
     * with an error message if not. Updates the `groups` list appropriately.
     *
     * @param {string} groupTitle the title of the group to add a role to
     * @param {string[]} roles the roles to add to the group
     * @returns {Observable} An Observable that resolves if the request is successful; rejects with an error message
     * otherwise
     */
    addGroupRoles(groupTitle: string, roles: string[]): Observable<void> {
        return this.spinnerSvc.track(this.http.put(`${this.groupPrefix}/${encodeURIComponent(groupTitle)}/roles`, null, 
          {params: createHttpParams({ roles })}))
            .pipe(
                catchError(handleError),
                map(() => {
                    const group: Group = find(this.groups, {title: groupTitle});
                    group.roles = union(get(group, 'roles', []), roles);
                })
            );
    }
    /**
     * Calls the DELETE /mobirest/groups/{groupTitle}/roles endpoint to remove the passed role from the Mobi group
     * specified by the passed title. Returns an observable that resolves if the deletion was successful and rejects
     * with an error message if not. Updates the `groups` list appropriately.
     *
     * @param {string} groupTitle the title of the group to remove a role from
     * @param {string} role the role to remove from the group
     * @returns {Observable} An Observable that resolves if the request is successful; rejects with an error message
     * otherwise
     */
    deleteGroupRole(groupTitle: string, role: string): Observable<void> {
        return this.spinnerSvc.track(this.http.delete(`${this.groupPrefix}/${encodeURIComponent(groupTitle)}/roles`, 
          {params: createHttpParams({ role })}))
            .pipe(
                catchError(handleError),
                map(() => {
                    pull(get(find(this.groups, {title: groupTitle}), 'roles'), role);
                })
            );
    }
    /**
     * Calls the GET /mobirest/groups/{groupTitle}/users endpoint to retrieve the list of users assigned to the
     * Mobi group specified by the passed title. Returns an observable that resolves with the result of the call is
     * successful and rejects with an error message if it was not.
     *
     * @param {string} groupTitle the title of the group to retrieve users from
     * @returns {Observable} An Observable that resolves if the request is successful; rejects with an error message
     * otherwise
     */
    getGroupUsers(groupTitle: string): Observable<JSONLDObject[]> {
        return this.spinnerSvc.track(this.http.get<JSONLDObject[]>(`${this.groupPrefix}/${encodeURIComponent(groupTitle)}/users`))
            .pipe(catchError(handleError));
    }
    /**
     * Calls the PUT /mobirest/groups/{groupTitle}/users endpoint to add the Mobi users specified by the passed
     * array of usernames to the group specified by the passed group title. Returns an observable that resolves if the
     * addition was successful and rejects with an error message if not. Updates the `groups` list appropriately.
     *
     * @param {string} groupTitle the title of the group to add users to
     * @param {string[]} users an array of usernames of users to add to the group
     * @returns {Observable} An Observable that resolves if the request is successful; rejects with an error message
     * otherwise
     */
    addGroupUsers(groupTitle: string, users: string[]): Observable<void> {
        return this.spinnerSvc.track(this.http.put(`${this.groupPrefix}/${encodeURIComponent(groupTitle)}/users`, null, 
          {params: createHttpParams({ users })}))
            .pipe(
                catchError(handleError),
                map(() => {
                    const group: Group = find(this.groups, {title: groupTitle});
                    group.members = union(get(group, 'members', []), users);
                })
            );
    }
    /**
     * Calls the DELETE /mobirest/groups/{groupTitle}/users endpoint to remove the Mobi user specified by the passed
     * username from the group specified by the passed group title. Returns an observable that resolves if the deletion
     * was successful and rejects with an error message if not. Updates the `groups` list appropriately.
     *
     * @param {string} groupTitle the title of the group to remove the user from
     * @param {string} username the username of the user to remove from the group
     * @returns {Observable} An Observable that resolves if the request is successful; rejects with an error message
     * otherwise
     */
    deleteGroupUser(groupTitle: string, username: string): Observable<void> {
        return this.spinnerSvc.track(this.http.delete(`${this.groupPrefix}/${encodeURIComponent(groupTitle)}/users`, 
          {params: createHttpParams({ user: username })}))
            .pipe(
                catchError(handleError),
                map(() => {
                    pull(get(find(this.groups, {title: groupTitle}), 'members'), username);
                })
            );
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
            return includes(flatten(userGroups.map(group => group.roles)), 'admin');
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
        return get(jsonld, '@type', []).includes(`${USER}ExternalUser`);
    }
    /**
     * Determines whether the provided JSON-LD object is an ExternalGroup or not.
     *
     * @param {JSONLDObject} jsonld a JSON-LD object
     * @returns {boolean} true if the JSON-LD object is ExternalGroup; false otherwise
     */
    isExternalGroup(jsonld: JSONLDObject): boolean {
        return get(jsonld, '@type', []).includes(`${USER}ExternalGroup`);
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
        return (!!get(userObject, 'firstName') && !!get(userObject, 'lastName')) ? `${userObject.firstName} ${userObject.lastName}` : get(userObject, 'username') ? userObject.username : '[Not Available]';
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
            username: getPropertyValue(jsonld, `${USER}username`),
            firstName: getPropertyValue(jsonld, `${FOAF}firstName`),
            lastName: getPropertyValue(jsonld, `${FOAF}lastName`),
            email: getPropertyId(jsonld, `${FOAF}mbox`),
            roles: (jsonld[`${USER}hasUserRole`] || []).map(role => getBeautifulIRI(role['@id']).toLowerCase())
        };
    }
    /**
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
            title: getDctermsValue(jsonld, 'title'),
            description: getDctermsValue(jsonld, 'description'),
            members: (jsonld[`${FOAF}member`] || []).map(member => {
                const user = find(this.users, {'iri': member['@id']});
                if (user !== undefined) {
                    return user.username;
                }
            }),
            roles: (jsonld[`${USER}hasGroupRole`] || []).map(role => getBeautifulIRI(role['@id']).toLowerCase())
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
                    (`${userObj.firstName} ${userObj.lastName}`).toLowerCase(),
                    (`${userObj.lastName} ${userObj.firstName}`).toLowerCase(),
                    (`${userObj.lastName}, ${userObj.firstName}`).toLowerCase()
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
