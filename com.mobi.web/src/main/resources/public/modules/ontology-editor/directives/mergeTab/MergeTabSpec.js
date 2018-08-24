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
    var $compile, scope, $q, ontologyStateSvc, ontologyManagerSvc, catalogManagerSvc, util, prefixes;

    beforeEach(function() {
        module('templates');
        module('mergeTab');
        mockUtil();
        mockOntologyState();
        mockOntologyManager();
        mockCatalogManager();
        mockPrefixes();

        inject(function(_$q_, _$compile_, _$rootScope_, _ontologyStateService_, _ontologyManagerService_, _catalogManagerService_, _utilService_, _prefixes_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            catalogManagerSvc = _catalogManagerService_;
            util = _utilService_;
            prefixes = _prefixes_;
        });

        this.catalogId = _.get(catalogManagerSvc.localCatalog, '@id', '');
        this.error = 'error';
        this.commitId = 'commitId';
        this.branchId = 'branchId';
        this.branch = {'@id': this.branchId};
        this.targetId = 'targetId';
        this.targetBranch = {'@id': this.targetId};

        ontologyStateSvc.listItem.ontologyRecord.branchId = this.branchId;
        ontologyStateSvc.listItem.branches = [this.branch, this.targetBranch];
    });

    beforeEach(function() {
        this.compile = function() {
            this.element = $compile(angular.element('<merge-tab></merge-tab>'))(scope);
            scope.$digest();
            this.controller = this.element.controller('mergeTab');
        }
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        ontologyStateSvc = null;
        ontologyManagerSvc = null;
        catalogManagerSvc = null;
        util = null;
        prefixes = null;
        this.element.remove();
    });

    describe('should initialize correctly if', function() {
        describe('the current branch is a user branch', function() {
            beforeEach(function() {
                this.branch['@type'] = [prefixes.catalog + 'UserBranch'];
                ontologyStateSvc.listItem.userBranch = true;
                catalogManagerSvc.getBranchConflicts.and.returnValue($q.when([{iri: 'conflict1', left: {additions: []}}]))
            });
            it('and has been set before', function() {
                ontologyStateSvc.listItem.merge.target = {'@id': 'previous'};
                this.compile();
                expect(this.controller.branch).toEqual(this.branch);
                expect(ontologyStateSvc.listItem.merge.target).toEqual({'@id': 'previous'});
                expect(ontologyStateSvc.listItem.merge.checkbox).toEqual(true);
            });
            it('and has not been set', function() {
                util.getPropertyId.and.returnValue(this.targetId);
                this.compile();
                expect(this.controller.branch).toEqual(this.branch);
                expect(ontologyStateSvc.listItem.merge.target).toEqual(this.targetBranch);
                expect(ontologyStateSvc.listItem.merge.checkbox).toEqual(true);
            });
        });
        it('the current branch is not a user branch', function() {
            this.compile();
            expect(this.controller.branch).toEqual(this.branch);
            expect(ontologyStateSvc.listItem.merge.target).toBeUndefined();
            expect(ontologyStateSvc.listItem.merge.checkbox).toEqual(false);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.compile();
        });
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('merge-tab')).toBe(true);
        });
        _.forEach(['block', 'block-content', 'block-footer'], function(item) {
            it('for ' + item, function() {
                expect(this.element.find(item).length).toBe(1);
            });
        });
        it('with a button to cancel', function() {
            var buttons = this.element.querySelectorAll('block-footer .btn:not(.btn-primary)');
            expect(buttons.length).toEqual(1);
            expect(angular.element(buttons[0]).text().trim()).toEqual('Cancel');
        });
        it('depending on whether there is an error', function() {
            expect(this.element.find('error-display').length).toBe(0);
            this.controller.error = this.error;
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('depending on whether there are conflicts', function() {
            expect(this.element.find('merge-form').length).toBe(1);
            expect(this.element.find('resolve-conflicts-form').length).toBe(0);
            expect(this.element.querySelectorAll('block-footer .btn-merge').length).toBe(1);
            expect(this.element.querySelectorAll('block-footer .btn-resolution').length).toBe(0);

            ontologyStateSvc.listItem.merge.conflicts = [{}];
            scope.$digest();
            expect(this.element.find('merge-form').length).toBe(0);
            expect(this.element.find('resolve-conflicts-form').length).toBe(1);
            expect(this.element.querySelectorAll('block-footer .btn-merge').length).toBe(0);
            expect(this.element.querySelectorAll('block-footer .btn-resolution').length).toBe(1);
        });
        it('depending on whether all conflicts are resolved', function() {
            ontologyStateSvc.listItem.merge.conflicts = [{}];
            spyOn(this.controller, 'allResolved').and.returnValue(false);
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('block-footer .btn-resolution')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.allResolved.and.returnValue(true);
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on whether a target branch has been selected', function() {
            var button = angular.element(this.element.querySelectorAll('block-footer .btn-merge')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            ontologyStateSvc.listItem.merge.target = this.targetBranch;
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            this.compile();
            ontologyStateSvc.listItem.merge.target = this.targetBranch;
        });
        it('should test whether all conflicts are resolved', function() {
            expect(this.controller.allResolved()).toEqual(true);

            ontologyStateSvc.listItem.merge.conflicts = [{resolved: true}];
            expect(this.controller.allResolved()).toEqual(true);

            ontologyStateSvc.listItem.merge.conflicts = [{resolved: false}];
            expect(this.controller.allResolved()).toEqual(false);
        });
        describe('attemptMerge calls the correct functions', function() {
            describe('when getBranchConflicts is resolved', function() {
                it('and is empty', function() {
                    catalogManagerSvc.getBranchConflicts.and.returnValue($q.when([]));
                    spyOn(this.controller, 'merge');
                    this.controller.attemptMerge();
                    scope.$apply();
                    expect(catalogManagerSvc.getBranchConflicts).toHaveBeenCalledWith(this.branchId, this.targetId, ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                    expect(this.controller.merge).toHaveBeenCalled();
                });
                it('and is not empty', function() {
                    catalogManagerSvc.getBranchConflicts.and.returnValue($q.when([{iri: 'conflict1', left: {additions: []}}, {iri: 'conflict1', right: {additions: []}}, {iri: 'conflict2'}]));
                    spyOn(this.controller, 'merge');
                    this.controller.attemptMerge();
                    scope.$apply();
                    expect(catalogManagerSvc.getBranchConflicts).toHaveBeenCalledWith(this.branchId, this.targetId, ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                    expect(ontologyStateSvc.listItem.merge.conflicts).toEqual([
                        {iri: 'conflict1', resolved: false, left: {additions: []}},
                        {iri: 'conflict1', resolved: false, right: {additions: []}},
                        {iri: 'conflict2', resolved: false}
                    ]);
                    expect(this.controller.merge).not.toHaveBeenCalled();
                });
            });
            it('when getBranchConflicts is rejected', function() {
                catalogManagerSvc.getBranchConflicts.and.returnValue($q.reject(this.error));
                this.controller.attemptMerge();
                scope.$apply();
                expect(catalogManagerSvc.getBranchConflicts).toHaveBeenCalledWith(this.branchId, this.targetId, ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                expect(this.controller.error).toEqual(this.error);
            });
        });
        it('mergeWithResolutions calls the correct functions', function() {
            spyOn(this.controller, 'merge');
            var selectedLeft = {resolved: 'left', right: {additions: ['add-right'], deletions: ['del-right']}};
            var selectedRight = {resolved: 'right', left: {additions: ['add-left'], deletions: ['del-left']}};
            ontologyStateSvc.listItem.merge.conflicts = [selectedLeft, selectedRight];
            this.controller.mergeWithResolutions();
            expect(ontologyStateSvc.listItem.merge.resolutions.additions).toEqual([]);
            expect(ontologyStateSvc.listItem.merge.resolutions.deletions).toEqual(['add-right', 'add-left']);
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
                            ontologyStateSvc.listItem.merge.checkbox = true;
                        });
                        it('and deleteOntologyBranch is resolved', function() {
                            ontologyManagerSvc.deleteOntologyBranch.and.returnValue($q.when());
                            this.controller.merge();
                            scope.$apply();
                            expect(catalogManagerSvc.mergeBranches).toHaveBeenCalledWith(this.branchId, this.targetId, ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId, jasmine.any(Object));
                            expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.targetId, this.commitId);
                            expect(ontologyManagerSvc.deleteOntologyBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.branchId);
                            expect(ontologyStateSvc.removeBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.branchId);
                            expect(util.createSuccessToast).toHaveBeenCalled();
                        });
                        it('and deleteOntologyBranch is rejected', function() {
                            ontologyManagerSvc.deleteOntologyBranch.and.returnValue($q.reject(this.error));
                            this.controller.merge();
                            scope.$apply();
                            expect(catalogManagerSvc.mergeBranches).toHaveBeenCalledWith(this.branchId, this.targetId, ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId, jasmine.any(Object));
                            expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.targetId, this.commitId);
                            expect(ontologyManagerSvc.deleteOntologyBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.branchId);
                            expect(this.controller.error).toEqual(this.error);
                        });
                    });
                    it('and controller.checkbox if falsy', function() {
                        ontologyStateSvc.listItem.merge.checkbox = false;
                        this.controller.merge();
                        scope.$apply();
                        expect(catalogManagerSvc.mergeBranches).toHaveBeenCalledWith(this.branchId, this.targetId, ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId, jasmine.any(Object));
                        expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.targetId, this.commitId);
                        expect(catalogManagerSvc.deleteRecordBranch).not.toHaveBeenCalled();
                        expect(ontologyStateSvc.removeBranch).not.toHaveBeenCalled();
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
        it('should cancel the merge', function() {
            this.controller.cancel();
            expect(ontologyStateSvc.listItem.merge.active).toEqual(false);
            expect(ontologyStateSvc.listItem.merge.target).toBeUndefined();
            expect(ontologyStateSvc.listItem.merge.checkbox).toEqual(false);
            expect(ontologyStateSvc.listItem.merge.difference).toBeUndefined();
            expect(ontologyStateSvc.listItem.merge.conflicts).toEqual([]);
            expect(ontologyStateSvc.listItem.merge.resolutions).toEqual({additions: [], deletions: []});
        });
    });
    it('should call merge when the button is clicked', function() {
        this.compile();
        spyOn(this.controller, 'attemptMerge');
        var button = angular.element(this.element.querySelectorAll('block-footer .btn-merge')[0]);
        button.triggerHandler('click');
        expect(this.controller.attemptMerge).toHaveBeenCalled();
    });
    it('should call mergeWithResolutions when the Submit button is clicked', function() {
        this.compile();
        ontologyStateSvc.listItem.merge.conflicts = [{}];
        scope.$digest();
        spyOn(this.controller, 'mergeWithResolutions');

        var button = angular.element(this.element.querySelectorAll('block-footer .btn-resolution')[0]);
        button.triggerHandler('click');
        expect(this.controller.mergeWithResolutions).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        this.compile();
        spyOn(this.controller, 'cancel');
        var button = angular.element(this.element.querySelectorAll('block-footer .btn:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
});
