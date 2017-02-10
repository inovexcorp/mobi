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
describe('Merge Tab directive', function() {
    var $compile, scope, $q, element, controller, ontologyStateSvc, ontologyManagerSvc, catalogManagerSvc, catalogId;

    var error = 'error';
    var commitId = 'commitId';
    var branchId = 'branchId';
    var branch = {'@id': branchId};
    var targetId = 'targetId';

    beforeEach(function() {
        module('templates');
        module('mergeTab');
        mockUtil();
        mockOntologyState();
        mockCatalogManager();
        mockOntologyManager();
        mockPrefixes();
        mockStateManager();
        injectTrustedFilter();
        injectHighlightFilter();
        injectBeautifyFilter();

        inject(function(_$q_, _$compile_, _$rootScope_, _ontologyStateService_, _ontologyManagerService_,
            _catalogManagerService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            catalogManagerSvc = _catalogManagerService_;
        });

        ontologyStateSvc.listItem.branchId = branchId;
        ontologyStateSvc.listItem.branches = [branch];
        catalogId = _.get(catalogManagerSvc.localCatalog, '@id', '');

        element = $compile(angular.element('<merge-tab></merge-tab>'))(scope);
        scope.$digest();
        controller = element.controller('mergeTab');
        controller.targetId = targetId;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('merge-tab')).toBe(true);
        });
        _.forEach(['block', 'block-content', 'ui-select', 'button', 'checkbox'], function(item) {
            it('for ' + item, function() {
                expect(element.find(item).length).toBe(1);
            });
        });
        it('depending on whether there is an error', function() {
            expect(element.find('error-display').length).toBe(0);
            controller.error = error;
            scope.$digest();
            expect(element.find('error-display').length).toBe(1);
        });
        it('with a .merge-message', function() {
            expect(element.querySelectorAll('.merge-message').length).toBe(1);
        });
        it('depending on whether there are conflicts', function() {
            expect(element.querySelectorAll('.form-container').length).toBe(1);
            expect(element.querySelectorAll('.conflicts-container').length).toBe(0);

            controller.conflicts = [{}];
            scope.$digest();
            expect(element.querySelectorAll('.form-container').length).toBe(0);
            expect(element.querySelectorAll('.conflicts-container').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('attemptMerge calls the correct functions', function() {
            var getDeferred;
            beforeEach(function() {
                getDeferred = $q.defer();
                catalogManagerSvc.getBranchConflicts.and.returnValue(getDeferred.promise);
                controller.attemptMerge();
            });
            describe('when getBranchConflicts is resolved', function() {
                it('and is empty', function() {
                    spyOn(controller, 'merge');
                    getDeferred.resolve([]);
                    scope.$apply();
                    expect(controller.merge).toHaveBeenCalled();
                });
            });
            it('when getBranchConflicts is rejected', function() {
                getDeferred.reject(error);
                scope.$apply();
                expect(controller.error).toEqual(error);
            });
        });
        describe('merge calls the correct functions', function() {
            var mergeDefer;
            beforeEach(function() {
                mergeDefer = $q.defer();
                catalogManagerSvc.mergeBranches.and.returnValue(mergeDefer.promise);
                controller.merge();
            });
            describe('when mergeBranches is resolved', function() {
                var changeDefer;
                beforeEach(function() {
                    changeDefer = $q.defer();
                    ontologyManagerSvc.updateOntology.and.returnValue(changeDefer.promise);
                    mergeDefer.resolve(commitId);
                });
                describe('and changeBranch is resolved', function() {
                    beforeEach(function() {
                        changeDefer.resolve();
                    });
                    describe('and controller.checkbox is truthy', function() {
                        var deleteDefer;
                        beforeEach(function() {
                            deleteDefer = $q.defer();
                            catalogManagerSvc.deleteRecordBranch.and.returnValue(deleteDefer.promise);
                            controller.checkbox = true;
                        });
                        it('and deleteRecordBranch is resolved', function() {
                            deleteDefer.resolve();
                            scope.$apply();
                            expect(catalogManagerSvc.mergeBranches).toHaveBeenCalledWith(branchId, targetId,
                                ontologyStateSvc.listItem.recordId, catalogId, jasmine.any(Object));
                            expect(ontologyManagerSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem
                                .recordId, targetId, commitId, ontologyStateSvc.state.type);
                            expect(catalogManagerSvc.deleteRecordBranch).toHaveBeenCalledWith(branchId,
                                ontologyStateSvc.listItem.recordId, catalogId);
                            expect(ontologyManagerSvc.removeBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem
                                .recordId, branchId);
                            expect(controller.targetId).toBe(undefined);
                        });
                        it('and deleteRecordBranch is rejected', function() {
                            deleteDefer.reject(error);
                            scope.$apply();
                            expect(catalogManagerSvc.mergeBranches).toHaveBeenCalledWith(branchId, targetId,
                                ontologyStateSvc.listItem.recordId, catalogId, jasmine.any(Object));
                            expect(ontologyManagerSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem
                                .recordId, targetId, commitId, ontologyStateSvc.state.type);
                            expect(catalogManagerSvc.deleteRecordBranch).toHaveBeenCalledWith(branchId,
                                ontologyStateSvc.listItem.recordId, catalogId);
                            expect(controller.error).toEqual(error);
                        });
                    });
                    it('and controller.checkbox if falsy', function() {
                        scope.$apply();
                        expect(catalogManagerSvc.mergeBranches).toHaveBeenCalledWith(branchId, targetId,
                            ontologyStateSvc.listItem.recordId, catalogId, jasmine.any(Object));
                        expect(ontologyManagerSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem
                            .recordId, targetId, commitId, ontologyStateSvc.state.type);
                        expect(catalogManagerSvc.deleteRecordBranch).not.toHaveBeenCalled();
                        expect(controller.targetId).toBe(undefined);
                    });
                });
                it('and changeBranch is rejected', function() {
                    changeDefer.reject(error);
                    scope.$apply();
                    expect(catalogManagerSvc.mergeBranches).toHaveBeenCalledWith(branchId, targetId,
                        ontologyStateSvc.listItem.recordId, catalogId, jasmine.any(Object));
                    expect(ontologyManagerSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId,
                        targetId, commitId, ontologyStateSvc.state.type);
                    expect(catalogManagerSvc.deleteRecordBranch).not.toHaveBeenCalled();
                    expect(controller.error).toEqual(error);
                });
            });
            it('when mergeBranches is rejected', function() {
                mergeDefer.reject(error);
                scope.$apply();
                expect(catalogManagerSvc.mergeBranches).toHaveBeenCalledWith(branchId, targetId,
                    ontologyStateSvc.listItem.recordId, catalogId, jasmine.any(Object));
                expect(ontologyManagerSvc.updateOntology).not.toHaveBeenCalled();
                expect(catalogManagerSvc.deleteRecordBranch).not.toHaveBeenCalled();
                expect(controller.error).toEqual(error);
            });
        });
        describe('matchesCurrent returns', function() {
            it('true if it does not match ontologyStateService.listItem.branchId', function() {
                expect(controller.matchesCurrent({'@id': 'differentId'})).toBe(true);
            });
            it('false if it does match ontologyStateService.listItem.branchId', function() {
                expect(controller.matchesCurrent(branch)).toBe(false);
            });
        });
    });
});
