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
describe('Edit Dataset Overlay directive', function() {
    var $compile, scope, $q, datasetStateSvc, datasetManagerSvc, catalogManagerSvc, utilSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('editDatasetOverlay');
        mockDatasetState();
        mockDatasetManager();
        mockCatalogManager();
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _datasetStateService_, _datasetManagerService_, _catalogManagerService_, _utilService_, _$q_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            datasetStateSvc = _datasetStateService_;
            datasetManagerSvc = _datasetManagerService_
            catalogManagerSvc = _catalogManagerService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
            $q = _$q_;
        });

        utilSvc.getSkolemizedIRI.and.returnValue('http://mobi.com/.well-known/genid/1234');
        utilSvc.getPropertyId.and.callFake(function(entity, propertyIRI) {
            switch (propertyIRI) {
                case prefixes.dataset + 'dataset':
                    return 'dataset';
                    break;
                case prefixes.dataset + 'linksToRecord':
                    return 'record';
                    break;
                case prefixes.catalog + 'head':
                    return 'commit';
                    break;
                default:
                    return '';
            }
        });
        utilSvc.getPropertyValue.and.returnValue('repository');
        utilSvc.getDctermsValue.and.callFake(function(entity, property) {
            switch (property) {
                case 'title':
                    return 'title';
                    break;
                case 'description':
                    return 'description';
                    break;
                default:
                    return '';
            }
        });
        catalogManagerSvc.localCatalog = {'@id': 'http://mobi.com/catalog-local'};
        datasetStateSvc.selectedDataset = {identifiers: [], record: {'@id': 'record'}};
        datasetStateSvc.selectedDataset[prefixes.catalog + 'keyword'] = [{'@value': 'keyword'}];
        this.expectedRecord = {'@id': datasetStateSvc.selectedDataset.record['@id']};
        this.expectedRecord[prefixes.dcterms + 'title'] = [];
        this.expectedRecord[prefixes.dcterms + 'description'] = [];
        this.expectedRecord[prefixes.catalog + 'keyword'] = [];
        scope.onClose = jasmine.createSpy('onClose');
        this.element = $compile(angular.element('<edit-dataset-overlay on-close="onClose()"></edit-dataset-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('editDatasetOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        datasetStateSvc = null;
        datasetManagerSvc = null;
        catalogManagerSvc = null;
        utilSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('onClose should be called in parent scope when invoked', function() {
            this.controller.onClose();
            expect(scope.onClose).toHaveBeenCalled();
        });
    });
    describe('controller methods', function() {
        describe('should update a dataset', function() {
            it('unless an error occurs', function() {
                datasetManagerSvc.updateDatasetRecord.and.returnValue($q.reject('Error Message'));
                this.controller.update();
                scope.$apply();
                expect(datasetManagerSvc.updateDatasetRecord).toHaveBeenCalledWith(datasetStateSvc.selectedDataset.record['@id'], catalogManagerSvc.localCatalog['@id'], jasmine.any(Array), 'title');
                expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                expect(datasetStateSvc.setResults).not.toHaveBeenCalled();
                expect(scope.onClose).not.toHaveBeenCalled();
                expect(this.controller.error).toBe('Error Message');
            });
            describe('successfully', function() {
                beforeEach(function() {
                    datasetManagerSvc.updateDatasetRecord.and.returnValue($q.when());
                });
                it('updating title, description, and keywords', function() {
                    this.controller.update();
                    scope.$apply();
                    expect(utilSvc.setDctermsValue).toHaveBeenCalledWith(this.expectedRecord, 'title', this.controller.recordConfig.title);
                    expect(utilSvc.setDctermsValue).toHaveBeenCalledWith(this.expectedRecord, 'description', this.controller.recordConfig.description);
                    _.forEach(datasetStateSvc.selectedDataset.record[prefixes.catalog + 'keyword'], function(obj) {
                        expect(utilSvc.setDctermsValue).toHaveBeenCalledWith(this.expectedRecord, 'keyword', obj['@value']);
                    });
                    expect(datasetManagerSvc.updateDatasetRecord).toHaveBeenCalledWith(datasetStateSvc.selectedDataset.record['@id'], catalogManagerSvc.localCatalog['@id'], jasmine.any(Array), 'title');
                    expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                    expect(datasetStateSvc.setResults).toHaveBeenCalled();
                    expect(scope.onClose).toHaveBeenCalled();
                    expect(this.controller.error).toBe('');
                });
                it('when all ontologies are removed.', function() {
                    datasetStateSvc.selectedDataset.identifier = [{'@id': 'identifier'}];
                    this.controller.update();
                    scope.$apply();
                    expect(datasetManagerSvc.updateDatasetRecord).toHaveBeenCalledWith(datasetStateSvc.selectedDataset.record['@id'], catalogManagerSvc.localCatalog['@id'], [this.expectedRecord], 'title');
                    expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                    expect(datasetStateSvc.setResults).toHaveBeenCalled();
                    expect(scope.onClose).toHaveBeenCalled();
                    expect(this.controller.error).toBe('');
                });
                it('when an ontology is added.', function() {
                    var branch = {'@id': 'branch'};
                    this.controller.selectedOntologies = [{'@id': 'ontology'}];
                    catalogManagerSvc.getRecordMasterBranch.and.returnValue($q.when(branch));
                    var expectedBlankNode = {};
                    expectedBlankNode[prefixes.dataset + 'linksToRecord'] = [{'@id': 'ontology'}];
                    expectedBlankNode[prefixes.dataset + 'linksToBranch'] = [{'@id': 'branch'}];
                    expectedBlankNode[prefixes.dataset + 'linksToCommit'] = [{'@id': 'commit'}];
                    this.controller.update();
                    scope.$apply();
                    expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith('ontology', catalogManagerSvc.localCatalog['@id']);
                    expect(utilSvc.getSkolemizedIRI).toHaveBeenCalled();
                    expect(utilSvc.getPropertyId).toHaveBeenCalledWith(branch, prefixes.catalog + 'head');
                    expect(utilSvc.setPropertyId).toHaveBeenCalledWith(this.expectedRecord, prefixes.dataset + 'ontology', jasmine.any(String));
                    expect(datasetManagerSvc.updateDatasetRecord).toHaveBeenCalledWith(datasetStateSvc.selectedDataset.record['@id'], catalogManagerSvc.localCatalog['@id'], [jasmine.objectContaining(expectedBlankNode), this.expectedRecord], 'title');
                    expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                    expect(datasetStateSvc.setResults).toHaveBeenCalled();
                    expect(scope.onClose).toHaveBeenCalled();
                    expect(this.controller.error).toBe('');
                });
            });
        });
    });
    describe('fills the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('edit-dataset-overlay')).toBe(true);
            expect(this.element.hasClass('overlay')).toBe(true);
        });
        it('with a .content', function() {
            expect(this.element.querySelectorAll('.content').length).toBe(1);
        });
        it('with a text-input', function() {
            var inputs = this.element.querySelectorAll('input');
            expect(inputs.length).toBe(1);
            expect(angular.element(inputs[0]).attr('name').trim()).toEqual('title');
        });
        it('with a text-area', function() {
            expect(this.element.find('text-area').length).toBe(1);
        });
        it('with a keyword-select', function() {
            expect(this.element.find('keyword-select').length).toBe(1);
        });
        it('with a datasets-ontology-picker', function() {
            expect(this.element.find('datasets-ontology-picker').length).toBe(1);
        });
        it('depending on whether an error has occured', function() {
            expect(this.element.find('error-display').length).toBe(0);

            this.controller.error = 'test';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('depending on the validity of the form', function() {
            this.controller.infoForm.$invalid = true;
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.infoForm.$invalid = false;
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('with the correct buttons', function() {
            var buttons = this.element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Update']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Update']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    it('should call onClose when the button is clicked', function() {
        var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(scope.onClose).toHaveBeenCalled();
    });
    it('should call update when the button is clicked', function() {
        scope.$digest();
        spyOn(this.controller, 'update');
        var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.update).toHaveBeenCalled();
    });
});
