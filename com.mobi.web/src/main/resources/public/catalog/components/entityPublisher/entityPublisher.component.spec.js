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
describe('Entity Publisher component', function() {
    var $compile, scope, userManagerSvc, utilSvc;

    beforeEach(function() {
        module('templates');
        module('catalog');
        mockUserManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _userManagerService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            userManagerSvc = _userManagerService_;
            utilSvc = _utilService_;
        });

        this.userId = 'userId';
        this.username = 'user';
        utilSvc.getDctermsId.and.returnValue(this.userId);
        userManagerSvc.users = [{iri: this.userId, username: this.username}];

        scope.entity = {};
        this.element = $compile(angular.element('<entity-publisher entity="entity"></entity-publisher>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('entityPublisher');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        userManagerSvc = null;
        utilSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('entity should be one way bound', function() {
            this.controller.entity = {a: 'b'};
            scope.$digest();
            expect(scope.entity).toEqual({});
        });
    });
    describe('initializes correctly', function() {
        describe('with a publisherName', function() {
            it('if the user can be found', function() {
                expect(this.controller.publisherName).toEqual(this.username);
            });
            it('if the entity does not have a publisher', function() {
                utilSvc.getDctermsId.and.returnValue('');
                scope.record = {test: true};
                this.controller.$onChanges();
                expect(this.controller.publisherName).toEqual('(None)');
            });
            it('if the user cannot be found', function() {
                userManagerSvc.users = [];
                scope.record = {test: true};
                this.controller.$onChanges();
                expect(this.controller.publisherName).toEqual('(None)');
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('ENTITY-PUBLISHER');
            expect(this.element.querySelectorAll('.entity-publisher').length).toBe(1);
        });
    });
});