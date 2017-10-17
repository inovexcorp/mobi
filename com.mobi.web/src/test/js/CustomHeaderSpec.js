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
describe('Custom Header directive', function() {
    var $compile, scope, element, controller, isolatedScope, loginManagerSvc, userManagerSvc;

    beforeEach(function() {
        module('templates');
        module('customHeader');
        mockLoginManager();
        mockUserManager();

        inject(function(_$compile_, _$rootScope_, _loginManagerService_, _userManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            loginManagerSvc = _loginManagerService_;
            userManagerSvc = _userManagerService_;
        });

        scope.pageTitle = '';
        element = $compile(angular.element('<custom-header page-title="pageTitle"></custom-header>'))(scope);
        scope.$digest();
        isolatedScope = element.isolateScope();
        controller = element.controller('customHeader');
    });

    describe('in isolated scope', function() {
        it('pageTitle should be one way bound', function() {
            isolatedScope.pageTitle = 'Title';
            scope.$digest();
            expect(scope.pageTitle).toEqual('');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('main-header')).toBe(true);
            expect(element.querySelectorAll('.actions').length).toBe(1);
        });
        it('for user management item', function(){
            userManagerSvc.isAdmin.and.returnValue(false);
            scope.$digest();
            expect(element.find('li').length).toBe(1);

            userManagerSvc.isAdmin.and.returnValue(true);
            scope.$digest();
            expect(element.find('li').length).toBe(3);
        });
    });
    it('should logout when the link is clicked', function() {
        var link = angular.element(element.querySelectorAll('a[title="Logout"]')[0]);
        link.triggerHandler('click');
        expect(loginManagerSvc.logout).toHaveBeenCalled();
    });
});