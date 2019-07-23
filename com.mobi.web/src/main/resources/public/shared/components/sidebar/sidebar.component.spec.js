/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
describe('Sidebar component', function() {
    var $compile, scope, loginManagerSvc, userManagerSvc;

    beforeEach(function() {
        module('templates');
        module('shared');
        mockLoginManager();
        mockUserManager();

        module(function($provide) {
            $provide.service('$state', function() {
                this.is = jasmine.createSpy('is').and.returnValue(false);
            });
        });

        inject(function(_$compile_, _$rootScope_, _loginManagerService_, _userManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            loginManagerSvc = _loginManagerService_;
            userManagerSvc = _userManagerService_;
        });

        this.element = $compile(angular.element('<sidebar></sidebar>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('sidebar');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        loginManagerSvc = null;
        userManagerSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        it('should toggle whether the nav is collapsed', function() {
            expect(scope.collapsedNav).toBeFalsy();
            this.controller.toggle();
            expect(scope.collapsedNav).toBeTruthy();
        });
        it('should get the display of the current user', function() {
            loginManagerSvc.currentUserIRI = 'urn:test';
            var user = {iri: loginManagerSvc.currentUserIRI, firstName: 'Bruce'};
            userManagerSvc.users = [user, {iri: 'a'}];
            expect(this.controller.getUserDisplay()).toEqual('Bruce');
            user.username = 'batman';
            expect(this.controller.getUserDisplay()).toEqual('Bruce');
            delete user.firstName;
            expect(this.controller.getUserDisplay()).toEqual('batman');
            userManagerSvc.users = [];
            expect(this.controller.getUserDisplay()).toEqual('');            
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('SIDEBAR');
            expect(this.element.querySelectorAll('.sidebar').length).toEqual(1);
        });
        ['.image-container', '.current-user-box', '.main-nav', '.hover-box', '.version'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.querySelectorAll(test).length).toEqual(1);
            });
        });
        it('depending on whether the nav is collapsed', function() {
            var sidebar = angular.element(this.element.querySelectorAll('.sidebar')[0]);
            var logo = angular.element(this.element.querySelectorAll('.image-container a img')[0]);
            var userbox = angular.element(this.element.querySelectorAll('.current-user-box')[0]);
            var version = angular.element(this.element.querySelectorAll('.version small')[0]);
            expect(sidebar.hasClass('open')).toEqual(true);
            expect(logo.attr('src')).not.toContain('icon');
            expect(userbox.hasClass('text-truncate')).toEqual(true);
            expect(version.hasClass('shown')).toEqual(true);
            expect(this.element.querySelectorAll('.current-user-box .user-title').length).toEqual(1);
            expect(this.element.querySelectorAll('.nav-item .nav-link span').length > 0).toEqual(true);

            scope.collapsedNav = true;
            scope.$digest();
            expect(sidebar.hasClass('collapsed')).toEqual(true);
            expect(logo.attr('src')).toContain('icon');
            expect(userbox.hasClass('text-truncate')).toEqual(false);
            expect(version.hasClass('hidden')).toEqual(true);
            expect(this.element.querySelectorAll('.current-user-box .user-title').length).toEqual(0);
            expect(this.element.querySelectorAll('.nav-item .nav-link span').length > 0).toEqual(false);
        });
        it('depending on the number of perspectives', function() {
            expect(this.element.querySelectorAll('.main-nav .nav-item').length).toEqual(this.controller.perspectives.length);
        });
    });
});