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
                    }
                    $http.get('/matontorest/user/login', config)
                        .then(function(response) {
                            if(response.status === 200 && response.data.scope !== anon) {
                                $state.go('root.home');
                                return true;
                            } else {
                                return false;
                            }
                        }, function(response) {
                            return false;
                        });
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