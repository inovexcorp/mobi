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
describe('Create Branch Overlay directive', function() {
    var $compile,
        scope,
        element,
        controller,
        $q,
        catalogManagerSvc,
        ontologyStateSvc,
        stateManagerSvc,
        catalogId,
        prefixes;

    var commitId = 'commitId';
    var branchId = 'branchId';
    var branch = {'@id': branchId};
    var error = 'error';

    beforeEach(function() {
        module('templates');
        module('createBranchOverlay');
        mockCatalogManager();
        mockOntologyState();
        mockStateManager();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _catalogManagerService_, _ontologyStateService_, _$q_,
            _stateManagerService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            catalogManagerSvc = _catalogManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            $q = _$q_;
            stateManagerSvc = _stateManagerService_;
            prefixes = _prefixes_;
        });

        element = $compile(angular.element('<create-branch-overlay></create-branch-overlay>'))(scope);
        scope.$digest();

        controller = element.controller('createBranchOverlay');
        controller.error = 'error';
        scope.$digest();
        catalogId = _.get(catalogManagerSvc.localCatalog, '@id', '');
        _.set(branch, "['" + prefixes.catalog + "head'][0]['@id']", commitId);
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('create-branch-overlay')).toBe(true);
        });
        _.forEach(['form', 'error-display', 'text-input', 'text-area'], function(item) {
            it('with a ' + item, function() {
                expect(element.find(item).length).toBe(1);
            });
        });
        _.forEach(['btn-container', 'btn-primary', 'btn-default'], function(item) {
            it('with a .' + item, function() {
                expect(element.querySelectorAll('.' + item).length).toBe(1);
            });
        });
        it('with buttons to submit and cancel', function() {
            var buttons = element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
        it('depending on the form validity', function() {
            var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            controller.form.$invalid = false;
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        describe('create calls the correct method', function() {
            var createDeferred;
            beforeEach(function() {
                createDeferred = $q.defer();
                catalogManagerSvc.createRecordBranch.and.returnValue(createDeferred.promise);
            });
            describe('when createRecordBranch is resolved', function() {
                var getDeferred;
                beforeEach(function() {
                    getDeferred = $q.defer();
                    catalogManagerSvc.getRecordBranch.and.returnValue(getDeferred.promise);
                    createDeferred.resolve(branchId);
                });
                describe('and when getRecordBranch is resolved', function() {
                    var updateDeferred;
                    beforeEach(function() {
                        updateDeferred = $q.defer();
                        stateManagerSvc.updateOntologyState.and.returnValue(updateDeferred.promise);
                        getDeferred.resolve(branch);
                    });
                    it('and when updateOntologyState is resoled', function() {
                        updateDeferred.resolve();
                        controller.create();
                        scope.$digest();
                        expect(catalogManagerSvc.createRecordBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem
                            .ontologyRecord.recordId, catalogId, controller.branchConfig, ontologyStateSvc.listItem.ontologyRecord.commitId);
                        expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId,
                            ontologyStateSvc.listItem.ontologyRecord.recordId, catalogId);
                        expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                            branchId, commitId);
                        expect(ontologyStateSvc.showCreateBranchOverlay).toBe(false);
                    });
                    it('and when updateOntologyState is rejected', function() {
                        updateDeferred.reject(error);
                        controller.create();
                        scope.$digest();
                        expect(catalogManagerSvc.createRecordBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem
                            .ontologyRecord.recordId, catalogId, controller.branchConfig, ontologyStateSvc.listItem.ontologyRecord.commitId);
                        expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId,
                            ontologyStateSvc.listItem.ontologyRecord.recordId, catalogId);
                        expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                            branchId, commitId);
                        expect(controller.error).toBe(error);
                    });
                });
                it('and when getRecordBranch is rejected', function() {
                    getDeferred.reject(error);
                    controller.create();
                    scope.$digest();
                    expect(catalogManagerSvc.createRecordBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem
                        .ontologyRecord.recordId, catalogId, controller.branchConfig, ontologyStateSvc.listItem.ontologyRecord.commitId);
                    expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId,
                        ontologyStateSvc.listItem.ontologyRecord.recordId, catalogId);
                    expect(controller.error).toBe(error);
                });
            });
            it('when createRecordBranch is rejected', function() {
                createDeferred.reject(error);
                controller.create();
                scope.$digest();
                expect(catalogManagerSvc.createRecordBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                    catalogId, controller.branchConfig, ontologyStateSvc.listItem.ontologyRecord.commitId);
                expect(controller.error).toBe(error);
            });
        });
    });
    it('should call create when the submit button is clicked', function() {
        spyOn(controller, 'create');
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(controller.create).toHaveBeenCalled();
    });
    it('should set the correct state when the cancel button is clicked', function() {
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showCreateBranchOverlay).toBe(false);
    });
});