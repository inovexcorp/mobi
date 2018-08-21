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
describe('Edit Branch Overlay directive', function() {
    var $compile, scope, $q, catalogManagerSvc, ontologyStateSvc, prefixes, utilSvc;

    beforeEach(function() {
        module('templates');
        module('editBranchOverlay');
        mockCatalogManager();
        mockOntologyState();
        mockPrefixes();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _catalogManagerService_, _ontologyStateService_, _$q_, _prefixes_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            catalogManagerSvc = _catalogManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            $q = _$q_;
            prefixes = _prefixes_;
            utilSvc = _utilService_;
        });

        scope.overlayFlag = true;
        scope.branch = {'@id': 'id'};
        scope.branch[prefixes.dcterms + 'description'] = 'description';
        this.element = $compile(angular.element('<edit-branch-overlay overlay-flag="overlayFlag" branch="branch"></edit-branch-overlay>'))(scope);
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

    describe('controller bound variable', function() {
        it('branch should be two way bound', function() {
            this.controller.branch = {'@id': 'new'};
            scope.$digest();
            expect(scope.branch).toEqual({'@id': 'new'});
        });
        it('overlayFlag should be two way bound', function() {
            this.controller.overlayFlag = false;
            scope.$digest();
            expect(scope.overlayFlag).toEqual(false);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('edit-branch-overlay')).toBe(true);
        });
        _.forEach(['form', 'text-input', 'text-area'], function(item) {
            it('with a ' + item, function() {
                expect(this.element.find(item).length).toBe(1);
            });
        });
        _.forEach(['btn-container', 'btn-primary'], function(item) {
            it('with a .' + item, function() {
                expect(this.element.querySelectorAll('.' + item).length).toBe(1);
            });
        });
        it('with a regular .btn', function() {
            expect(this.element.querySelectorAll('.btn:not(.btn-primary)').length).toBe(1);
        });
        it('depending on whether there is an error', function() {
            expect(this.element.find('error-display').length).toBe(0);
            this.controller.error = 'error';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('with custom buttons to submit and cancel', function() {
            var buttons = this.element.find('button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Submit'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
        it('depending on the form validity', function() {
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.form.$invalid = false;
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        describe('edit calls the correct method', function() {
            describe('for either case', function() {
                it('always calls this method', function() {
                    this.controller.edit();
                    expect(utilSvc.updateDctermsValue).toHaveBeenCalledWith(this.controller.branch, 'title',
                        this.controller.branchTitle);
                });
                it('when controller.branchDescription is empty', function() {
                    this.controller.branchDescription = '';
                    this.controller.edit();
                    expect(_.has(this.controller.branch, prefixes.dcterms + 'description')).toBe(false);
                });
                it('when controller.branchDescription is not empty', function() {
                    this.controller.branchDescription = 'new description';
                    this.controller.edit();
                    expect(utilSvc.updateDctermsValue).toHaveBeenCalledWith(this.controller.branch, 'description',
                        this.controller.branchDescription);
                });
            });
            it('when resolved', function() {
                catalogManagerSvc.updateRecordBranch.and.returnValue($q.when('id'));
                this.controller.edit();
                scope.$apply();
                expect(catalogManagerSvc.updateRecordBranch).toHaveBeenCalledWith(this.controller.branch['@id'],
                    ontologyStateSvc.listItem.ontologyRecord.recordId, '', this.controller.branch);
                expect(this.controller.overlayFlag).toBe(false);
            });
            it('when rejected', function() {
                var errorMessage = 'error message';
                catalogManagerSvc.updateRecordBranch.and.returnValue($q.reject(errorMessage));
                this.controller.edit();
                scope.$apply();
                expect(catalogManagerSvc.updateRecordBranch).toHaveBeenCalledWith(this.controller.branch['@id'],
                    ontologyStateSvc.listItem.ontologyRecord.recordId, '', this.controller.branch);
                expect(this.controller.error).toBe(errorMessage);
            });
        });
    });
    it('should call edit when the submit button is clicked', function() {
        spyOn(this.controller, 'edit');
        var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.edit).toHaveBeenCalled();
    });
    it('should set overlayFlag when the cancel button is clicked', function() {
        var button = angular.element(this.element.querySelectorAll('.btn-container button:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(scope.overlayFlag).toBe(false);
    });
});