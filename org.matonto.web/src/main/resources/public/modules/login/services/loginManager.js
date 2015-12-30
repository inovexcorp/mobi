(function() {
    'use strict';

    angular
        .module('loginManager', [])
        .service('loginManagerService', loginManagerService);

        loginManagerService.$inject = ['$http', '$state'];

        function loginManagerService($http, $state) {
            var username, password,
                firstLogIn = true,
                authenticated = false,
                self = this;

            function _login() {

                console.log(username, password);
                authenticated = true;
                $state.go('root.home');

                /*//Instantiate HTTP Request
                var request = ((window.XMLHttpRequest) ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP"));
                request.open("GET", loginURL, true, username, password);
                request.send(null);

                //Process Response
                request.onreadystatechange = function() {
                    if (request.readyState == 4) {
                        if (request.status == 200) {
                            console.log("Success!");
                            $state.go('root.home');
                        } else {
                            if(navigator.userAgent.toLowerCase().indexOf("firefox") != -1) {
                                self.logoff();
                            }
                            alert("Invalid Credentials!");
                        }
                    }
                }*/
            }

            self.login = function(isValid, _username, _password) {
                if(isValid) {
                    username = _username;
                    password = _password;

                    var userAgent = navigator.userAgent.toLowerCase();

                    if(userAgent.indexOf("firefox") != -1) { //TODO: check version number
                        if(firstLogIn) _login();
                        else self.logoff(_login);
                    } else {
                        _login();
                    }

                    if(firstLogIn) firstLogIn = false;
                }
            }

            self.logoff = function(callback) {

            }

            self.isAuthenticated = function() {
                return authenticated;
            }
        }
})();