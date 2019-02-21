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
describe('Create Branch Overlay directive', function() {
    var $compile, scope, $q, catalogManagerSvc, ontologyStateSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('createBranchOverlay');
        mockCatalogManager();
        mockOntologyState();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _$q_, _catalogManagerService_, _ontologyStateService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            catalogManagerSvc = _catalogManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            prefixes = _prefixes_;
        });

        this.catalogId = _.get(catalogManagerSvc.localCatalog, '@id', '');
        this.commitId = 'commitId';
        this.branchId = 'branchId';
        this.branch = {'@id': this.branchId};
        this.error = 'error';

        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<create-branch-overlay close="close()" dismiss="dismiss()"></create-branch-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('createBranchOverlay');
        this.controller.error = this.error;
        scope.$digest();
        _.set(this.branch, "['" + prefixes.catalog + "head'][0]['@id']", this.commitId);
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        catalogManagerSvc = null;
        ontologyStateSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('CREATE-BRANCH-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-body').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toBe(1);
        });
        _.forEach(['form', 'error-display', 'text-input', 'text-area'], function(item) {
            it('with a ' + item, function() {
                expect(this.element.find(item).length).toBe(1);
            });
        });
        it('with buttons to submit and cancel', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
        it('depending on the form validity', function() {
            var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeFalsy();
            
            this.controller.form.$invalid = true;
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
    });
    describe('controller methods', function() {
        it('cancel calls dismiss', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
        describe('create calls the correct method', function() {
            describe('when createRecordBranch is resolved', function() {
                beforeEach(function() {
                    catalogManagerSvc.createRecordBranch.and.returnValue($q.when(this.branchId));
                });
                describe('and when getRecordBranch is resolved', function() {
                    beforeEach(function() {
                        catalogManagerSvc.getRecordBranch.and.returnValue($q.when(this.branch));
                    });
                    it('and when updateOntologyState is resolved', function() {
                        ontologyStateSvc.updateOntologyState.and.returnValue($q.when());
                        this.controller.create();
                        scope.$digest();
                        expect(catalogManagerSvc.createRecordBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem
                            .ontologyRecord.recordId, this.catalogId, this.controller.branchConfig, ontologyStateSvc.listItem.ontologyRecord.commitId);
                        expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId,
                            ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                        expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: ontologyStateSvc.listItem.ontologyRecord.recordId,
                            commitId: this.commitId, branchId: this.branchId});
                        expect(scope.close).toHaveBeenCalled();
                    });
                    it('and when updateOntologyState is rejected', function() {
                        ontologyStateSvc.updateOntologyState.and.returnValue($q.reject(this.error));
                        this.controller.create();
                        scope.$digest();
                        expect(catalogManagerSvc.createRecordBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem
                            .ontologyRecord.recordId, this.catalogId, this.controller.branchConfig, ontologyStateSvc.listItem.ontologyRecord.commitId);
                        expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId,
                            ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                        expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: ontologyStateSvc.listItem.ontologyRecord.recordId, commitId: this.commitId, branchId: this.branchId});
                        expect(this.controller.error).toBe(this.error);
                        expect(scope.close).not.toHaveBeenCalled();
                    });
                });
                it('and when getRecordBranch is rejected', function() {
                    catalogManagerSvc.getRecordBranch.and.returnValue($q.reject(this.error));
                    this.controller.create();
                    scope.$digest();
                    expect(catalogManagerSvc.createRecordBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem
                        .ontologyRecord.recordId, this.catalogId, this.controller.branchConfig, ontologyStateSvc.listItem.ontologyRecord.commitId);
                    expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId,
                        ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                    expect(this.controller.error).toBe(this.error);
                    expect(scope.close).not.toHaveBeenCalled();
                });
            });
            it('when createRecordBranch is rejected', function() {
                catalogManagerSvc.createRecordBranch.and.returnValue($q.reject(this.error));
                this.controller.create();
                scope.$digest();
                expect(catalogManagerSvc.createRecordBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                    this.catalogId, this.controller.branchConfig, ontologyStateSvc.listItem.ontologyRecord.commitId);
                expect(this.controller.error).toBe(this.error);
                expect(scope.close).not.toHaveBeenCalled();
            });
        });
    });
    it('should call create when the submit button is clicked', function() {
        spyOn(this.controller, 'create');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.create).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
});