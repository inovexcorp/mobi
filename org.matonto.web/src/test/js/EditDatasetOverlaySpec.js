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
describe('Edit Dataset Overlay directive', function() {
    var $compile, scope, $q, element, controller, datasetStateSvc, catalogManagerSvc, utilSvc, prefixes, uuid;
    var headers, response, branchResponse;
    
    var ontology1 = {
                '@id': 'ontology1',
                'dataset:linksToRecord': [{ '@id': 'ontology1Record' }],
                'dataset:linksToBranch': [{ '@id': 'ontology1Branch' }],
                'dataset:linksToCommit': [{ '@id': 'ontology1Commit' }]
        };
    var ontology2 = {
                '@id': 'ontology2',
                'dataset:linksToRecord': [{ '@id': 'ontology2Record' }],
                'dataset:linksToBranch': [{ '@id': 'ontology2Branch' }],
                'dataset:linksToCommit': [{ '@id': 'ontology2Commit' }]
        };
    var ontology2Expected = {
                '@id': '_:matonto/bnode/1234',
                'dataset:linksToRecord': [{ '@id': 'ontology2Record' }],
                'dataset:linksToBranch': [{ '@id': 'ontology2Branch' }],
                'dataset:linksToCommit': [{ '@id': 'ontology2Commit' }]
        }
    var datasetRecord = {
            '@id': 'datasetRecord1',
            '@type': ['http://www.w3.org/2002/07/owl#Thing',
                    'http://matonto.org/ontologies/catalog#Record',
                    'http://matonto.org/ontologies/catalog#UnversionedRecord',
                    'http://matonto.org/ontologies/dataset#DatasetRecord'],
            'catalog:catalog': [{ '@id': 'http://matonto.org/catalog-local' }],
            'catalog:keyword': [{ '@value': 'test' }],
            'dataset:dataset': [{ '@id': 'http://matonto.org/dataset/testDataset' }],
            'dataset:ontology': [{ '@id': 'ontology1' }],
            'dataset:repository': [{ '@value': 'system' }],
            'dcterms:description': [{ '@value': 'This is a description.' }],
            'dcterms:issued': [{ 
                    '@type': 'http://www.w3.org/2001/XMLSchema#dateTime', 
                    '@value': '2017-07-12T10:28:15-04:00' }],
            'dcterms:modified': [{ 
                    '@type': 'http://www.w3.org/2001/XMLSchema#dateTime', 
                    '@value': '2017-07-12T10:28:15-04:00' }],
            'dcterms:publisher': [{ '@id': 'http://matonto.org/users/user1' }],
            'dcterms:title': [{ '@value': 'Test' }]
        };
    var datasetRecordExpected = {
            '@id': 'datasetRecord1',
            '@type': ['http://www.w3.org/2002/07/owl#Thing',
                    'http://matonto.org/ontologies/catalog#Record',
                    'http://matonto.org/ontologies/catalog#UnversionedRecord',
                    'http://matonto.org/ontologies/dataset#DatasetRecord'],
            'catalog:catalog': [{ '@id': 'http://matonto.org/catalog-local' }],
            'catalog:keyword': [{ '@value': '' }],
            'dataset:dataset': [{ '@id': 'http://matonto.org/dataset/testDataset' }],
            'dataset:ontology': [{ '@id': '' }],
            'dataset:repository': [{ '@value': 'system' }],
            'dcterms:description': [{ '@value': '' }],
            'dcterms:issued': [{ 
                    '@type': 'http://www.w3.org/2001/XMLSchema#dateTime', 
                    '@value': '2017-07-12T10:28:15-04:00' }],
            'dcterms:modified': [{ 
                    '@type': 'http://www.w3.org/2001/XMLSchema#dateTime', 
                    '@value': '2017-07-12T10:28:15-04:00' }],
            'dcterms:publisher': [{ '@id': 'http://matonto.org/users/user1' }],
            'dcterms:title': [{ '@value': '' }]
        };
    var ontology1Record = {
                '@id': 'ontology1Record',
                '@type': ['http://www.w3.org/2002/07/owl#Thing',
                        'http://matonto.org/ontologies/catalog#Record',
                        'http://matonto.org/ontologies/catalog#VersionedRecord',
                        'http://matonto.org/ontologies/ontology-editor#OntologyRecord',
                        'http://matonto.org/ontologies/catalog#VersionedRDFRecord'],
                'catalog:branch': [{ '@id': 'ontology1Branch' }],
                'catalog:catalog': [{ '@id': 'http://matonto.org/catalog-local' }],
                'catalog:masterBranch': [{ '@id': 'ontology1Branch' }],
                'ontEdit:ontologyIRI': [{ '@id': 'ontology1' }],
                'dcterms:description': [{ '@value': '' }],
                'dcterms:issued': [{ 
                        '@type': 'http://www.w3.org/2001/XMLSchema#dateTime', 
                        '@value': '2017-07-12T10:28:15-04:00' }],
                'dcterms:modified': [{ 
                        '@type': 'http://www.w3.org/2001/XMLSchema#dateTime', 
                        '@value': '2017-07-12T10:28:15-04:00' }],
                'dcterms:publisher': [{ '@id': 'http://matonto.org/users/user1' }],
                'dcterms:title': [{ '@value': 'Ontology 1' }]
        };
    var ontology2Record = {
                '@id': 'ontology2Record',
                '@type': ['http://www.w3.org/2002/07/owl#Thing',
                        'http://matonto.org/ontologies/catalog#Record',
                        'http://matonto.org/ontologies/catalog#VersionedRecord',
                        'http://matonto.org/ontologies/ontology-editor#OntologyRecord',
                        'http://matonto.org/ontologies/catalog#VersionedRDFRecord'],
                'catalog:branch': [{ '@id': 'ontology2Branch' }],
                'catalog:catalog': [{ '@id': 'http://matonto.org/catalog-local' }],
                'catalog:masterBranch': [{ '@id': 'ontology2Branch' }],
                'ontEdit:ontologyIRI': [{ '@id': 'ontology2' }],
                'dcterms:description': [{ '@value': '' }],
                'dcterms:issued': [{ 
                        '@type': 'http://www.w3.org/2001/XMLSchema#dateTime', 
                        '@value': '2017-07-12T10:28:15-04:00' }],
                'dcterms:modified': [{ 
                        '@type': 'http://www.w3.org/2001/XMLSchema#dateTime', 
                        '@value': '2017-07-12T10:28:15-04:00' }],
                'dcterms:publisher': [{ '@id': 'http://matonto.org/users/user1' }],
                'dcterms:title': [{ '@value': 'Ontology 2' }]
        };

    beforeEach(function() {
        module('templates');
        module('editDatasetOverlay');
        mockDatasetState();
        mockCatalogManager();
        mockUtil();
        mockPrefixes();

        datasetRecord['dcterms:title'] = [{'@value': 'Test'}];
        datasetRecord['dcterms:description'] = [{'@value': 'This is a description.'}];
        datasetRecord['catalog:keyword'] = [{'@value': 'test'}];
        datasetRecord['dataset:ontology'] = [{ '@id': 'ontology1' }];

        inject(function(_$compile_, _$rootScope_, _datasetStateService_, _catalogManagerService_, _utilService_, _$q_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            datasetStateSvc = _datasetStateService_;
            catalogManagerSvc = _catalogManagerService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
            $q = _$q_;
        });
        
        utilSvc.getIdForBlankNode.and.returnValue('_:matonto/bnode/1234');
        utilSvc.getPropertyId.and.callFake(function (entity, propertyIRI) { return _.get(entity, "['" + propertyIRI + "'][0]['@id']", '') });
        utilSvc.getPropertyValue.and.callFake(function (entity, propertyIRI) { return _.get(entity, "['" + propertyIRI + "'][0]['@value']", '') });
        utilSvc.getDctermsValue.and.callFake(function (entity, property) { return _.get(entity, "['" + prefixes.dcterms + property + "'][0]['@value']", '') });
        utilSvc.setPropertyId.and.callFake(function (entity, propertyIRI, id) {
                var valueObj = {'@id': id};
                if (_.has(entity, "['" + propertyIRI + "']")) {
                    entity[propertyIRI].push(valueObj);
                } else {
                    _.set(entity, "['" + propertyIRI + "'][0]", valueObj);
                }
            });
        utilSvc.setPropertyValue.and.callFake(function (entity, propertyIRI, value) {
                var valueObj = {'@value': value};
                if (_.has(entity, "['" + propertyIRI + "']")) {
                    entity[propertyIRI].push(valueObj);
                } else {
                    _.set(entity, "['" + propertyIRI + "'][0]", valueObj);
                }
            });
        utilSvc.setDctermsValue.and.callFake(function (entity, property, value) {
                var valueObj = {'@value': value};
                if (_.has(entity, "['" + prefixes.dcterms + property + "']")) {
                    entity[prefixes.dcterms + property].push(valueObj);
                } else {
                    _.set(entity, "['" + prefixes.dcterms + property + "'][0]", valueObj);
                }
            });
        
        var parsedDatasetRecord = {
            identifiers: [angular.copy(ontology1)],
            record: angular.copy(datasetRecord)
        };

        catalogManagerSvc.localCatalog = {'@id': 'http://matonto.org/catalog-local'};
        scope.onClose = jasmine.createSpy('onClose');
        scope.dataset = parsedDatasetRecord;
        element = $compile(angular.element('<edit-dataset-overlay dataset="dataset" on-close="onClose()"></edit-dataset-overlay>'))(scope);

        headers = { 'x-total-count': 2, link: '' };
        response = {
            data: [ontology1Record, ontology2Record],
            headers: jasmine.createSpy('headers').and.returnValue(headers)
        };
        catalogManagerSvc.getRecords.and.returnValue($q.when(response));
        
        branchResponse = {'@id': 'ontology2Branch', 'catalog:head': [{'@id': 'ontology2Commit'}]};
        catalogManagerSvc.getRecordMasterBranch.and.returnValue($q.when(branchResponse));

        scope.$digest();
        controller = element.controller('editDatasetOverlay');
    });

    describe('controller bound variable', function() {
        it('onClose should be called in parent scope when invoked', function() {
            controller.onClose();
            expect(scope.onClose).toHaveBeenCalled();
        });
        it('dataset should exist when accessed', function() {
            expect(controller.dataset).toEqual(scope.dataset);
            expect(controller.dataset.record['@id']).toEqual(scope.dataset.record['@id']);
        });
    });
    describe('controller methods', function() {
        describe('should get a list of ontologies', function() {
            it('unless an error occurs', function() {
                catalogManagerSvc.getRecords.and.returnValue($q.reject('Error Message'));
                controller.getOntologies();
                scope.$apply();
                expect(controller.ontologySearchConfig.pageIndex).toBe(0);
                expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith(catalogManagerSvc.localCatalog['@id'], controller.ontologySearchConfig);
                expect(controller.ontologies).toEqual([]);
                expect(controller.totalSize).toEqual(0);
                expect(controller.links).toEqual({next: '', prev: ''});
                expect(utilSvc.parseLinks.calls.count()).toEqual(1);
                expect(controller.error).toBe('Error Message');
            });
            it('successfully', function() {
                utilSvc.parseLinks.and.returnValue({prev: 'prev', next: 'next'});
                controller.getOntologies();
                scope.$apply();
                expect(controller.ontologySearchConfig.pageIndex).toBe(0);
                expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith(catalogManagerSvc.localCatalog['@id'], controller.ontologySearchConfig);
                expect(controller.ontologies).toEqual(response.data);
                expect(response.headers).toHaveBeenCalled();
                expect(controller.totalSize).toBe(headers['x-total-count']);
                expect(utilSvc.parseLinks.calls.count()).toEqual(2);
                expect(controller.links.prev).toBe('prev');
                expect(controller.links.next).toBe('next');
                expect(controller.error).toBe('');
            });
        });
        describe('should update a dataset', function() {
            beforeEach(function() {
                datasetRecordExpected['dcterms:title'] = [{'@value': 'Test'}];
                datasetRecordExpected['dcterms:description'] = [{'@value': 'This is a description.'}];
                datasetRecordExpected['catalog:keyword'] = [{'@value': 'test'}];
                datasetRecordExpected['dataset:ontology'] = [{ '@id': 'ontology1' }];
                controller.recordConfig.title = 'Test';
                controller.recordConfig.description = 'This is a description.';
                controller.keywords = ['test'];
                controller.selectedOntologies = [ontology1Record];
                scope.$digest();
            });
            it('unless an error occurs', function() {
                catalogManagerSvc.updateRecord.and.returnValue($q.reject('Error Message'));
                controller.update();
                scope.$apply();
                expect(catalogManagerSvc.updateRecord).toHaveBeenCalledWith('datasetRecord1', catalogManagerSvc.localCatalog['@id'], [ontology1, datasetRecordExpected]);
                expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                expect(datasetStateSvc.setResults).not.toHaveBeenCalled();
                expect(scope.onClose).not.toHaveBeenCalled();
                expect(controller.error).toBe('Error Message');
            });
            describe('successfully', function() {
                it('when the title has changed.', function() {
                    controller.recordConfig.title = 'Changed';
                    datasetRecordExpected['dcterms:title'] = [{'@value': 'Changed'}];
                    controller.update();
                    scope.$apply();
                    expect(catalogManagerSvc.updateRecord).toHaveBeenCalledWith('datasetRecord1', catalogManagerSvc.localCatalog['@id'], [ontology1, datasetRecordExpected]);
                    expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                    expect(datasetStateSvc.setResults).toHaveBeenCalled();
                    expect(scope.onClose).toHaveBeenCalled();
                    expect(controller.error).toBe('');
                });
                it('when the description has changed.', function() {
                    controller.recordConfig.description = 'Changed the description.';
                    datasetRecordExpected['dcterms:description'] = [{'@value': 'Changed the description.'}];
                    controller.update();
                    scope.$apply();
                    expect(catalogManagerSvc.updateRecord).toHaveBeenCalledWith('datasetRecord1', catalogManagerSvc.localCatalog['@id'], [ontology1, datasetRecordExpected]);
                    expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                    expect(datasetStateSvc.setResults).toHaveBeenCalled();
                    expect(scope.onClose).toHaveBeenCalled();
                    expect(controller.error).toBe('');
                });
                it('when the keywords have changed.', function() {
                    controller.keywords = ['a ', ' b', 'c d'];
                    datasetRecordExpected['catalog:keyword'] = [{'@value': 'a'}, {'@value': 'b'}, {'@value': 'c d'}];
                    controller.update();
                    scope.$apply();
                    expect(catalogManagerSvc.updateRecord).toHaveBeenCalledWith('datasetRecord1', catalogManagerSvc.localCatalog['@id'], [ontology1, datasetRecordExpected]);
                    expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                    expect(datasetStateSvc.setResults).toHaveBeenCalled();
                    expect(scope.onClose).toHaveBeenCalled();
                    expect(controller.error).toBe('');
                });
                it('when all ontologies are removed.', function() {
                    datasetRecordExpected['dataset:ontology'] = [];
                    controller.selectedOntologies = [];
                    controller.update();
                    scope.$apply();
                    expect(catalogManagerSvc.updateRecord).toHaveBeenCalledWith('datasetRecord1', catalogManagerSvc.localCatalog['@id'], [datasetRecordExpected]);
                    expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                    expect(datasetStateSvc.setResults).toHaveBeenCalled();
                    expect(scope.onClose).toHaveBeenCalled();
                    expect(controller.error).toBe('');
                });
                it('when an ontology is added.', function() {
                    controller.selectedOntologies = [ontology1Record, ontology2Record];
                    datasetRecordExpected['dataset:ontology'] = [{ '@id': 'ontology1' }, { '@id': '_:matonto/bnode/1234' }];
                    controller.update();
                    scope.$apply();
                    expect(catalogManagerSvc.updateRecord).toHaveBeenCalledWith('datasetRecord1', catalogManagerSvc.localCatalog['@id'], [ontology1, ontology2Expected, datasetRecordExpected]);
                    expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                    expect(datasetStateSvc.setResults).toHaveBeenCalled();
                    expect(scope.onClose).toHaveBeenCalled();
                    expect(controller.error).toBe('');
                });
                it('when an ontology is added and removed.', function() {
                    controller.selectedOntologies = [ontology2Record];
                    datasetRecordExpected['dataset:ontology'] = [{ '@id': '_:matonto/bnode/1234' }];
                    controller.update();
                    scope.$apply();
                    expect(catalogManagerSvc.updateRecord).toHaveBeenCalledWith('datasetRecord1', catalogManagerSvc.localCatalog['@id'], [ontology2Expected, datasetRecordExpected]);
                    expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                    expect(datasetStateSvc.setResults).toHaveBeenCalled();
                    expect(scope.onClose).toHaveBeenCalled();
                    expect(controller.error).toBe('');
                });
            });
        });
        it('should test whether an ontology is selected', function() {
            expect(controller.isSelected('id')).toBe(false);
            controller.selectedOntologies = [{'@id': 'id'}];
            expect(controller.isSelected('id')).toBe(true);
            expect(controller.isSelected('test')).toBe(false);
        });
        it('should select an ontology', function() {
            var ontology = {'@id': 'id'};
            spyOn(controller, 'isSelected').and.returnValue(true);
            controller.selectOntology(ontology);
            expect(controller.selectedOntologies).not.toContain(ontology);

            controller.isSelected.and.returnValue(false);
            controller.selectOntology(ontology);
            expect(controller.selectedOntologies).toContain(ontology);
        });
        it('should unselect an ontology', function() {
            controller.selectedOntologies = [{'@id': 'id'}];
            controller.unselectOntology('test');
            expect(controller.selectedOntologies.length).toBe(1);
            controller.unselectOntology('id');
            expect(controller.selectedOntologies.length).toBe(0);
        });
    });
    describe('fills the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('EDIT-DATASET-OVERLAY');
        });
        it('with a .overlay', function() {
            expect(element.querySelectorAll('.edit-dataset-overlay.overlay').length).toBe(1);
        });
        it('with a text-input', function() {
            var inputs = element.querySelectorAll('input');
            expect(inputs.length).toBe(2);
            expect(['title', 'ontologies-search']).toContain(angular.element(inputs[0]).attr('name').trim());
            expect(['title', 'ontologies-search']).toContain(angular.element(inputs[1]).attr('name').trim());
        });
        it('with a text-area', function() {
            expect(element.find('text-area').length).toBe(1);
        });
        it('with a keyword-select', function() {
            expect(element.find('keyword-select').length).toBe(1);
        });
        it('with a .input-group', function() {
            expect(element.querySelectorAll('.input-group.ontologies-search-bar').length).toBe(1);
        });
        it('with a .list-group', function() {
            expect(element.querySelectorAll('.list-group.ontology-records-list').length).toBe(1);
        });
        it('with a paging-details', function() {
            expect(element.find('paging-details').length).toBe(1);
        });
        it('with a pagination', function() {
            expect(element.find('pagination').length).toBe(1);
        });
        it('depending on whether an error has occured', function() {
            expect(element.find('error-display').length).toBe(0);

            controller.error = 'test';
            scope.$digest();
            expect(element.find('error-display').length).toBe(1);
        });
        it('depending on how many ontologies there are', function() {
            controller.ontologies = [{}];
            scope.$digest();
            expect(element.querySelectorAll('.ontology-records-list button').length).toBe(controller.ontologies.length);
        });
        it('depending on whether an ontology has been selected', function() {
            controller.ontologies = [{'@id': 'ontology'}];
            spyOn(controller, 'isSelected').and.returnValue(true);
            scope.$digest();
            var button = angular.element(element.querySelectorAll('.ontology-records-list button')[0]);
            expect(button.hasClass('active')).toBe(true);
        });
        it('depending on how many ontologies have been selected', function() {
            expect(element.querySelectorAll('.selected-ontologies span').length).toBe(2);
            controller.selectedOntologies = [{'@id': '1'}, {'@id': '2'}];
            scope.$digest();
            expect(element.querySelectorAll('.selected-ontologies span').length).toBe(controller.selectedOntologies.length + 1);
        });
        it('depending on the validity of the form', function() {
            controller.infoForm.$invalid = true;
            scope.$digest();
            var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            controller.infoForm.$invalid = false;
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('with the correct buttons', function() {
            var buttons = element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Update']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Update']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    it('should call onClose when the button is clicked', function() {
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(scope.onClose).toHaveBeenCalled();
    });
    it('should call getOntologies when the search button is clicked', function() {
        scope.$digest();
        spyOn(controller, 'getOntologies');
        var searchButton = angular.element(element.querySelectorAll('.ontologies-search-bar button')[0]);
        searchButton.triggerHandler('click');
        expect(controller.getOntologies).toHaveBeenCalled();
    });
    it('should select an ontology when clicked', function() {
        controller.ontologies = [{}];
        scope.$digest();
        spyOn(controller, 'selectOntology');
        var button = angular.element(element.querySelectorAll('.ontology-records-list button')[0]);
        button.triggerHandler('click');
        expect(controller.selectOntology).toHaveBeenCalledWith({});
    });
    it('should unselect an ontology when clicked', function() {
        controller.selectedOntologies = [{'@id': 'id'}];
        scope.$digest();
        spyOn(controller, 'unselectOntology');
        var link = angular.element(element.querySelectorAll('.selected-ontologies span a')[0]);
        link.triggerHandler('click');
        expect(controller.unselectOntology).toHaveBeenCalledWith('id');
    });
    it('should call update when the button is clicked', function() {
        scope.$digest();
        spyOn(controller, 'update');
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(controller.update).toHaveBeenCalled();
    });
});
