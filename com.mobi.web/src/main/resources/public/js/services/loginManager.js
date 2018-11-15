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
         * @requires datasetManager.service:datasetManagerService
         * @requires datasetState.service:datasetStateService
         * @requires delimitedManager.service:delimitedManangerService
         * @requires discoverState.service:discoverStateService
         * @requires mapperState.service:mapperStateService
         * @requires mergeRequestsState.service:mergeRequestsStateService
         * @requires ontologyManager.service:ontologyManagerService
         * @requires ontologyState.service:ontologyStateService
         * @requires sparqlManager.service:sparqlManagerService
         * @requires stateManager.service:stateManagerService
         * @requires userManager.service:userManagerService
         * @requires userState.service:userStateService
         *
         * @description
         * `loginManagerService` is a service that provides access to the Mobi login REST
         * endpoints so users can log into and out of Mobi.
         */
        .service('loginManagerService', loginManagerService);

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
            'sparqlManagerService',
            'stateManagerService',
            'userManagerService',
            'userStateService'
        ];

    function loginManagerService($q, $http, $state, REST_PREFIX, catalogManagerService, catalogStateService, datasetManagerService, datasetStateService, delimitedManagerService, discoverStateService, mapperStateService, mergeRequestsStateService, ontologyManagerService, ontologyStateService, sparqlManagerService, stateManagerService, userManagerService, userStateService) {
            var self = this,
                anon = 'self anon',
                prefix = REST_PREFIX + 'user/',
                weGood = false;

            /**
             * @ngdoc property
             * @name currentUser
             * @propertyOf loginManager.service:loginManagerService
             * @type {string}
             *
             * @description
             * `currentUser` holds the username of the user that is currently logged into Mobi.
             */
            self.currentUser = '';

            /**
             * @ngdoc property
             * @name currentUserIRI
             * @propertyOf loginManager.service:loginManagerService
             * @type {string}
             *
             * @description
             * `currentUserIRI` holds the IRI of the user that is currenlty logged into Mobi.
             */
            self.currentUserIRI = '';

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
                            userManagerService.getUser(self.currentUser).then(user => {
                                self.currentUserIRI = user.iri;
                            });
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
                catalogStateService.reset();
                datasetStateService.reset();
                delimitedManagerService.reset();
                discoverStateService.reset();
                mapperStateService.initialize();
                mapperStateService.resetEdit();
                mergeRequestsStateService.reset();
                ontologyManagerService.reset();
                ontologyStateService.reset();
                sparqlManagerService.reset();
                $http.get(prefix + 'logout')
                    .then(response => {
                        self.currentUser = '';
                        self.currentUserIRI = '';
                        userStateService.reset();
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
            self.isAuthenticated = function() {
                var handleError = function(data) {
                    self.currentUser = '';
                    self.currentUserIRI = '';
                    $state.go('login');
                    return $q.reject(data);
                };
                return self.getCurrentLogin().then(data => {
                    if (data.scope !== anon) {
                        self.currentUser = data.sub;
                        if (!weGood) {
                            catalogManagerService.initialize().then(() => {
                                catalogStateService.initialize();
                                mergeRequestsStateService.initialize();
                                ontologyManagerService.initialize();
                                ontologyStateService.initialize();
                            });
                            userManagerService.initialize();
                            datasetManagerService.initialize();
                            weGood = true;
                        }
                        stateManagerService.initialize();
                        userManagerService.getUser(self.currentUser).then(user => {
                            self.currentUserIRI = user.iri;
                        });
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
