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
describe('Analytic State Service', function() {
    var $q, scope, analyticStateSvc, prefixes, httpSvc, utilSvc, sparqlManagerSvc, ontologyManagerSvc, datasetManagerSvc;

    beforeEach(function() {
        module('analyticState');
        mockHttpService();
        mockPrefixes();
        mockSparqlManager();
        mockUtil();
        mockOntologyManager();
        mockDatasetManager();

        inject(function(_$q_, _$rootScope_, analyticStateService, _prefixes_, _httpService_, _utilService_, _sparqlManagerService_, _ontologyManagerService_, _datasetManagerService_) {
            $q = _$q_;
            scope = _$rootScope_;
            analyticStateSvc = analyticStateService;
            prefixes = _prefixes_;
            httpSvc = _httpService_;
            utilSvc = _utilService_;
            sparqlManagerSvc = _sparqlManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
            datasetManagerSvc = _datasetManagerService_;
        });

        analyticStateSvc.datasets = [{id: 'datasetId'}];
        analyticStateSvc.spinnerId = 'spinnerId';
        analyticStateSvc.currentPage = 1;
        analyticStateSvc.limit = 10;
        analyticStateSvc.links = {
            next: 'next-url',
            prev: 'prev-url'
        };
        analyticStateSvc.limit = 10;
        analyticStateSvc.currentPage = 0;
        analyticStateSvc.spinnerId = 'spinnerId';
        utilSvc.parseLinks.and.returnValue({prev: 'prev-link', next: 'next-link'});

        this.response = {
            data: {
                data: [],
                bindings: []
            },
            headers: jasmine.createSpy('headers').and.returnValue({
                'x-total-count': 10,
                link: 'link-text'
            })
        };
    });

    beforeEach(function utilityMethods() {
        this.populateEditor = function(configuration, analyticRecord) {
            expect(utilSvc.getPropertyId).toHaveBeenCalledWith(configuration, prefixes.analytic + 'datasetRecord');
            expect(analyticStateSvc.datasets).toEqual([{id: 'datasetRecordId', ontologies: []}]);
            expect(utilSvc.getPropertyId).toHaveBeenCalledWith(configuration, prefixes.analytic + 'hasRow');
            expect(analyticStateSvc.setClassesAndProperties).toHaveBeenCalled();
            expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(analyticRecord, 'description');
            expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(analyticRecord, 'title');
            expect(analyticStateSvc.selectedConfigurationId).toBe('configId');
            expect(analyticStateSvc.record).toEqual({analyticRecordId: 'recordId', description: 'description', keywords: ['keyword1', 'keyword2'], title: 'title'});
            expect(analyticStateSvc.classes).toEqual([]);
            expect(analyticStateSvc.properties).toEqual([]);
        }
        this.getPageResolves = function(direction) {
            httpSvc.get.and.returnValue($q.when(this.response));
            analyticStateSvc.getPage(direction);
            scope.$apply();
            expect(httpSvc.get).toHaveBeenCalledWith(direction + '-url', undefined, 'spinnerId');
            this.onPagedSuccess();
        }
        this.getPageRejects = function(direction) {
            httpSvc.get.and.returnValue($q.reject('error'));
            analyticStateSvc.getPage(direction);
            scope.$apply();
            expect(httpSvc.get).toHaveBeenCalledWith(direction + '-url', undefined, 'spinnerId');
            this.onPagedError();
        }
        this.onPagedSuccess = function() {
            expect(analyticStateSvc.queryError).toBe('');
            expect(analyticStateSvc.results).toEqual({data: [], bindings: []});
            expect(analyticStateSvc.totalSize).toEqual(10);
            expect(utilSvc.parseLinks).toHaveBeenCalledWith('link-text');
            expect(analyticStateSvc.links).toEqual({prev: 'prev-link', next: 'next-link'});
        }
        this.onPagedError = function() {
            expect(analyticStateSvc.results).toBeUndefined();
            expect(analyticStateSvc.queryError).toBe('error');
        }
        this.sortResults = function() {
            analyticStateSvc.sortResults('?s', false);
            scope.$apply();
            expect(analyticStateSvc.query.order).toEqual([{expression: '?s', descending: false}]);
            this.getPagedResults();
        }
        this.getPagedResults = function() {
            expect(httpSvc.cancel).toHaveBeenCalledWith('spinnerId');
            expect(analyticStateSvc.currentPage).toBe(0);
            expect(sparqlManagerSvc.pagedQuery).toHaveBeenCalledWith(jasmine.any(String), {
                datasetRecordIRI: 'datasetId',
                id: 'spinnerId',
                page: 0,
                limit: 10
            });
        }
        this.selectProperty = function() {
            analyticStateSvc.selectProperty({id: 'propId'});
            scope.$apply();
            expect(analyticStateSvc.selectedProperties).toEqual([{id: 'propId'}]);
            expect(analyticStateSvc.properties).toEqual([]);
            expect(sparqlManagerSvc.pagedQuery).toHaveBeenCalledWith(jasmine.any(String), {
                datasetRecordIRI: 'datasetId',
                id: 'spinnerId',
                page: 0,
                limit: 10
            });
        }
        this.removeProperty = function() {
            analyticStateSvc.removeProperty({id: 'propId'});
            scope.$apply();
            expect(analyticStateSvc.properties).toEqual([{id: 'propId'}]);
            expect(sparqlManagerSvc.pagedQuery).toHaveBeenCalledWith(jasmine.any(String), {
                datasetRecordIRI: 'datasetId',
                id: 'spinnerId',
                page: 0,
                limit: 10
            });
        }
    });

    afterEach(function() {
        $q = null;
        scope = null;
        analyticStateSvc = null;
        prefixes = null;
        httpSvc = null;
        utilSvc = null;
        sparqlManagerSvc = null;
        ontologyManagerSvc = null;
        datasetManagerSvc = null;
    });

    it('reset resets the appropriate variables', function() {
        analyticStateSvc.reset();
        expect(analyticStateSvc.datasets).toEqual([]);
        expect(analyticStateSvc.classes).toEqual([]);
        expect(analyticStateSvc.properties).toEqual([]);
        expect(analyticStateSvc.selectedClass).toBeUndefined();
        expect(analyticStateSvc.enabledProperties).toEqual([]);
        expect(analyticStateSvc.selectedProperties).toEqual([]);
        expect(analyticStateSvc.results).toBeUndefined();
        expect(analyticStateSvc.variables).toEqual({});
        expect(analyticStateSvc.queryError).toEqual('');
        expect(analyticStateSvc.currentPage).toEqual(0);
        expect(analyticStateSvc.totalSize).toEqual(0);
        expect(analyticStateSvc.limit).toEqual(100);
        expect(analyticStateSvc.links).toEqual({});
        expect(analyticStateSvc.query).toEqual({});
        expect(analyticStateSvc.record).toEqual({});
        expect(analyticStateSvc.landing).toBe(true);
        expect(analyticStateSvc.editor).toBe(false);
        expect(analyticStateSvc.selectedConfigurationId).toBe('');
    });
    it('showEditor sets the variables correctly', function() {
        analyticStateSvc.showEditor();
        expect(analyticStateSvc.landing).toBe(false);
        expect(analyticStateSvc.editor).toBe(true);
    });
    it('showLanding sets the variables correctly', function() {
        analyticStateSvc.showLanding();
        expect(analyticStateSvc.datasets).toEqual([]);
        expect(analyticStateSvc.classes).toEqual([]);
        expect(analyticStateSvc.properties).toEqual([]);
        expect(analyticStateSvc.selectedClass).toBeUndefined();
        expect(analyticStateSvc.enabledProperties).toEqual([]);
        expect(analyticStateSvc.selectedProperties).toEqual([]);
        expect(analyticStateSvc.results).toBeUndefined();
        expect(analyticStateSvc.variables).toEqual({});
        expect(analyticStateSvc.queryError).toEqual('');
        expect(analyticStateSvc.currentPage).toEqual(0);
        expect(analyticStateSvc.totalSize).toEqual(0);
        expect(analyticStateSvc.limit).toEqual(100);
        expect(analyticStateSvc.links).toEqual({});
        expect(analyticStateSvc.query).toEqual({});
        expect(analyticStateSvc.record).toEqual({});
        expect(analyticStateSvc.landing).toBe(true);
        expect(analyticStateSvc.editor).toBe(false);
        expect(analyticStateSvc.selectedConfigurationId).toBe('');
    });
    it('resetSelected sets the variables correctly', function() {
        analyticStateSvc.resetSelected();
        expect(analyticStateSvc.selectedClass).toBeUndefined();
        expect(analyticStateSvc.selectedProperties).toEqual([]);
    });
    it('selectClass sets the variables correctly', function() {
        analyticStateSvc.classes = [{id: 'other', title: 'title'}, {id: 'id', title: 'title'}];
        analyticStateSvc.selectedProperties = [{id: 'selected'}];
        analyticStateSvc.selectClass({id: 'id', title: 'title'});
        expect(analyticStateSvc.results).toBeUndefined();
        expect(analyticStateSvc.queryError).toBe('');
        expect(analyticStateSvc.selectedClass).toEqual({id: 'id', title: 'title'});
        expect(analyticStateSvc.properties).toEqual([{id: 'selected'}]);
        expect(analyticStateSvc.selectedProperties).toEqual([]);
    });
    describe('selectProperty sets the variables correctly when pagedQuery', function() {
        beforeEach(function() {
            analyticStateSvc.selectedProperties = [];
            analyticStateSvc.properties = [{id: 'propId'}];
            spyOn(analyticStateSvc, 'createQueryString').and.returnValue('query-string');
        });
        it('resolves', function() {
            sparqlManagerSvc.pagedQuery.and.returnValue($q.when(this.response));
            this.selectProperty();
            this.onPagedSuccess();
        });
        it('rejects', function() {
            sparqlManagerSvc.pagedQuery.and.returnValue($q.reject('error'));
            this.selectProperty();
            this.onPagedError();
        });
    });
    describe('removeProperty sets the variables correctly when selectedProperties is', function() {
        beforeEach(function() {
            analyticStateSvc.properties = [];
            spyOn(analyticStateSvc, 'createQueryString').and.returnValue('query-string');
        });
        describe('populated and when pagedQuery', function() {
            beforeEach(function() {
                analyticStateSvc.selectedProperties = [{}];
            });
            it('resolves', function() {
                sparqlManagerSvc.pagedQuery.and.returnValue($q.when(this.response));
                this.removeProperty();
                this.onPagedSuccess();
            });
            it('rejects', function() {
                sparqlManagerSvc.pagedQuery.and.returnValue($q.reject('error'));
                this.removeProperty();
                this.onPagedError();
            });
        });
        it('empty', function() {
            analyticStateSvc.removeProperty({id: 'propId'});
            expect(analyticStateSvc.properties).toEqual([{id: 'propId'}]);
            expect(analyticStateSvc.results).toBeUndefined();
        });
    });
    describe('isSaveable returns the correct value when', function() {
        it('selectedClass is defined and selectedProperties is empty', function() {
            analyticStateSvc.selectedClass = {id: 'classId'};
            expect(analyticStateSvc.isSaveable()).toBeFalsy();
        });
        it('selectedClass is undefined and selectedProperties is populated', function() {
            analyticStateSvc.selectedProperties = [{id: 'propId'}];
            expect(analyticStateSvc.isSaveable()).toBeFalsy();
        });
        it('selectedClass is defined and selectedProperties is populated', function() {
            analyticStateSvc.selectedClass = {id: 'classId'};
            analyticStateSvc.selectedProperties = [{id: 'propId'}];
            expect(analyticStateSvc.isSaveable()).toBeTruthy();
        });
    });
    it('createQueryString sets the correct variables and returns the correct string', function() {
        analyticStateSvc.selectedClass = {id: 'classId'};
        analyticStateSvc.selectedProperties = [{id: 'propId', title: 'title'}];
        expect(analyticStateSvc.createQueryString().replace(/\s/g, '')).toEqual(('SELECT DISTINCT (GROUP_CONCAT(DISTINCT ?var0; SEPARATOR = "<br>") AS ?var0s) WHERE { ?s <rdf:type> undefined:classId. { ?s undefined:propId ?var0. } } GROUP BY ?s').replace(/\s/g, ''));
        expect(analyticStateSvc.query).toEqual({
            type: 'query',
            prefixes: {},
            queryType: 'SELECT',
            group: [{ expression: '?s' }],
            distinct: true,
            variables: [{
                expression: {
                    expression: '?var0',
                    type: 'aggregate',
                    aggregation: 'group_concat',
                    distinct: true,
                    separator: '<br>'
                },
                variable: '?var0s'
            }],
            where: [{
                type: 'bgp',
                triples: [{
                    subject: '?s',
                    predicate: prefixes.rdf + 'type',
                    object: 'classId'
                }]
            }, {
                type: 'union',
                patterns: [{
                    type: 'bgp',
                    triples: [{
                        subject: '?s',
                        predicate: 'propId',
                        object: '?var0'
                    }]
                }]
            }]
        });
        expect(analyticStateSvc.variables).toEqual({var0s: 'title'});
    });
    describe('getPage should call the correct methods with the correct url when direction is', function() {
        describe('next and get', function() {
            it('resolves', function() {
                this.getPageResolves('next');
            });
            it('rejects', function() {
                this.getPageRejects('next');
            });
        });
        describe('prev and get', function() {
            it('resolves', function() {
                this.getPageResolves('prev');
            });
            it('rejects', function() {
                this.getPageRejects('prev');
            });
        });
    });
    describe('sortResults should adjust the query as needed and get the correct results when pagedQuery', function() {
        beforeEach(function() {
            analyticStateSvc.query = {
                type: 'query',
                queryType: 'SELECT',
                variables: ['*'],
                where: [{
                    type: 'bgp',
                    triples: [{
                        subject: '?s',
                        predicate: '?p',
                        object: '?o'
                    }]
                }]
            };
        });
        it('resolves', function() {
            sparqlManagerSvc.pagedQuery.and.returnValue($q.when(this.response));
            this.sortResults();
            this.onPagedSuccess();
        });
        it('rejects', function() {
            sparqlManagerSvc.pagedQuery.and.returnValue($q.reject('error'));
            this.sortResults();
            this.onPagedError();
        });
    });
    describe('reorderColumns should reorder columns appropriately when', function() {
        beforeEach(function() {
            analyticStateSvc.selectedProperties = [{id: 1}, {id: 2}, {id: 3}];
            analyticStateSvc.results = {
                bindings: [{id: 1}, {id: 2}, {id: 3}]
            };
            analyticStateSvc.query = {
                variables: [{id: 1}, {id: 2}, {id: 3}]
            };
        });
        describe('to and from are', function() {
            it('to and from are different', function() {
                analyticStateSvc.reorderColumns(0, 1);
                expect(analyticStateSvc.selectedProperties).toEqual([{id: 2}, {id: 1}, {id: 3}]);
                expect(analyticStateSvc.results.bindings).toEqual([{id: 2}, {id: 1}, {id: 3}]);
                expect(analyticStateSvc.query.variables).toEqual([{id: 2}, {id: 1}, {id: 3}]);
            });
            it('to and from are the same', function() {
                analyticStateSvc.reorderColumns(0, 0);
                expect(analyticStateSvc.selectedProperties).toEqual([{id: 1}, {id: 2}, {id: 3}]);
                expect(analyticStateSvc.results.bindings).toEqual([{id: 1}, {id: 2}, {id: 3}]);
                expect(analyticStateSvc.query.variables).toEqual([{id: 1}, {id: 2}, {id: 3}]);
            });
        });
        it('selectedProperties is empty', function() {
            analyticStateSvc.selectedProperties = [];
            analyticStateSvc.reorderColumns(0, 1);
            expect(analyticStateSvc.selectedProperties).toEqual([]);
            expect(analyticStateSvc.results.bindings).toEqual([{id: 1}, {id: 2}, {id: 3}]);
            expect(analyticStateSvc.query.variables).toEqual([{id: 1}, {id: 2}, {id: 3}]);
        });
        it('results.bindings is empty', function() {
            analyticStateSvc.results.bindings = [];
            analyticStateSvc.reorderColumns(0, 1);
            expect(analyticStateSvc.selectedProperties).toEqual([{id: 1}, {id: 2}, {id: 3}]);
            expect(analyticStateSvc.results.bindings).toEqual([]);
            expect(analyticStateSvc.query.variables).toEqual([{id: 1}, {id: 2}, {id: 3}]);
        });
        it('query.variables is empty', function() {
            analyticStateSvc.query.variables = [];
            analyticStateSvc.reorderColumns(0, 1);
            expect(analyticStateSvc.results.bindings).toEqual([{id: 1}, {id: 2}, {id: 3}]);
            expect(analyticStateSvc.selectedProperties).toEqual([{id: 1}, {id: 2}, {id: 3}]);
            expect(analyticStateSvc.query.variables).toEqual([]);
        });
    });
    describe('setClassesAndProperties should correctly set the classes and properties when getOntology', function() {
        beforeEach(function() {
            analyticStateSvc.datasets = [{
                ontologies: [{
                    recordId: 'recordId',
                    branchId: 'branchId',
                    commitId: 'commitId'
                }]
            }];
            analyticStateSvc.defaultProperties = [];
            objProp = {'@id': 'objectPropId'};
            objProp[prefixes.rdfs + 'domain'] = [{'@id': 'domainId'}];
            ontologyManagerSvc.getClasses.and.returnValue([{'@id': 'classId'}]);
            ontologyManagerSvc.getEntityName.and.returnValue('name');
            ontologyManagerSvc.getObjectProperties.and.returnValue([objProp]);
            ontologyManagerSvc.getDataTypeProperties.and.returnValue([{'@id': 'dataPropId'}]);
        });
        it('is not called because no ontologies were found', function() {
            analyticStateSvc.datasets = [{ontologies: []}];
            analyticStateSvc.setClassesAndProperties()
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('The Dataset does not have any associated ontologies');
                });
            scope.$apply();
        });
        describe('resolves and response is', function() {
            it('empty', function() {
                ontologyManagerSvc.getOntology.and.returnValue($q.when([]));
                analyticStateSvc.setClassesAndProperties()
                    .then(function() {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toBe('The Dataset ontologies could not be retrieved');
                    });
                scope.$apply();
                expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith('recordId', 'branchId', 'commitId');
            });
            it('populated', function() {
                ontologyManagerSvc.getOntology.and.returnValue($q.when([{}]));
                analyticStateSvc.setClassesAndProperties()
                    .then(_.noop, function() {
                        fail('Promise should have resolved');
                    })
                scope.$apply();
                expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith('recordId', 'branchId', 'commitId');
                expect(ontologyManagerSvc.getClasses).toHaveBeenCalledWith([[{}]]);
                expect(ontologyManagerSvc.getObjectProperties).toHaveBeenCalledWith([[{}]]);
                expect(ontologyManagerSvc.getDataTypeProperties).toHaveBeenCalledWith([[{}]]);
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith({'@id': 'classId'});
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith(objProp);
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith({'@id': 'dataPropId'});
                expect(analyticStateSvc.classes).toEqual([{id: 'classId', title: 'name'}]);
                expect(analyticStateSvc.properties).toEqual([{id: 'objectPropId', title: 'name', classes: ['domainId']}, {id: 'dataPropId', title: 'name', classes: ['classId']}]);
            });
        });
        it('rejects', function() {
            ontologyManagerSvc.getOntology.and.returnValue($q.reject('error'));
            analyticStateSvc.setClassesAndProperties()
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('The Dataset ontologies could not be found');
                });
            scope.$apply();
            expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith('recordId', 'branchId', 'commitId');
        });
    });
    describe('populateEditor should set the values correctly if setClassesAndProperties', function() {
        beforeEach(function() {
            spyOn(analyticStateSvc, 'getOntologies').and.returnValue([]);
            this.configuration = {'@id': 'configId', '@type': [prefixes.analytic + 'Configuration']};
            this.configuration[prefixes.analytic + 'datasetRecord'] = [{'@id': 'datasetRecordId'}];
            this.configuration[prefixes.analytic + 'hasRow'] = [{'@id': 'rowId'}];
            this.configuration[prefixes.analytic + 'hasColumn'] = [{'@id': 'columnId1'}, {'@id': 'columnId2'}];
            this.analyticRecord = {'@id': 'recordId', '@type': [prefixes.analytic + 'AnalyticRecord']};
            this.analyticRecord[prefixes.dcterms + 'title'] = [{'@value': 'title'}];
            this.analyticRecord[prefixes.dcterms + 'description'] = [{'@value': 'description'}];
            this.analyticRecord[prefixes.catalog + 'keyword'] = [{'@value': 'keyword1'}, {'@value': 'keyword2'}];
            this.column1 = {'@id': 'columnId1'};
            this.column1[prefixes.analytic + 'hasIndex'] = [{'@value': 1}];
            this.column1[prefixes.analytic + 'hasProperty'] = [{'@id': 'property1'}];
            this.column2 = {'@id': 'columnId2'};
            this.column2[prefixes.analytic + 'hasIndex'] = [{'@value': 0}];
            this.column2[prefixes.analytic + 'hasProperty'] = [{'@id': 'property2'}];
            this.record = [this.analyticRecord, this.configuration, this.column1, this.column2];
            utilSvc.getPropertyId.and.callFake(function(obj, prop) {
                return obj[prop][0]['@id'];
            });
            utilSvc.getDctermsValue.and.callFake(function(obj, prop) {
                return obj[prefixes.dcterms + prop][0]['@value'];
            });
            utilSvc.getPropertyValue.and.callFake(function(obj, prop) {
                return obj[prop][0]['@value'];
            });
            datasetManagerSvc.datasetRecords = [[{'@id': 'datasetRecordId', '@type': 'type'}, {}]];
        });
        it('it not called because the datset cannot be found', function() {
            datasetManagerSvc.datasetRecords = [];
            analyticStateSvc.populateEditor(this.record)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Dataset could not be found');
                });
            scope.$apply();
        });
        describe('resolves and', function() {
            beforeEach(function() {
                spyOn(analyticStateSvc, 'setClassesAndProperties').and.returnValue($q.when());
                spyOn(analyticStateSvc, 'createQueryString').and.returnValue('query');
            });
            it('the row classId could not be found in the classes list', function() {
                analyticStateSvc.populateEditor(this.record)
                    .then(function(response) {
                        expect(response).toBe('The Class could not be found in the Dataset ontologies');
                    }, function() {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                this.populateEditor(this.configuration, this.analyticRecord);
                expect(analyticStateSvc.createQueryString).not.toHaveBeenCalled();
                expect(analyticStateSvc.selectedClass).toBeUndefined();
                expect(analyticStateSvc.selectedProperties).toEqual([]);
            });
            it('none of the propertyIds could be found in the properties list', function() {
                analyticStateSvc.classes = [{id: 'rowId'}];
                analyticStateSvc.populateEditor(this.record)
                    .then(function(response) {
                        expect(response).toBe('The Properties could not be found in the Dataset ontologies');
                    }, function() {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                this.populateEditor(this.configuration, this.analyticRecord);
                expect(analyticStateSvc.createQueryString).not.toHaveBeenCalled();
                expect(analyticStateSvc.selectedClass).toEqual({id: 'rowId'});
                expect(analyticStateSvc.selectedProperties).toEqual([]);
            });
            describe('getPagedResults', function() {
                beforeEach(function() {
                    analyticStateSvc.classes = [{id: 'rowId'}];
                    analyticStateSvc.properties = [{id: 'property1'}, {id: 'property2'}];
                });
                it('resolves', function() {
                    sparqlManagerSvc.pagedQuery.and.returnValue($q.when(this.response));
                    analyticStateSvc.populateEditor(this.record)
                        .then(_.noop, function() {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                    this.populateEditor(this.configuration, this.analyticRecord);
                    expect(analyticStateSvc.createQueryString).toHaveBeenCalled();
                    expect(analyticStateSvc.selectedClass).toEqual({id: 'rowId'});
                    expect(analyticStateSvc.selectedProperties).toEqual([{id: 'property2'}, {id: 'property1'}]);
                    this.onPagedSuccess();
                });
                it('rejects', function() {
                    sparqlManagerSvc.pagedQuery.and.returnValue($q.reject('error'));
                    analyticStateSvc.populateEditor(this.record)
                        .then(_.noop, function() {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                    this.populateEditor(this.configuration, this.analyticRecord);
                    expect(analyticStateSvc.createQueryString).toHaveBeenCalled();
                    expect(analyticStateSvc.selectedClass).toEqual({id: 'rowId'});
                    expect(analyticStateSvc.selectedProperties).toEqual([{id: 'property2'}, {id: 'property1'}]);
                    this.onPagedError();
                });
            });
        });
        it('rejects', function() {
            spyOn(analyticStateSvc, 'setClassesAndProperties').and.returnValue($q.reject('error'));
            analyticStateSvc.populateEditor(this.record)
                .then(function() {
                    fail('Promise should have been rejected');
                }, function(response) {
                    expect(response).toBe('error');
                });
            scope.$apply();
            expect(utilSvc.getPropertyId).toHaveBeenCalledWith(this.configuration, prefixes.analytic + 'datasetRecord');
            expect(analyticStateSvc.datasets).toEqual([]);
            expect(utilSvc.getPropertyId).toHaveBeenCalledWith(this.configuration, prefixes.analytic + 'hasRow');
            expect(analyticStateSvc.setClassesAndProperties).toHaveBeenCalled();
        });
    });
    it('getOntologies should return the correct array of ontologies', function() {
        utilSvc.getPropertyId.and.returnValue('id');
        var record = {'@id': 'id', '@type': 'type'};
        var dataset = [record, {}];
        expect(analyticStateSvc.getOntologies(dataset, record)).toEqual([{recordId: 'id', branchId: 'id', commitId: 'id'}]);
        expect(utilSvc.getPropertyId).toHaveBeenCalledWith({}, prefixes.dataset + 'linksToRecord');
        expect(utilSvc.getPropertyId).toHaveBeenCalledWith({}, prefixes.dataset + 'linksToBranch');
        expect(utilSvc.getPropertyId).toHaveBeenCalledWith({}, prefixes.dataset + 'linksToCommit');
    });
    describe('createTableConfigurationConfig should return the correct object when selectedConfigurationId is', function() {
        beforeEach(function() {
            analyticStateSvc.datasets = [{id: 'datasetId'}];
            analyticStateSvc.selectedClass = {id: 'classId'};
            analyticStateSvc.selectedProperties = [{id: 'propId1'}, {id: 'propId2'}];
        });
        it('empty', function() {
            expect(analyticStateSvc.createTableConfigurationConfig()).toEqual({
                json: JSON.stringify({
                    datasetRecordId: 'datasetId',
                    row: 'classId',
                    columns: [{index: 0, property: 'propId1'}, {index: 1, property: 'propId2'}]
                }),
                type: prefixes.analytic + 'TableConfiguration'
            });
        });
        it('populated', function() {
            analyticStateSvc.selectedConfigurationId = 'configId';
            expect(analyticStateSvc.createTableConfigurationConfig()).toEqual({
                json: JSON.stringify({
                    datasetRecordId: 'datasetId',
                    row: 'classId',
                    columns: [{index: 0, property: 'propId1'}, {index: 1, property: 'propId2'}],
                    configurationId: 'configId'
                }),
                type: prefixes.analytic + 'TableConfiguration'
            });
        });
    });
});
