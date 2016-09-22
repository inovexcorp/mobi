/*-
 * #%L
 * org.matonto.web
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
         *
         * @description 
         * The `loginManager` module only provides the `loginManagerService` service which
         * provides utilities to log into and log out of MatOnto.
         */
        .module('loginManager', [])
        /**
         * @ngdoc service
         * @name loginManager.service:loginManagerService
         * @requires $rootScope
         * @requires $http
         * @requires $q
         * @requires $window
         *
         * @description 
         * `loginManagerService` is a service that provides access to the MatOnto login REST 
         * endpoints so users can log into and out of MatOnto.
         */
        .service('loginManagerService', loginManagerService);

        loginManagerService.$inject = ['$q', '$http', '$state', '$timeout'];

        function loginManagerService($q, $http, $state, $timeout) {
            var self = this,
                anon = 'self anon';

            /**
             * @ngdoc method
             * @name loginManager.loginManagerService#login
             * @methodOf loginManager.service:loginManagerService
             *
             * @description 
             * Makes a call to GET /matontorest/user/login to attempt to log into MatOnto using the
             * passed credentials and validity state of the login form. Returns a Promise with the 
             * success of the log in attempt. If failed, contains an appropriate error message.
             * 
             * @param {boolean} isValid whether or not the login form is valid
             * @param {string} username the username to attempt to log in with
             * @param {string} password the password to attempt to log in with
             * @return {Promise} A Promise that resolves if the log in attempt succeeded and rejects 
             * with an error message if the log in attempt failed
             */
            self.login = function(isValid, username, password) {
                if(isValid) {
                    var config = {
                            params: {
                                username: username,
                                password: password
                            }
                        },
                        deferred = $q.defer();

                    $http.get('/matontorest/user/login', config)
                        .then(function(response) {
                            if (response.status === 200 && response.data.scope !== anon) {
                                $state.go('root.home');
                                deferred.resolve(true);
                            } else {
                                deferred.resolve();
                            }
                        }, function(response) {
                            if (response.status === 401) {
                                deferred.reject('This email/password combination is not correct.');                            
                            } else {
                                deferred.reject('An error has occured. Please try again later.');
                            }
                        });

                    return deferred.promise;
                }
            }

            /**
             * @ngdoc method
             * @name loginManager.loginManagerService#logout
             * @methodOf loginManager.service:loginManagerService
             *
             * @description 
             * Makes a call to GET /matontorest/user/logout to log out of which ever user account
             * is current. Navigates back to the login page.
             */
            self.logout = function() {
                $http.get('/matontorest/user/logout')
                    .then(function(response) {
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
             * Makes a call to GET /matontorest/user/current to test whether a user is currently logged 
             * in and if not, navigates to the log in page. Returns a Promise with whether or not a user 
             * is logged in. 
             *
             * @return {Promise} A Promise that resolves if a user is logged in and rejects with the HTTP
             * response data if no user is logged in.
             */
            self.isAuthenticated = function() {
                var handleError = function(data) {
                    $timeout(function() {
                        $state.go('login');
                    });
                    return $q.reject(data);
                }
                return $http.get('/matontorest/user/current')
                    .then(function(response) {
                        if (response.status === 200 && response.data.scope !== anon) {
                            return $q.when();
                        } else {
                            return handleError(response.data);
                        }
                    }, function(response) {
                        return handleError(response.data);
                    });
            }
        }
})();