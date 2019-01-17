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
describe('Datasets Ontology Picker component', function() {
    var $compile, scope, $q, httpSvc, catalogManagerSvc, utilSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('datasetsOntologyPicker');
        mockHttpService();
        mockDatasetState();
        mockCatalogManager();
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _$q_, _httpService_, _catalogManagerService_, _prefixes_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            httpSvc = _httpService_
            catalogManagerSvc = _catalogManagerService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
        });

        this.catalogId = 'http://mobi.com/catalog-local';
        this.ontology1Id = 'ontology1Record';
        this.ontology1IRI = 'ontology1';
        this.ontology1Title = 'Ontology 1';
        this.ontology2Id = 'ontology2Record';
        this.ontology2IRI = 'ontology2';
        this.ontology2Title = 'Ontology 2';
        this.ontology1Record = {
                '@id': this.ontology1Id,
                '@type': ['http://www.w3.org/2002/07/owl#Thing',
                        'http://mobi.com/ontologies/catalog#Record',
                        'http://mobi.com/ontologies/catalog#VersionedRecord',
                        'http://mobi.com/ontologies/ontology-editor#OntologyRecord',
                        'http://mobi.com/ontologies/catalog#VersionedRDFRecord'],
                [prefixes.catalog + 'branch']: [{ '@id': 'ontology1Branch' }],
                [prefixes.catalog + 'catalog']: [{ '@id': this.catalogId }],
                [prefixes.catalog + 'masterBranch']: [{ '@id': 'ontology1Branch' }],
                [prefixes.ontologyEditor + 'ontologyIRI']: [{ '@id': 'ontology1' }],
                [prefixes.dcterms + 'description']: [{ '@value': '' }],
                [prefixes.dcterms + 'issued']: [{
                        '@type': prefixes.xsd + 'dateTime',
                        '@value': '2017-07-12T10:28:15-04:00' }],
                [prefixes.dcterms + 'modified']: [{
                        '@type': prefixes.xsd + 'dateTime',
                        '@value': '2017-07-12T10:28:15-04:00' }],
                [prefixes.dcterms + 'publisher']: [{ '@id': 'http://mobi.com/users/user1' }],
                [prefixes.dcterms + 'title']: [{ '@value': this.ontology1Title }]
        };
        this.ontology2Record = {
                '@id': this.ontology2Id,
                '@type': ['http://www.w3.org/2002/07/owl#Thing',
                        'http://mobi.com/ontologies/catalog#Record',
                        'http://mobi.com/ontologies/catalog#VersionedRecord',
                        'http://mobi.com/ontologies/ontology-editor#OntologyRecord',
                        'http://mobi.com/ontologies/catalog#VersionedRDFRecord'],
                [prefixes.catalog + 'branch']: [{ '@id': 'ontology2Branch' }],
                [prefixes.catalog + 'catalog']: [{ '@id': this.catalogId }],
                [prefixes.catalog + 'masterBranch']: [{ '@id': 'ontology2Branch' }],
                [prefixes.ontologyEditor + 'ontologyIRI']: [{ '@id': 'ontology2' }],
                [prefixes.dcterms + 'description']: [{ '@value': '' }],
                [prefixes.dcterms + 'issued']: [{
                        '@type': 'http://www.w3.org/2001/XMLSchema#dateTime',
                        '@value': '2017-07-12T10:28:15-04:00' }],
                [prefixes.dcterms + 'modified']: [{
                        '@type': 'http://www.w3.org/2001/XMLSchema#dateTime',
                        '@value': '2017-07-12T10:28:15-04:00' }],
                [prefixes.dcterms + 'publisher']: [{ '@id': 'http://mobi.com/users/user1' }],
                [prefixes.dcterms + 'title']: [{ '@value': this.ontology2Title }]
        };
        utilSvc.getDctermsValue.and.callFake((obj, prop) => _.get(obj, "['" + prefixes.dcterms + prop + "'][0]['@value']"));
        utilSvc.getPropertyId.and.callFake((obj, prop) => _.get(obj, "['" + prop + "'][0]['@id']"));

        catalogManagerSvc.localCatalog = {'@id': this.catalogId};
        this.response = {
            data: [this.ontology1Record, this.ontology2Record]
        };
        catalogManagerSvc.getRecords.and.returnValue($q.when(this.response));
        scope.selectedOntologies = [];
        scope.selectOntology = jasmine.createSpy('selectOntology');
        scope.unselectOntology = jasmine.createSpy('unselectOntology');
        this.element = $compile(angular.element('<datasets-ontology-picker selected-ontologies="selectedOntologies" select-ontology="selectOntology(ontology)" unselect-ontology="unselectOntology(ontology)"></datasets-ontology-picker>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('datasetsOntologyPicker');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        httpSvc = null;
        datasetManagerSvc = null;
        catalogManagerSvc = null;
        utilSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('selectedOntologies should be one way bound.', function() {
            this.controller.selectedOntologies = [{}];
            scope.$apply();
            expect(scope.selectedOntologies).toEqual([]);
        });
        it('selectOntology should be called in the parent scope', function() {
            this.controller.selectOntology({ontology: {}});
            expect(scope.selectOntology).toHaveBeenCalledWith({});
        });
        it('unselectOntology should be called in the parent scope', function() {
            this.controller.unselectOntology({ontology: {}});
            expect(scope.unselectOntology).toHaveBeenCalledWith({});
        });
    });
    describe('controller methods', function() {
        it('should get the ontology IRI of an OntologyRecord', function() {
            expect(this.controller.getOntologyIRI(this.ontology1Record)).toEqual(this.ontology1IRI);
            expect(utilSvc.getPropertyId).toHaveBeenCalledWith(this.ontology1Record, prefixes.ontologyEditor + 'ontologyIRI');
        });
        describe('should set the list of ontologies', function() {
            beforeEach(function() {
                spyOn(this.controller, 'getOntologyIRI').and.returnValue('ontology');
            });
            it('unless an error occurs', function() {
                catalogManagerSvc.getRecords.and.returnValue($q.reject('Error Message'));
                this.controller.setOntologies();
                scope.$apply();
                expect(httpSvc.cancel).toHaveBeenCalledWith(this.controller.spinnerId);
                expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith(this.catalogId, this.controller.ontologySearchConfig, this.controller.spinnerId);
                expect(this.controller.ontologies).toEqual([]);
                expect(this.controller.error).toEqual('Error Message');
            });
            it('successfully', function() {
                this.controller.selectedOntologies = [{recordId: this.ontology1Id}];
                this.controller.setOntologies();
                scope.$apply();
                expect(httpSvc.cancel).toHaveBeenCalledWith(this.controller.spinnerId);
                expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith(this.catalogId, this.controller.ontologySearchConfig, this.controller.spinnerId);
                expect(this.controller.ontologies).toEqual([
                    {recordId: this.ontology1Id, title: this.ontology1Title, ontologyIRI: 'ontology', selected: true, jsonld: this.ontology1Record},
                    {recordId: this.ontology2Id, title: this.ontology2Title, ontologyIRI: 'ontology', selected: false, jsonld: this.ontology2Record},
                ]);
                expect(this.controller.error).toEqual('');
            });
        });
        describe('should toggle an ontology if it has been', function() {
            it('selected', function() {
                this.controller.toggleOntology({selected: true})
                expect(scope.selectOntology).toHaveBeenCalledWith({selected: true});
            });
            it('unselected', function() {
                this.controller.toggleOntology({selected: false})
                expect(scope.unselectOntology).toHaveBeenCalledWith({selected: false});
            });
        });
        it('should unselect an ontology', function() {
            var ontology = {selected: true};
            this.controller.unselect(ontology);
            expect(ontology.selected).toEqual(false);
            expect(scope.unselectOntology).toHaveBeenCalledWith(ontology);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('DATASETS-ONTOLOGY-PICKER');
            expect(this.element.querySelectorAll('.datasets-ontology-picker').length).toEqual(1);
        });
        ['custom-label', 'search-bar', 'md-list'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toEqual(1);
            });
        });
        ['.selected-ontologies', '.ontologies'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.querySelectorAll(test).length).toEqual(1);
            });
        });
        it('depending on whether an error has occurred', function() {
            expect(this.element.find('error-display').length).toEqual(0);

            this.controller.error = 'error';
            scope.$digest();
            expect(this.element.find('error-display').length).toEqual(1);
        });
        it('depending on the number of ontologies', function() {
            expect(this.element.find('md-list-item').length).toEqual(this.controller.ontologies.length);
            expect(this.element.find('info-message').length).toEqual(0);
            
            this.controller.ontologies = [];
            scope.$digest();
            expect(this.element.find('info-message').length).toEqual(1);
            expect(this.element.find('md-list-item').length).toEqual(0);
        });
        it('depending on the number of selected ontologies', function() {
            expect(this.element.querySelectorAll('.none-selected').length).toEqual(1);
            expect(this.element.querySelectorAll('.selected-ontology').length).toEqual(0);

            this.controller.selectedOntologies = [{recordId: this.ontology1Id}, {recordId: this.ontology2Id}];
            scope.$digest();
            expect(this.element.querySelectorAll('.none-selected').length).toEqual(0);
            expect(this.element.querySelectorAll('.selected-ontology').length).toEqual(2);
        });
    });
    it('should unselect an ontology when clicked', function() {
        this.controller.selectedOntologies = [{recordId: this.ontology1Id}];
        spyOn(this.controller, 'unselect');
        scope.$digest();

        var link = angular.element(this.element.querySelectorAll('.selected-ontologies span a')[0]);
        link.triggerHandler('click');
        expect(this.controller.unselect).toHaveBeenCalledWith({recordId: this.ontology1Id});
    });
});