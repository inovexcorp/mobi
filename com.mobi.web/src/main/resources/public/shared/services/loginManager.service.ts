import { get } from "lodash";

/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

loginManagerService.$inject = ['$q', '$http', '$state', 'REST_PREFIX',
    'catalogManagerService',
    'catalogStateService',
    'datasetManagerService',
    'datasetStateService',
    'delimitedManagerService',
    'discoverStateService',
    'mapperStateService',
    'mergeRequestsStateService',
    'ontologyManagerService',
    'ontologyStateService',
    'shapesGraphStateService',
    'sparqlManagerService',
    'stateManagerService',
    'userManagerService',
    'userStateService',
    'utilService',
    'yasguiService'
];

/**
 * @ngdoc service
 * @name shared.service:loginManagerService
 * @requires $http
 * @requires $q
 * @requires $state
 * @requires shared.service:catalogManagerService
 * @requires shared.service:catalogStateService
 * @requires shared.service:datasetManagerService
 * @requires shared.service:datasetStateService
 * @requires shared.service:delimitedManagerService
 * @requires shared.service:discoverStateService
 * @requires shared.service:mapperStateService
 * @requires shared.service:mergeRequestsStateService
 * @requires shared.service:ontologyManagerService
 * @requires shared.service:ontologyStateService
 * @requires shared.service:sparqlManagerService
 * @requires shared.service:shapesGraphStateService
 * @requires shared.service:stateManagerService
 * @requires shared.service:userManagerService
 * @requires shared.service:userStateService
 *
 * @description
 * `loginManagerService` is a service that provides access to the Mobi login REST
 * endpoints so users can log into and out of Mobi.
 */
function loginManagerService($q, $http, $state, REST_PREFIX, catalogManagerService, catalogStateService, datasetManagerService, datasetStateService, delimitedManagerService, discoverStateService, mapperStateService, mergeRequestsStateService, ontologyManagerService, ontologyStateService, shapesGraphStateService, sparqlManagerService, stateManagerService, userManagerService, userStateService, utilService, yasguiService) {
    var self = this,
        prefix = REST_PREFIX + 'session';
    
    self.weGood = false;

    /**
     * @ngdoc property
     * @name currentUser
     * @propertyOf shared.service:loginManagerService
     * @type {string}
     *
     * @description
     * `currentUser` holds the username of the user that is currently logged into Mobi.
     */
    self.currentUser = '';

    /**
     * @ngdoc property
     * @name currentUserIRI
     * @propertyOf shared.service:loginManagerService
     * @type {string}
     *
     * @description
     * `currentUserIRI` holds the IRI of the user that is currently logged into Mobi.
     */
    self.currentUserIRI = '';

    /**
     * @ngdoc method
     * @name loginManager.loginManagerService#login
     * @methodOf shared.service:loginManagerService
     *
     * @description
     * Makes a call to POST /mobirest/session to attempt to log into Mobi using the passed credentials. Returns a
     * Promise with the success of the log in attempt. If failed, contains an appropriate error message.
     *
     * @param {string} username the username to attempt to log in with
     * @param {string} password the password to attempt to log in with
     * @return {Promise} A Promise that resolves if the log in attempt succeeded and rejects
     * with an error message if the log in attempt failed
     */
    self.login = function(username, password) {
        var config = { params: { username, password } };
        return $http.post(prefix, null, config)
            .then(response => {
                if (response.status === 200 && response.data) {
                    self.currentUser = response.data;
                    if (get(response.headers(), 'accounts-merged', false) === 'true') {
                        utilService.createWarningToast('Local User Account found. Accounts have been merged.');
                    }
                    return userManagerService.getUser(self.currentUser)
                        .then(user => {
                            self.currentUserIRI = user.iri;
                            self.currentUser = user.username;
                            $state.go('root.home');
                            return true;
                        });
                }
            }, response => {
                if (response.status === 401) {
                    return $q.reject('This email/password combination is not correct.');
                } else {
                    return $q.reject('An error has occurred. Please try again later.');
                }
            });
    }

    /**
     * @ngdoc method
     * @name loginManager.loginManagerService#logout
     * @methodOf shared.service:loginManagerService
     *
     * @description
     * Makes a call to DELETE /mobirest/session to log out of which ever user account is current. Navigates back to
     * the login page.
     */
    self.logout = function() {
        datasetStateService.reset();
        delimitedManagerService.reset();
        discoverStateService.reset();
        mapperStateService.initialize();
        mapperStateService.resetEdit();
        mergeRequestsStateService.reset();
        ontologyManagerService.reset();
        ontologyStateService.reset();
        sparqlManagerService.reset();
        shapesGraphStateService.reset();
        catalogStateService.reset();
        yasguiService.reset();
        $http.delete(prefix)
            .then(response => {
                self.currentUser = '';
                self.currentUserIRI = '';
                userStateService.reset();
                $state.go('login');
            });
    }

    /**
     * @ngdoc method
     * @name loginManager.loginManagerService#isAuthenticated
     * @methodOf shared.service:loginManagerService
     *
     * @description
     * Test whether a user is currently logged in and if not, navigates to the log in page. If a user
     * is logged in, initializes the {@link shared.service:catalogManagerService},
     * {@link shared.service:catalogStateService},
     * {@link shared.service:mergeRequestsStateService},
     * {@link shared.service:ontologyManagerService},
     * {@link shared.service:ontologyStateService},
     * {@link shared.service:datasetManagerService},
     * {@link shared.service:stateManagerService},
     * and the {@link shared.service:userManagerService}. Returns
     * a Promise with whether or not a user is logged in.
     *
     * @return {Promise} A Promise that resolves if a user is logged in and rejects with the HTTP
     * response data if no user is logged in.
     */
    self.isAuthenticated = function() {
        var handleError = function(data) {
            self.currentUser = '';
            self.currentUserIRI = '';
            $state.go('login');
        };
        return self.getCurrentLogin().then(data => {
            if (!data) {
                return $q.reject(data);
            }
            var promises = [
                stateManagerService.initialize(),
                userManagerService.initialize(),
                userManagerService.getUser(data).then(user => {
                    self.currentUserIRI = user.iri;
                    self.currentUser = user.username;
                })
            ];
            if (!self.weGood) {
                promises = promises.concat([
                    catalogManagerService.initialize().then(() => {
                        catalogStateService.initialize();
                        mergeRequestsStateService.initialize();
                        ontologyManagerService.initialize();
                        ontologyStateService.initialize();
                        shapesGraphStateService.initialize();
                    }),
                    datasetManagerService.initialize()
                ]);
            }
            if (self.checkMergedAccounts()) {
                utilService.createWarningToast('Local User Account found. Accounts have been merged.');
            }

            return $q.all(promises);
        }, $q.reject)
        .then(() => {
            self.weGood = true;
        }, handleError);
    };

    /**
     * @ngdoc method
     * @name loginManager.loginManagerService#getCurrentLogin
     * @methodOf shared.service:loginManagerService
     *
     * @description
     * Makes a call to GET /mobirest/session to retrieve the user that is currently logged in. Returns a Promise
     * with the result of the call.
     *
     * @return {Promise} A Promise with the response data that resolves if the request was successful; rejects if
     * unsuccessful
     */
    self.getCurrentLogin = function () {
        var deferred = $q.defer();

        $http.get(prefix).then(response => {
            if (response.status === 200) {
                deferred.resolve(response.data);
            } else {
                deferred.reject(response.data);
            }
        }, error => deferred.reject(error.data));

        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name loginManager.loginManagerService#checkMergedAccount
     * @methodOf shared.service:loginManagerService
     *
     * @description
     * Takes the current url of the window and parses the string for path params that are preceded by a question mark.
     * If a path param for the merged-account flag is present it returns the value of the flag. If the flag is not
     * present, it returns false.
     *
     * @return {boolean} A boolean value repesenting whether a local account and a remote account were merged or not.
     */
    self.checkMergedAccounts = function() {
        const url = window.location.href;
        let merged = false;
        let queryParams = url.split('?');
        queryParams.forEach(param => {
            if (param && param.includes('merged-accounts')) {
                merged = param.split('=')[1] === 'true' ? true : false;
                return;
            }
        });
        return merged;
    }
}

export default loginManagerService;
