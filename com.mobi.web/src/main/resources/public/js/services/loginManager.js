/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name loginManager
         * @requires userManager
         *
         * @description
         * The `loginManager` module only provides the `loginManagerService` service which
         * provides utilities to log into and log out of Mobi.
         */
        .module('loginManager', [])
        /**
         * @ngdoc service
         * @name loginManager.service:loginManagerService
         * @requires $http
         * @requires $q
         * @requires $state
         * @requires catalogManager.service:catalogManagerService
         * @requires catalogState.service:catalogStateService
         * @requires ontologyManager.service:ontologyManagerService
         * @requires userManager.service:userManagerService
         *
         * @description
         * `loginManagerService` is a service that provides access to the Mobi login REST
         * endpoints so users can log into and out of Mobi.
         */
        .service('loginManagerService', loginManagerService);

        loginManagerService.$inject = ['$q', '$http', '$state', 'catalogManagerService', 'catalogStateService', 'ontologyManagerService', 'userManagerService', 'stateManagerService', 'ontologyStateService', 'datasetManagerService', 'REST_PREFIX'];

        function loginManagerService($q, $http, $state, catalogManagerService, catalogStateService, ontologyManagerService, userManagerService, stateManagerService, ontologyStateService, datasetManagerService, REST_PREFIX) {
            var self = this,
                anon = 'self anon',
                prefix = REST_PREFIX + 'user/';

            /**
             * @ngdoc property
             * @name currentUser
             * @propertyOf loginManager.service:loginManagerService
             * @type {string}
             *
             * @description
             * `currentUser` holds the username of the user that is currenlty logged into Mobi.
             */
            self.currentUser = '';

            /**
             * @ngdoc method
             * @name loginManager.loginManagerService#login
             * @methodOf loginManager.service:loginManagerService
             *
             * @description
             * Makes a call to GET /mobirest/user/login to attempt to log into Mobi using the
             * passed credentials. Returns a Promise with the success of the log in attempt.
             * If failed, contains an appropriate error message.
             *
             * @param {string} username the username to attempt to log in with
             * @param {string} password the password to attempt to log in with
             * @return {Promise} A Promise that resolves if the log in attempt succeeded and rejects
             * with an error message if the log in attempt failed
             */
            self.login = function(username, password) {
                var config = {
                        params: {
                            username: username,
                            password: password
                        }
                    },
                    deferred = $q.defer();

                $http.get(prefix + 'login', config)
                    .then(response => {
                        if (response.status === 200 && response.data.scope !== anon) {
                            self.currentUser = response.data.sub;
                            $state.go('root.home');
                            deferred.resolve(true);
                        } else {
                            deferred.resolve();
                        }
                    }, response => {
                        if (response.status === 401) {
                            deferred.reject('This email/password combination is not correct.');
                        } else {
                            deferred.reject('An error has occured. Please try again later.');
                        }
                    });

                return deferred.promise;
            }

            /**
             * @ngdoc method
             * @name loginManager.loginManagerService#logout
             * @methodOf loginManager.service:loginManagerService
             *
             * @description
             * Makes a call to GET /mobirest/user/logout to log out of which ever user account
             * is current. Navigates back to the login page.
             */
            self.logout = function() {
                $http.get(prefix + 'logout')
                    .then(response => {
                        self.currentUser = '';
                        $state.go('login');
                    });
                $state.go('login');
            }

            /**
             * @ngdoc method
             * @name loginManager.loginManagerService#isAuthenticated
             * @methodOf loginManager.service:loginManagerService
             *
             * @description
             * Test whether a user is currently logged in and if not, navigates to the log in page. If a user
             * is logged in, intitializes the {@link catalogManager.service:catalogManagerService catalogManagerService},
             * {@link catalogState.service:catalogStateService catalogStateService},
             * {@link ontologyManager.service:ontologyManagerService ontologyManagerService},
             * and the {@link userManager.service:userManagerService userManagerService}. Returns
             * a Promise with whether or not a user is logged in.
             *
             * @return {Promise} A Promise that resolves if a user is logged in and rejects with the HTTP
             * response data if no user is logged in.
             */
            self.isAuthenticated = function () {
                var handleError = function(data) {
                    self.currentUser = '';
                    $state.go('login');
                    return $q.reject(data);
                };
                return self.getCurrentLogin().then(data => {
                    if (data.scope !== anon) {
                        self.currentUser = data.sub;
                        catalogManagerService.initialize().then(() => {
                            catalogStateService.initialize();
                            ontologyManagerService.initialize();
                            ontologyStateService.initialize();
                        });
                        userManagerService.initialize();
                        stateManagerService.initialize();
                        datasetManagerService.initialize();
                        return $q.when();
                    } else {
                        return handleError(data);
                    }
                }, handleError);
            };

            /**
             * @ngdoc method
             * @name loginManager.loginManagerService#getCurrentLogin
             * @methodOf loginManager.service:loginManagerService
             *
             * @description
             * Makes a call to GET /mobirest/user/current to retrieve the user that is currently logged
             * in. Returns a Promise with the result of the call.
             *
             * @return {Promise} A Promise with the response data that resolves if the request was successful;
             * rejects if unsuccessful
             */
            self.getCurrentLogin = function () {
                var deferred = $q.defer();

                $http.get(prefix + 'current').then(response => {
                    if (response.status === 200) {
                        deferred.resolve(response.data);
                    } else {
                        deferred.reject(response.data);
                    }
                }, error => deferred.reject(error.data));

                return deferred.promise;
            };
        }
})();
