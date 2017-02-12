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
describe('Ontology Button Stack directive', function() {
    var $compile,
        scope,
        $q,
        element,
        controller,
        ontologyStateSvc,
        catalogManagerSvc,
        ontologyManagerSvc,
        catalogId;

    var error = 'error';
    var id = 'id';

    beforeEach(function() {
        module('templates');
        module('ontologyButtonStack');
        injectRemoveMatontoFilter();
        mockOntologyState();
        mockOntologyManager();
        mockCatalogManager();
        mockUtil();
        mockUpdateRefs();

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _catalogManagerService_,
            _ontologyManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            ontologyStateSvc = _ontologyStateService_;
            catalogManagerSvc = _catalogManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
        });

        element = $compile(angular.element('<ontology-button-stack></ontology-button-stack>'))(scope);
        scope.$digest();
        catalogId = _.get(catalogManagerSvc.localCatalog, '@id', '');
        controller = element.controller('ontologyButtonStack');
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('ontology-button-stack')).toBe(true);
        });
        it('with a circle-button-stack', function() {
            expect(element.find('circle-button-stack').length).toBe(1);
        });
        it('with circle-buttons', function() {
            expect(element.find('circle-button').length).toBe(4);
        });
        it('depending on whether changes are being deleted', function() {
            expect(element.find('confirmation-overlay').length).toBe(0);

            controller.showDeleteOverlay = true;
            scope.$digest();
            expect(element.find('confirmation-overlay').length).toBe(1);
        });
        it('depending on whether an error occured while deleting', function() {
            controller.showDeleteOverlay = true;
            scope.$digest();
            expect(element.find('error-display').length).toBe(0);

            controller.error = error;
            scope.$digest();
            expect(element.find('error-display').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('delete calls the correct manager methods and sets the correct variables', function() {
            var deleteDeferred;
            beforeEach(function() {
                deleteDeferred = $q.defer();
                catalogManagerSvc.deleteInProgressCommit.and.returnValue(deleteDeferred.promise);
                controller.showDeleteOverlay = true;
                ontologyStateSvc.listItem.inProgressCommit.additions = [{'@id': id}];
                ontologyStateSvc.listItem.inProgressCommit.deletions = [{'@id': id}];
            });
            describe('when deleteInProgressCommit resolves', function() {
                var updateDeferred;
                beforeEach(function() {
                    updateDeferred = $q.defer();
                    ontologyManagerSvc.updateOntology.and.returnValue(updateDeferred.promise);
                    deleteDeferred.resolve();
                    controller.delete();
                });
                it('and updateOntology resolves', function() {
                    updateDeferred.resolve();
                    scope.$digest();
                    expect(catalogManagerSvc.deleteInProgressCommit).toHaveBeenCalledWith(
                        ontologyStateSvc.listItem.recordId, catalogId);
                    expect(ontologyManagerSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId,
                        ontologyStateSvc.listItem.branchId, ontologyStateSvc.listItem.commitId,
                        ontologyStateSvc.state.type);
                    expect(ontologyStateSvc.clearInProgressCommit).toHaveBeenCalled();
                    expect(controller.showDeleteOverlay).toBe(false);
                });
                it('and updateOntology rejects', function() {
                    updateDeferred.reject(error);
                    scope.$digest();
                    expect(catalogManagerSvc.deleteInProgressCommit).toHaveBeenCalledWith(
                        ontologyStateSvc.listItem.recordId, catalogId);
                    expect(controller.error).toEqual(error);
                });
            });
            it('when deleteInProgressCommit rejects', function() {
                deleteDeferred.reject(error);
                controller.delete();
                scope.$digest();
                expect(catalogManagerSvc.deleteInProgressCommit).toHaveBeenCalledWith(
                    ontologyStateSvc.listItem.recordId, catalogId);
                expect(controller.error).toBe(error);
            });
        });
    });
});