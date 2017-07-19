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
describe('Datasets Ontology Picker directive', function() {
    var $compile, scope, $q, element, controller, datasetStateSvc, catalogManagerSvc, utilSvc, prefixes;
    
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
        module('datasetsOntologyPicker');
        mockDatasetState();
        mockCatalogManager();
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _datasetStateService_, _catalogManagerService_, _$q_, _prefixes_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            datasetStateSvc = _datasetStateService_;
            catalogManagerSvc = _catalogManagerService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
            $q = _$q_;
        });
                
        catalogManagerSvc.localCatalog = {'@id': 'http://matonto.org/catalog-local'};
        scope.ontologies = [];
        scope.selectedOntologies = [];
        scope.error = '';
        element = $compile(angular.element('<datasets-ontology-picker ontologies="ontologies" selected-ontologies="selectedOntologies" error="error"></datasets-ontology-picker>'))(scope);

        headers = { 'x-total-count': 2, link: '' };
        response = {
            data: [ontology1Record, ontology2Record],
            headers: jasmine.createSpy('headers').and.returnValue(headers)
        };
        catalogManagerSvc.getRecords.and.returnValue($q.when(response));
        scope.$digest();
        controller = element.controller('datasetsOntologyPicker');
    });

    describe('controller bound variable', function() {
        it('ontologies should be two way bound.', function() {
            controller.ontologies = [ontology1Record];
            scope.$apply();
            expect(scope.ontologies).toEqual([ontology1Record]);
        });
        it('selectedOntologies should be two way bound.', function() {
            controller.selectedOntologies = [{'@id': 'id'}];
            scope.$apply();
            expect(scope.selectedOntologies).toEqual([{'@id': 'id'}]);
        });
        it('error should be two way bound.', function() {
            controller.error = 'Error';
            scope.$apply();
            expect(scope.error).toEqual('Error');
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
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('datasets-ontology-picker')).toBe(true);
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
});