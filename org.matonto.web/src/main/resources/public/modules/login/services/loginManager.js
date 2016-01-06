(function() {
    'use strict';

    angular
        .module('loginManager', [])
        .service('loginManagerService', loginManagerService);

        loginManagerService.$inject = ['$http', '$state'];

        function loginManagerService($http, $state) {
            var authenticated = false,
                self = this;

            activate();

            function activate() {
                console.log('activate loginManager thingy');
                /*$http.get('/matontorest/user/current')
                    .then(function(response) {
                        console.log(response);
                        // TODO: set authenticated based on 
                    });*/
            }

            self.login = function(isValid, username, password) {
                if(isValid) {
                    // TODO: make $http call to validate the form and get the data back
                    authenticated = (username == 'lewis.1378@gmail.com');
                    if(authenticated) {
                        $state.go('root.home');
                        return true;
                    } else {
                        // TODO: page already shows error message
                        return false;
                    }
                }
            }

            self.logout = function(callback) {
                // TODO: destroy token
                authenticated = false;
                $state.go('login');
            }

            self.isAuthenticated = function() {
                return authenticated;
            }
        }
})();