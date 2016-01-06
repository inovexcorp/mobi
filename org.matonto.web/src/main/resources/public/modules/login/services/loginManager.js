(function() {
    'use strict';

    angular
        .module('loginManager', [])
        .service('loginManagerService', loginManagerService);

        loginManagerService.$inject = ['$q', '$http', '$state', '$timeout'];

        function loginManagerService($q, $http, $state, $timeout) {
            var self = this;

            var dummy = false;

            self.login = function(isValid, username, password) {
                if(isValid) {
                    /*$http.get('/matontorest/user/login')
                        .then(function(response) {
                            var authenticated = (username == 'admin' && password == 'M@tontoRox!');
                            if(authenticated) {
                                $state.go('root.home');
                            }
                            return authenticated;
                        });*/
                }
            }

            self.logout = function(callback) {
                // TODO: destroy token with http call?
                /*$http.get('/matontorest/user/logout')
                    .then(function(response) {
                        $state.go('login');
                    });*/
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
                        console.log('success', response);
                        if(dummy) {
                            return $q.when();
                        } else {
                            return handleError(response.data);
                        }
                    }, function(response) {
                        console.log('error', response);
                        return handleError(response.data);
                    });
            }
        }
})();