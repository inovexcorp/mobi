describe('Login controller', function() {
    var $controller,
        scope;

    beforeEach(function() {
        // To mock a module, you create dummy ones so the dependencies of the
        // module get resolved
        angular.module('loginManager', []);
        module('login');

        // To mock out the services needed, use this module(function($provide))
        // syntax. This does not actually create services under the dummy modules
        module(function($provide) {
            // Use $q to mock out methods that return promises
            $provide.service('loginManagerService', ['$q', function($q) {
                this.login = jasmine.createSpy('login').and.callFake(function(isValid, username, password) {
                    if (isValid) {
                        return $q.when(true);
                    } else {
                        return $q.reject(false);
                    }
                });
            }]);
        });
        // To test out a controller, you need to inject $rootScope and $controller
        // and save them to use
        inject(function(_$rootScope_, _$controller_) {
            scope = _$rootScope_;
            $controller = _$controller_;
        });
    });
    it('correctly validates a login combination', function() {
        // Usually pass in $scope in the object in the second parameter, but since the
        // controller uses the controllerAs syntax, we can access it directly
        var controller = $controller('LoginController', {});
        controller.form = {
            username: '',
            password: ''
        };
        controller.login(true);
        scope.$digest();
        expect(controller.showError).toBe(false);
    });

});