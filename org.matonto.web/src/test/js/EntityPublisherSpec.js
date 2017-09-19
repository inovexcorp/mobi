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
fdescribe('Entity Publisher directive', function() {
    var $compile, scope, element, isolatedScope, controller, $q, userManagerSvc, utilSvc;

    beforeEach(function() {
        module('templates');
        module('entityPublisher');
        mockUtil();
        mockUserManager();

        inject(function(_$compile_, _$rootScope_, _userManagerService_, _utilService_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            userManagerSvc = _userManagerService_;
            utilSvc = _utilService_;
            $q = _$q_;
        });

        scope.entity = {};
        element = $compile(angular.element('<entity-publisher entity="entity"></entity-publisher>'))(scope);
        scope.$digest();
        isolatedScope = element.isolateScope();
        controller = element.controller('entityPublisher');
    });

    describe('in isolated scope', function() {
        it('entity should be one way bound', function() {
            isolatedScope.entity = {a: 'b'};
            scope.$digest();
            expect(scope.entity).toEqual({});
        });
    });
    describe('should initialize', function() {
        it('if the entity does not have the publisher property', function() {
            expect(userManagerSvc.getUsername).not.toHaveBeenCalled();
        });
        describe('if the entity has the publisher property', function() {
            beforeEach(function() {
                this.iri = 'iri';
                utilSvc.getDctermsId.and.returnValue(this.iri);
            });
            it('unless an error occurs', function() {
                userManagerSvc.getUsername.and.returnValue($q.reject('Error message'));
                element = $compile(angular.element('<entity-publisher entity="entity"></entity-publisher>'))(scope);
                scope.$apply();
                expect(userManagerSvc.getUsername).toHaveBeenCalledWith(this.iri);
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
                expect(controller.username).toBe('(None)');
            });
            it('successfully', function() {
                userManagerSvc.getUsername.and.returnValue($q.when('username'));
                element = $compile(angular.element('<entity-publisher entity="entity"></entity-publisher>'))(scope);
                scope.$apply();
                expect(userManagerSvc.getUsername).toHaveBeenCalledWith(this.iri);
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                expect(controller.username).toBe('username');
            });
        });
    });
    describe('should update when', function() {
        it('the publisher changes', function() {
            var iri = 'iri';
            scope.entity.test = true;
            utilSvc.getDctermsId.and.callFake(function(obj) {
                return _.isEmpty(obj) ? '' : iri;
            });
            userManagerSvc.getUsername.and.returnValue($q.when('username'));
            scope.$apply();
            expect(userManagerSvc.getUsername).toHaveBeenCalledWith(iri);
            expect(controller.username).toBe('username');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('entity-publisher')).toBe(true);
            expect(element.querySelectorAll('.field-name').length).toBe(1);
        });
        it('with the entity publisher username', function() {
            controller.username = 'username';
            scope.$digest();
            expect(element.html()).toContain(controller.username);
        });
    });
});