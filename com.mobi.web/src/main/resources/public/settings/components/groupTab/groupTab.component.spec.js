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

describe('Group Tab component', function() {
    var $compile, scope, $q, userManagerSvc, loginManagerSvc;

    beforeEach(function() {
        module('templates');
        module('settings');
        mockUserManager();
        mockLoginManager();

        inject(function(_$compile_, _$rootScope_, _$q_, _userManagerService_, _loginManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            userManagerSvc = _userManagerService_;
            loginManagerSvc = _loginManagerService_;
        });

        this.user = 'user';
        this.group1 = {title: 'group1', members: [this.user, 'test']};
        this.group2 = {title: 'group2', members: [this.user]};
        loginManagerSvc.currentUser = this.user;
        userManagerSvc.groups = [this.group1, this.group2, {members: ['test']}];
        this.element = $compile(angular.element('<group-tab></group-tab>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('groupTab');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        userManagerSvc = null;
        loginManagerSvc = null;
        this.element.remove();
    });

    describe('should initialize with', function() {
        it('the user\'s groups', function() {
            expect(this.controller.groups).toEqual([this.group1, this.group2]);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('GROUP-TAB');
            expect(this.element.querySelectorAll('.group-tab').length).toEqual(1);
            expect(this.element.querySelectorAll('.row').length).toEqual(1);
            expect(this.element.querySelectorAll('.col-6').length).toEqual(1);
            expect(this.element.querySelectorAll('.offset-3').length).toEqual(1);
        });
        ['block', 'block-content'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toEqual(1);
            });
        });
        it('with a .user-groups-list', function() {
            expect(this.element.querySelectorAll('.user-groups-list').length).toEqual(1);
        });
        it('depending on the number of groups', function() {
            expect(this.element.querySelectorAll('.no-groups').length).toEqual(0);
            expect(this.element.querySelectorAll('.user-group').length).toEqual(2);

            this.controller.groups = [];
            scope.$digest();
            expect(this.element.querySelectorAll('.no-groups').length).toEqual(1);
            expect(this.element.querySelectorAll('.user-group').length).toEqual(0);
        });
    });
});