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
describe('Edit Branch Overlay directive', function() {
    var $compile, scope, isolatedScope, element, controller, catalogManagerSvc, ontologyStateSvc, $q, prefixes, utilSvc;
    var branch = {'@id': 'id'};

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
        scope.branch = branch;
        branch[prefixes.dcterms + 'description'] = 'description';

        element = $compile(angular.element('<edit-branch-overlay overlay-flag="overlayFlag" branch="branch"></edit-branch-overlay>'))(scope);
        scope.$digest();

        controller = element.controller('editBranchOverlay');
        controller.error = 'error';
        scope.$digest();
        isolatedScope = element.isolateScope();
    });

    describe('controller bound variables', function() {
        it('branch should be two way bound', function() {
            controller.branch = {'@id': 'new'};
            scope.$digest();
            expect(scope.branch).toEqual({'@id': 'new'});
        });
        it('overlayFlag should be two way bound', function() {
            controller.overlayFlag = false;
            scope.$digest();
            expect(scope.overlayFlag).toEqual(false);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for a div', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on .edit-branch-overlay', function() {
            expect(element.hasClass('edit-branch-overlay')).toBe(true);
        });
        _.forEach(['form', 'error-display', 'text-input', 'text-area'], function(item) {
            it('based on ' + item, function() {
                expect(element.find(item).length).toBe(1);
            });
        });
        _.forEach(['btn-container', 'btn-primary', 'btn-default'], function(item) {
            it('based on .' + item, function() {
                expect(element.querySelectorAll('.' + item).length).toBe(1);
            });
        });
    });
    describe('controller methods', function() {
        describe('edit calls the correct method', function() {
            var deferred;
            beforeEach(function() {
                deferred = $q.defer();
                catalogManagerSvc.updateRecordBranch.and.returnValue(deferred.promise);
            });
            describe('for either case', function() {
                it('always calls this method', function() {
                    controller.edit();
                    expect(utilSvc.setDctermsValue).toHaveBeenCalledWith(controller.branch, 'title',
                        controller.branchTitle);
                });
                it('when controller.branchDescription is empty', function() {
                    controller.branchDescription = '';
                    controller.edit();
                    expect(_.has(controller.branch, prefixes.dcterms + 'description')).toBe(false);
                });
                it('when controller.branchDescription is not empty', function() {
                    controller.branchDescription = 'new description';
                    controller.edit();
                    expect(utilSvc.setDctermsValue).toHaveBeenCalledWith(controller.branch, 'description',
                        controller.branchDescription);
                });
            });
            it('when resolved', function() {
                deferred.resolve('id');
                controller.edit();
                scope.$digest();
                expect(catalogManagerSvc.updateRecordBranch).toHaveBeenCalledWith(controller.branch['@id'],
                    ontologyStateSvc.listItem.recordId, '', controller.branch);
                expect(controller.overlayFlag).toBe(false);
            });
            it('when rejected', function() {
                var errorMessage = 'error message';
                deferred.reject(errorMessage);
                controller.edit();
                scope.$digest();
                expect(catalogManagerSvc.updateRecordBranch).toHaveBeenCalledWith(controller.branch['@id'],
                    ontologyStateSvc.listItem.recordId, '', controller.branch);
                expect(controller.error).toBe(errorMessage);
            });
        });
    });
});