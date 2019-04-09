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
describe('Edit Branch Overlay component', function() {
    var $compile, scope, $q, catalogManagerSvc, ontologyStateSvc, prefixes, utilSvc;

    beforeEach(function() {
        module('templates');
        module('ontology-editor');
        mockCatalogManager();
        mockOntologyState();
        mockPrefixes();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _$q_, _catalogManagerService_, _ontologyStateService_, _prefixes_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            catalogManagerSvc = _catalogManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            prefixes = _prefixes_;
            utilSvc = _utilService_;
        });

        scope.resolve = {
            branch: {'@id': 'id', [prefixes.dcterms + 'description']: 'description'}
        };
        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<edit-branch-overlay resolve="resolve" close="close()" dismiss="dismiss()"></edit-branch-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('editBranchOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        catalogManagerSvc = null;
        ontologyStateSvc = null;
        prefixes = null;
        utilSvc = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('EDIT-BRANCH-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-body').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toBe(1);
        });
        _.forEach(['form', 'text-input', 'text-area'], item => {
            it('with a ' + item, function() {
                expect(this.element.find(item).length).toBe(1);
            });
        });
        it('depending on whether there is an error', function() {
            expect(this.element.find('error-display').length).toBe(0);
            this.controller.error = 'error';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('with custom buttons to submit and cancel', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Submit'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
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
        describe('edit calls the correct method', function() {
            describe('for either case', function() {
                it('always calls this method', function() {
                    this.controller.edit();
                    expect(utilSvc.updateDctermsValue).toHaveBeenCalledWith(scope.resolve.branch, 'title', this.controller.branchTitle);
                });
                it('when controller.branchDescription is empty', function() {
                    this.controller.branchDescription = '';
                    this.controller.edit();
                    expect(_.has(scope.resolve.branch, prefixes.dcterms + 'description')).toBe(false);
                });
                it('when controller.branchDescription is not empty', function() {
                    this.controller.branchDescription = 'new description';
                    this.controller.edit();
                    expect(utilSvc.updateDctermsValue).toHaveBeenCalledWith(scope.resolve.branch, 'description', this.controller.branchDescription);
                });
            });
            it('when resolved', function() {
                catalogManagerSvc.updateRecordBranch.and.returnValue($q.when('id'));
                this.controller.edit();
                scope.$apply();
                expect(catalogManagerSvc.updateRecordBranch).toHaveBeenCalledWith(scope.resolve.branch['@id'], ontologyStateSvc.listItem.ontologyRecord.recordId, '', scope.resolve.branch);
                expect(scope.close).toHaveBeenCalled();
            });
            it('when rejected', function() {
                var errorMessage = 'error message';
                catalogManagerSvc.updateRecordBranch.and.returnValue($q.reject(errorMessage));
                this.controller.edit();
                scope.$apply();
                expect(catalogManagerSvc.updateRecordBranch).toHaveBeenCalledWith(scope.resolve.branch['@id'], ontologyStateSvc.listItem.ontologyRecord.recordId, '', scope.resolve.branch);
                expect(this.controller.error).toBe(errorMessage);
                expect(scope.close).not.toHaveBeenCalled();
            });
        });
        it('should cancel the overlay', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    it('should call edit when the submit button is clicked', function() {
        spyOn(this.controller, 'edit');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.edit).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
});