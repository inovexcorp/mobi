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
describe('Ontology Download Overlay directive', function() {
    var $compile,
        scope,
        element,
        controller,
        ontologyManagerSvc,
        ontologyStateSvc,
        $q,
        catalogManagerSvc;
    var catalogId = 'catalogId';
    var error = 'error';

    beforeEach(function() {
        module('templates');
        module('ontologyDownloadOverlay');
        injectRegexConstant();
        injectSplitIRIFilter();
        mockOntologyState();
        mockOntologyManager();
        mockCatalogManager();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _ontologyStateService_, _$q_, _catalogManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            $q = _$q_;
            catalogManagerSvc = _catalogManagerService_;
        });

        catalogManagerSvc.localCatalog = {'@id': catalogId};

        element = $compile(angular.element('<ontology-download-overlay></ontology-download-overlay>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('ontology-download-overlay')).toBe(true);
            expect(element.querySelectorAll('.content').length).toBe(1);
        });
        it('with a h6', function() {
            expect(element.find('h6').length).toBe(1);
        });
        it('with a .form-group', function() {
            expect(element.querySelectorAll('.form-group').length).toBe(1);
        });
        it('with a .btn-container', function() {
            expect(element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('with a .error-msg', function() {
            expect(element.querySelectorAll('.error-msg').length).toBe(1);
        });
        it('depending on whether the fileName is valid', function() {
            var formGroup = angular.element(element.querySelectorAll('.form-group')[0]);
            expect(formGroup.hasClass('has-error')).toBe(false);

            controller = element.controller('ontologyDownloadOverlay');
            controller.form = {
                fileName: {
                    '$error': {
                        pattern: true
                    }
                }
            }
            scope.$digest();
            expect(formGroup.hasClass('has-error')).toBe(true);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            controller = element.controller('ontologyDownloadOverlay');
        });
        describe('download calls the correct manager function', function() {
            var getDeferred;
            beforeEach(function() {
                getDeferred = $q.defer();
                controller.serialization = 'serialization';
                controller.fileName = 'fileName';
                ontologyStateSvc.showDownloadOverlay = true;
                catalogManagerSvc.getInProgressCommit.and.returnValue(getDeferred.promise);
            });
            describe('when getInProgressCommit resolves', function() {
                var downloadDeferred;
                beforeEach(function() {
                    getDeferred.resolve();
                    downloadDeferred = $q.defer();
                    catalogManagerSvc.downloadResource.and.returnValue(downloadDeferred.promise);
                });
                it('and downloadResource resolves', function() {
                    downloadDeferred.resolve();
                    controller.download();
                    scope.$apply();
                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, catalogId);
                    expect(catalogManagerSvc.downloadResource).toHaveBeenCalledWith(ontologyStateSvc.listItem.commitId, ontologyStateSvc.listItem.branchId, ontologyStateSvc.listItem.recordId, catalogId, true, controller.serialization, controller.fileName);
                    expect(ontologyStateSvc.showDownloadOverlay).toBe(false);
                });
                it('and downloadResource rejects', function() {
                    downloadDeferred.reject(error);
                    controller.download();
                    scope.$apply();
                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, catalogId);
                    expect(catalogManagerSvc.downloadResource).toHaveBeenCalledWith(ontologyStateSvc.listItem.commitId, ontologyStateSvc.listItem.branchId, ontologyStateSvc.listItem.recordId, catalogId, true, controller.serialization, controller.fileName);
                    expect(ontologyStateSvc.showDownloadOverlay).toBe(true);
                    expect(controller.error).toEqual(error);
                });
            });
            describe('when getInProgressCommit rejects', function() {
                describe('with message "User has no InProgressCommit"', function() {
                    var downloadDeferred;
                    beforeEach(function() {
                        getDeferred.reject('User has no InProgressCommit');
                        downloadDeferred = $q.defer();
                        catalogManagerSvc.downloadResource.and.returnValue(downloadDeferred.promise);
                    });
                    it('and downloadResource resolves', function() {
                        downloadDeferred.resolve();
                        controller.download();
                        scope.$apply();
                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, catalogId);
                        expect(catalogManagerSvc.downloadResource).toHaveBeenCalledWith(ontologyStateSvc.listItem.commitId, ontologyStateSvc.listItem.branchId, ontologyStateSvc.listItem.recordId, catalogId, false, controller.serialization, controller.fileName);
                        expect(ontologyStateSvc.showDownloadOverlay).toBe(false);
                    });
                    it('and downloadResource rejects', function() {
                        downloadDeferred.reject(error);
                        controller.download();
                        scope.$apply();
                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, catalogId);
                        expect(catalogManagerSvc.downloadResource).toHaveBeenCalledWith(ontologyStateSvc.listItem.commitId, ontologyStateSvc.listItem.branchId, ontologyStateSvc.listItem.recordId, catalogId, false, controller.serialization, controller.fileName);
                        expect(ontologyStateSvc.showDownloadOverlay).toBe(true);
                        expect(controller.error).toEqual(error);
                    });
                });
                it('with other message', function() {
                    getDeferred.reject(error);
                    controller.download();
                    scope.$apply();
                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, catalogId);
                    expect(ontologyStateSvc.showDownloadOverlay).toBe(true);
                    expect(controller.error).toEqual(error);
                });
            });
        });
    });
});