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
    var $compile, scope, isolatedScope, element, controller, catalogManagerSvc, ontologyStateSvc, $q, stateManagerSvc,
        ontologyStateSvc, catalogId;
    var branchId = 'branchId';
    var branch = {'@id': branchId};
    var commitId = 'commitId';
    var headCommit = {
        commit: [{
            '@graph': [{
                '@id': commitId
            }]
        }]
    }

    beforeEach(function() {
        module('templates');
        module('branchSelect');
        mockCatalogManager();
        mockOntologyState();
        mockUtil();
        mockStateManager();
        mockOntologyManager();
        injectTrustedFilter();
        injectHighlightFilter();

        inject(function(_$compile_, _$rootScope_, _catalogManagerService_, _ontologyStateService_, _$q_,
            _stateManagerService_, _ontologyManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            catalogManagerSvc = _catalogManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            $q = _$q_;
            stateManagerSvc = _stateManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
        });

        scope.bindModel = {};

        element = $compile(angular.element('<branch-select ng-model="bindModel"></branch-select>'))(scope);
        scope.$digest();

        controller = element.controller('branchSelect');
        isolatedScope = element.isolateScope();
        catalogId = _.get(catalogManagerSvc.localCatalog, '@id', '');
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
        describe('changeBranch calls the correct methods', function() {
            var getDeferred;
            beforeEach(function() {
                getDeferred = $q.defer();
                catalogManagerSvc.getBranchHeadCommit.and.returnValue(getDeferred.promise);
            });
            describe('when getBranchHeadCommit is resolved', function() {
                var updateDeferred, changeDeferred;
                beforeEach(function() {
                    getDeferred.resolve(headCommit);
                    updateDeferred = $q.defer();
                    stateManagerSvc.updateOntologyState.and.returnValue(updateDeferred.promise);
                    changeDeferred = $q.defer();
                    ontologyManagerSvc.changeBranch.and.returnValue(changeDeferred.promise)
                });
                it('when updateOntologyState and changeBranch are resolved', function() {
                    controller.changeBranch(branch);
                    updateDeferred.resolve();
                    changeDeferred.resolve();
                    scope.$apply();
                    expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(branchId,
                        ontologyStateSvc.listItem.recordId, catalogId);
                    expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId,
                        branchId, commitId);
                    expect(ontologyManagerSvc.changeBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyId,
                        ontologyStateSvc.listItem.recordId, branchId, commitId);
                    expect(ontologyStateSvc.resetStateTabs).toHaveBeenCalled();
                });
            });
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
                ontologyStateSvc.listItem.branches = [branch];
                catalogManagerSvc.deleteRecordBranch.and.returnValue(deferred.promise);
            });
            it('when resolved', function() {
                controller.delete();
                deferred.resolve();
                scope.$apply();
                expect(ontologyStateSvc.listItem.branches.length).toBe(0);
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