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
                        return $q.when();
                    } else {
                        return $q.reject('An error has occured');
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
    describe('correctly validates a login combination', function() {
        it('if valid', function() {
            // Usually pass in $scope in the object in the second parameter, but since the
            // controller uses the controllerAs syntax, we can access it directly
            var controller = $controller('LoginController', {});
            controller.form = {
                username: '',
                password: ''
            };
            controller.login(true);
            scope.$digest();
            expect(controller.errorMessage).toBeFalsy();
        });
        it('if invalid', function() {
            // Usually pass in $scope in the object in the second parameter, but since the
            // controller uses the controllerAs syntax, we can access it directly
            var controller = $controller('LoginController', {});
            controller.form = {
                username: '',
                password: ''
            };
            controller.login(false);
            scope.$digest();
            expect(controller.errorMessage).toBeTruthy();
        });
    });

});