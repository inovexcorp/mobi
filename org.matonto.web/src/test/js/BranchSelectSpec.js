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
describe('Branch Select directive', function() {
    var $compile, scope, isolatedScope, element, controller, catalogManagerSvc, ontologyStateSvc, $q;
    var branch = {'@id': 'id'};

    beforeEach(function() {
        module('templates');
        module('branchSelect');
        mockCatalogManager();
        mockOntologyState();
        mockUtil();
        injectTrustedFilter();
        injectHighlightFilter();

        inject(function(_$compile_, _$rootScope_, _catalogManagerService_, _ontologyStateService_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            catalogManagerSvc = _catalogManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            $q = _$q_;
        });

        scope.bindModel = {};

        element = $compile(angular.element('<branch-select ng-model="bindModel"></branch-select>'))(scope);
        scope.$digest();

        controller = element.controller('branchSelect');
        isolatedScope = element.isolateScope();
    });

    describe('controller bound variables', function() {
        it('ngModel should be two way bound', function() {
            controller.bindModel = {id: 'id'};
            scope.$digest();
            expect(scope.bindModel).toEqual({id: 'id'});
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for a div', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on .branch-select', function() {
            expect(element.hasClass('branch-select')).toBe(true);
        });
        it('based on ui-select', function() {
            expect(element.find('ui-select').length).toBe(1);
        });
        it('based on confirmation-overlay', function() {
            expect(element.find('confirmation-overlay').length).toBe(0);
            controller.showDeleteConfirmation = true;
            scope.$apply();
            expect(element.find('confirmation-overlay').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        it('catalogManager.getRecordBranches is called initially', function() {
            expect(catalogManagerSvc.getRecordBranches).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, '');
        });
        it('openDeleteConfirmation calls the correct methods', function() {
            var event = scope.$emit('click');
            spyOn(event, 'stopPropagation');
            controller.openDeleteConfirmation(event, branch);
            expect(event.stopPropagation).toHaveBeenCalled();
            expect(controller.branch).toEqual(branch);
            expect(controller.showDeleteConfirmation).toBe(true);
        });
        it('openEditOverlay calls the correct methods', function() {
            var event = scope.$emit('click');
            spyOn(event, 'stopPropagation');
            controller.openEditOverlay(event, branch);
            expect(event.stopPropagation).toHaveBeenCalled();
            expect(controller.branch).toEqual(branch);
            expect(controller.showEditOverlay).toBe(true);
        });
        describe('delete calls the correct methods', function() {
            var deferred;
            beforeEach(function() {
                deferred = $q.defer();
                controller.showDeleteConfirmation = true;
                controller.branch = branch;
                controller.list = [branch];
                catalogManagerSvc.deleteRecordBranch.and.returnValue(deferred.promise);
            });
            it('when resolved', function() {
                controller.delete();
                deferred.resolve();
                scope.$apply();
                expect(controller.list.length).toBe(0);
                expect(controller.showDeleteConfirmation).toBe(false);
            });
            it('when rejected', function() {
                var errorMessage = 'error';
                controller.delete();
                deferred.reject(errorMessage);
                scope.$apply();
                expect(controller.deleteError).toBe(errorMessage);
            });
        });
    });
});