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
describe('Merge Tab directive', function() {
    var $compile, scope, $q, ontologyStateSvc, catalogManagerSvc, util;

    beforeEach(function() {
        module('templates');
        module('mergeTab');
        mockUtil();
        mockOntologyState();
        mockCatalogManager();
        mockPrefixes();
        mockStateManager();
        injectTrustedFilter();
        injectHighlightFilter();
        injectBeautifyFilter();

        inject(function(_$q_, _$compile_, _$rootScope_, _ontologyStateService_,
            _catalogManagerService_, _utilService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            catalogManagerSvc = _catalogManagerService_;
            util = _utilService_;
        });

        this.catalogId = _.get(catalogManagerSvc.localCatalog, '@id', '');
        this.error = 'error';
        this.commitId = 'commitId';
        this.branchId = 'branchId';
        this.branch = {'@id': this.branchId};
        this.targetId = 'targetId';

        ontologyStateSvc.listItem.ontologyRecord.branchId = this.branchId;
        ontologyStateSvc.listItem.branches = [this.branch];

        this.element = $compile(angular.element('<merge-tab></merge-tab>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('mergeTab');
        this.controller.targetId = this.targetId;
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        ontologyStateSvc = null;
        catalogManagerSvc = null;
        util = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('merge-tab')).toBe(true);
        });
        _.forEach(['block', 'block-content', 'ui-select', 'button', 'checkbox'], function(item) {
            it('for ' + item, function() {
                expect(this.element.find(item).length).toBe(1);
            });
        });
        it('depending on whether there is an error', function() {
            expect(this.element.find('error-display').length).toBe(0);
            this.controller.error = this.error;
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('with a .merge-message', function() {
            expect(this.element.querySelectorAll('.merge-message').length).toBe(1);
        });
        it('depending on whether there are conflicts', function() {
            expect(this.element.querySelectorAll('.form-container').length).toBe(1);
            expect(this.element.querySelectorAll('.conflicts-container').length).toBe(0);

            this.controller.conflicts = [{}];
            scope.$digest();
            expect(this.element.querySelectorAll('.form-container').length).toBe(0);
            expect(this.element.querySelectorAll('.conflicts-container').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('attemptMerge calls the correct functions', function() {
            describe('when getBranchConflicts is resolved', function() {
                it('and is empty', function() {
                    catalogManagerSvc.getBranchConflicts.and.returnValue($q.when([]));
                    spyOn(this.controller, 'merge');
                    this.controller.attemptMerge();
                    scope.$apply();
                    expect(this.controller.merge).toHaveBeenCalled();
                });
            });
            it('when getBranchConflicts is rejected', function() {
                catalogManagerSvc.getBranchConflicts.and.returnValue($q.reject(this.error));
                this.controller.attemptMerge();
                scope.$apply();
                expect(this.controller.error).toEqual(this.error);
            });
        });
        it('mergeWithResolutions calls the correct functions', function() {
            spyOn(this.controller, 'merge');
            var selectedLeft = {resolved: 'left', right: {additions: ['add-right'], deletions: ['del-right']}};
            var selectedRight = {resolved: 'right', left: {additions: ['add-left'], deletions: ['del-left']}};
            this.controller.conflicts = [selectedLeft, selectedRight];
            this.controller.mergeWithResolutions();
            expect(this.controller.resolutions.additions).toEqual(['del-right', 'del-left']);
            expect(this.controller.resolutions.deletions).toEqual(['add-right', 'add-left']);
            expect(this.controller.merge).toHaveBeenCalled();
        });
        describe('merge calls the correct functions', function() {
            describe('when mergeBranches is resolved', function() {
                beforeEach(function() {
                    catalogManagerSvc.mergeBranches.and.returnValue($q.when(this.commitId));
                });
                describe('and updateOntology is resolved', function() {
                    beforeEach(function() {
                        ontologyStateSvc.updateOntology.and.returnValue($q.when());
                    });
                    describe('and controller.checkbox is truthy', function() {
                        beforeEach(function() {
                            this.controller.checkbox = true;
                        });
                        it('and deleteRecordBranch is resolved', function() {
                            catalogManagerSvc.deleteRecordBranch.and.returnValue($q.when());
                            this.controller.merge();
                            scope.$apply();
                            expect(catalogManagerSvc.mergeBranches).toHaveBeenCalledWith(this.branchId, this.targetId, ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId, jasmine.any(Object));
                            expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.targetId, this.commitId);
                            expect(catalogManagerSvc.deleteRecordBranch).toHaveBeenCalledWith(this.branchId, ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                            expect(ontologyStateSvc.removeBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.branchId);
                            expect(this.controller.targetId).toBe(undefined);
                            expect(util.createSuccessToast).toHaveBeenCalled();
                        });
                        it('and deleteRecordBranch is rejected', function() {
                            catalogManagerSvc.deleteRecordBranch.and.returnValue($q.reject(this.error));
                            this.controller.merge();
                            scope.$apply();
                            expect(catalogManagerSvc.mergeBranches).toHaveBeenCalledWith(this.branchId, this.targetId, ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId, jasmine.any(Object));
                            expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.targetId, this.commitId);
                            expect(catalogManagerSvc.deleteRecordBranch).toHaveBeenCalledWith(this.branchId, ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                            expect(this.controller.error).toEqual(this.error);
                        });
                    });
                    it('and controller.checkbox if falsy', function() {
                        this.controller.checkbox = false;
                        this.controller.merge();
                        scope.$apply();
                        expect(catalogManagerSvc.mergeBranches).toHaveBeenCalledWith(this.branchId, this.targetId, ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId, jasmine.any(Object));
                        expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.targetId, this.commitId);
                        expect(catalogManagerSvc.deleteRecordBranch).not.toHaveBeenCalled();
                        expect(ontologyStateSvc.removeBranch).not.toHaveBeenCalled();
                        expect(this.controller.targetId).toBe(undefined);
                        expect(util.createSuccessToast).toHaveBeenCalled();
                    });
                });
                it('and updateOntology is rejected', function() {
                    ontologyStateSvc.updateOntology.and.returnValue($q.reject(this.error));
                    this.controller.merge();
                    scope.$apply();
                    expect(catalogManagerSvc.mergeBranches).toHaveBeenCalledWith(this.branchId, this.targetId, ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId, jasmine.any(Object));
                    expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.targetId, this.commitId);
                    expect(catalogManagerSvc.deleteRecordBranch).not.toHaveBeenCalled();
                    expect(this.controller.error).toEqual(this.error);
                });
            });
            it('when mergeBranches is rejected', function() {
                catalogManagerSvc.mergeBranches.and.returnValue($q.reject(this.error));
                this.controller.merge();
                scope.$apply();
                expect(catalogManagerSvc.mergeBranches).toHaveBeenCalledWith(this.branchId, this.targetId, ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId, jasmine.any(Object));
                expect(ontologyStateSvc.updateOntology).not.toHaveBeenCalled();
                expect(catalogManagerSvc.deleteRecordBranch).not.toHaveBeenCalled();
                expect(this.controller.error).toEqual(this.error);
            });
        });
        describe('matchesCurrent returns', function() {
            it('true if it does not match ontologyStateService.listItem.ontologyRecord.branchId', function() {
                expect(this.controller.matchesCurrent({'@id': 'differentId'})).toBe(true);
            });
            it('false if it does match ontologyStateService.listItem.ontologyRecord.branchId', function() {
                expect(this.controller.matchesCurrent(this.branch)).toBe(false);
            });
        });
    });
});
