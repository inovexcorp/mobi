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
describe('Entity Publisher directive', function() {
    var $compile, scope, $q, userManagerSvc, utilSvc;

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
    });

    beforeEach(function() {
        this.compile = function() {
            this.element = $compile(angular.element('<entity-publisher entity="entity"></entity-publisher>'))(scope);
            scope.$digest();
            this.controller = this.element.controller('entityPublisher');
        }
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        userManagerSvc = null;
        utilSvc = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            this.compile();
            this.isolatedScope = this.element.isolateScope();
        });
        it('entity should be one way bound', function() {
            this.isolatedScope.entity = {a: 'b'};
            scope.$digest();
            expect(scope.entity).toEqual({});
        });
    });
    describe('should initialize', function() {
        it('if the entity does not have the publisher property', function() {
            this.compile();
            expect(userManagerSvc.getUsername).not.toHaveBeenCalled();
        });
        describe('if the entity has the publisher property', function() {
            beforeEach(function() {
                this.iri = 'iri';
                utilSvc.getDctermsId.and.returnValue(this.iri);
            });
            it('unless an error occurs', function() {
                userManagerSvc.getUsername.and.returnValue($q.reject('Error message'));
                this.compile();
                expect(userManagerSvc.getUsername).toHaveBeenCalledWith(this.iri);
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
                expect(this.controller.username).toBe('(None)');
            });
            it('successfully', function() {
                userManagerSvc.getUsername.and.returnValue($q.when('username'));
                this.compile();
                expect(userManagerSvc.getUsername).toHaveBeenCalledWith(this.iri);
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                expect(this.controller.username).toBe('username');
            });
        });
    });
    describe('should update when', function() {
        beforeEach(function() {
            this.compile();
        });
        it('the publisher changes', function() {
            var iri = 'iri';
            scope.entity.test = true;
            utilSvc.getDctermsId.and.callFake(function(obj) {
                return _.isEmpty(obj) ? '' : iri;
            });
            userManagerSvc.getUsername.and.returnValue($q.when('username'));
            scope.$apply();
            expect(userManagerSvc.getUsername).toHaveBeenCalledWith(iri);
            expect(this.controller.username).toBe('username');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.compile();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('entity-publisher')).toBe(true);
            expect(this.element.querySelectorAll('.field-name').length).toBe(1);
        });
        it('with the entity publisher username', function() {
            this.controller.username = 'username';
            scope.$digest();
            expect(this.element.html()).toContain(this.controller.username);
        });
    });
});