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
    var $compile, scope, $q, ontologyStateSvc, ontologyManagerSvc, catalogManagerSvc, util;

    beforeEach(function() {
        module('templates');
        module('mergeTab');
        mockUtil();
        mockOntologyState();
        mockOntologyManager();
        mockCatalogManager();
        mockPrefixes();

        inject(function(_$q_, _$compile_, _$rootScope_, _ontologyStateService_, _ontologyManagerService_, _catalogManagerService_, _utilService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
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
        ontologyManagerSvc = null;
        catalogManagerSvc = null;
        util = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
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
            var buttons = this.element.querySelectorAll('block-footer .btn-default');
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

            this.controller.conflicts = [{}];
            scope.$digest();
            expect(this.element.find('merge-form').length).toBe(0);
            expect(this.element.find('resolve-conflicts-form').length).toBe(1);
            expect(this.element.querySelectorAll('block-footer .btn-merge').length).toBe(0);
            expect(this.element.querySelectorAll('block-footer .btn-resolution').length).toBe(1);
        });
        it('depending on whether all conflicts are resolved', function() {
            this.controller.conflicts = [{}];
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

            this.controller.targetId = 'test';
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        it('should test whether all conflicts are resolved', function() {
            expect(this.controller.allResolved()).toEqual(true);

            this.controller.conflicts = [{resolved: true}];
            expect(this.controller.allResolved()).toEqual(true);

            this.controller.conflicts = [{resolved: false}];
            expect(this.controller.allResolved()).toEqual(false);
        });
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
            expect(this.controller.resolutions.additions).toEqual([]);
            console.log(this.controller.resolutions.additions)
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
                        it('and deleteOntology is resolved', function() {
                            ontologyManagerSvc.deleteOntology.and.returnValue($q.when());
                            this.controller.merge();
                            scope.$apply();
                            expect(catalogManagerSvc.mergeBranches).toHaveBeenCalledWith(this.branchId, this.targetId, ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId, jasmine.any(Object));
                            expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.targetId, this.commitId);
                            expect(ontologyManagerSvc.deleteOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.branchId);
                            expect(ontologyStateSvc.removeBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.branchId);
                            expect(util.createSuccessToast).toHaveBeenCalled();
                        });
                        it('and deleteOntology is rejected', function() {
                            ontologyManagerSvc.deleteOntology.and.returnValue($q.reject(this.error));
                            this.controller.merge();
                            scope.$apply();
                            expect(catalogManagerSvc.mergeBranches).toHaveBeenCalledWith(this.branchId, this.targetId, ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId, jasmine.any(Object));
                            expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.targetId, this.commitId);
                            expect(ontologyManagerSvc.deleteOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.branchId);
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
    });
    it('should call merge when the button is clicked', function() {
        spyOn(this.controller, 'attemptMerge');
        var button = angular.element(this.element.querySelectorAll('block-footer .btn-merge')[0]);
        button.triggerHandler('click');
        expect(this.controller.attemptMerge).toHaveBeenCalled();
    });
    it('should call mergeWithResolutions when the Submit button is clicked', function() {
        this.controller.conflicts = [{}];
        scope.$digest();
        spyOn(this.controller, 'mergeWithResolutions');

        var button = angular.element(this.element.querySelectorAll('block-footer .btn-resolution')[0]);
        button.triggerHandler('click');
        expect(this.controller.mergeWithResolutions).toHaveBeenCalled();
    });
});
