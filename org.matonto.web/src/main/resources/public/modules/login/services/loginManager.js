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
        .module('loginManager', [])
        .service('loginManagerService', loginManagerService);

        loginManagerService.$inject = ['$q', '$http', '$state', '$timeout'];

        function loginManagerService($q, $http, $state, $timeout) {
            var self = this,
                anon = 'self anon';

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
                            if(response.status === 200 && response.data.scope !== anon) {
                                $state.go('root.home');
                                deferred.resolve(true);
                            } else {
                                deferred.resolve(false);
                            }
                        }, function(response) {
                            deferred.resolve(false);
                        });

                    return deferred.promise;
                }
            }

            self.logout = function(callback) {
                $http.get('/matontorest/user/logout')
                    .then(function(response) {
                        $state.go('login');
                    });
                $state.go('login');
            }

            self.isAuthenticated = function() {
                var handleError = function(data) {
                    $timeout(function() {
                        $state.go('login');
                    });
                    return $q.reject(data);
                }
                return $http.get('/matontorest/user/current')
                    .then(function(response) {
                        if(response.status === 200 && response.data.scope !== anon) {
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