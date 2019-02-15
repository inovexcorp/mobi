/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
describe('Search Service', function() {
    var searchSvc, scope, $q, httpSvc, sparqlManagerSvc, discoverStateSvc, prefixes, util, datasetManagerSvc, ontologyManagerSvc;

    beforeEach(function() {
        module('search');
        mockHttpService();
        mockSparqlManager();
        mockDiscoverState();
        mockPrefixes();
        mockDatasetManager();
        mockOntologyManager();
        mockUtil();

        module(function($provide) {
            $provide.constant('sparqljs', window.sparqljs);
        });

        inject(function(searchService, _$rootScope_, _$q_, _httpService_, _sparqlManagerService_, _discoverStateService_, _prefixes_, _utilService_, _datasetManagerService_, _ontologyManagerService_) {
            searchSvc = searchService;
            scope = _$rootScope_;
            $q = _$q_;
            httpSvc = _httpService_;
            sparqlManagerSvc = _sparqlManagerService_;
            discoverStateSvc = _discoverStateService_;
            prefixes = _prefixes_;
            util = _utilService_;
            datasetManagerSvc = _datasetManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
        });

        this.pathDetails = {
            patterns: [{}],
            variable: 'variable'
        };
    });

    afterEach(function() {
        searchSvc = null;
        scope = null;
        $q = null;
        httpSvc = null;
        sparqlManagerSvc = null;
        discoverStateSvc = null;
        prefixes = null;
        util = null;
        datasetManagerSvc = null;
        ontologyManagerSvc = null;
    });

    describe('getPropertiesForDataset should return the correct list when getDataProperties and getObjectProperties', function() {
        beforeEach(function() {
            this.identifier = {'@id': 'ontology'};
            this.record = {'@id': 'id', '@type': []};
            datasetManagerSvc.datasetRecords = [[ this.record, this.identifier ]];
            datasetManagerSvc.getOntologyIdentifiers.and.returnValue([this.identifier]);
            util.getPropertyId.and.returnValue('value');
        });
        it('resolves', function() {
            ontologyManagerSvc.getDataProperties.and.returnValue($q.when([{prop: 'data1'}]));
            ontologyManagerSvc.getObjProperties.and.returnValue($q.when([{prop: 'object1'}]));
            searchSvc.getPropertiesForDataset(this.record['@id'])
                .then(function(response) {
                    expect(response).toEqual([{prop: 'data1'}, {prop: 'object1'}]);
                }, function() {
                    fail('Promise should have resolved');
                });
            scope.$apply();
            expect(datasetManagerSvc.getOntologyIdentifiers).toHaveBeenCalledWith([this.record, this.identifier]);
            expect(util.getPropertyId).toHaveBeenCalledWith(this.identifier, prefixes.dataset + 'linksToRecord');
            expect(util.getPropertyId).toHaveBeenCalledWith(this.identifier, prefixes.dataset + 'linksToBranch');
            expect(util.getPropertyId).toHaveBeenCalledWith(this.identifier, prefixes.dataset + 'linksToCommit');
            expect(ontologyManagerSvc.getDataProperties).toHaveBeenCalledWith('value', 'value', 'value');
            expect(ontologyManagerSvc.getObjProperties).toHaveBeenCalledWith('value', 'value', 'value');
        });
        it('rejects', function() {
            ontologyManagerSvc.getDataProperties.and.returnValue($q.reject('dataError'));
            ontologyManagerSvc.getObjProperties.and.returnValue($q.reject('objectError'));
            searchSvc.getPropertiesForDataset(this.record['@id'])
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('dataError');
                });
            scope.$apply();
            expect(datasetManagerSvc.getOntologyIdentifiers).toHaveBeenCalledWith([this.record, this.identifier]);
            expect(util.getPropertyId).toHaveBeenCalledWith(this.identifier, prefixes.dataset + 'linksToRecord');
            expect(util.getPropertyId).toHaveBeenCalledWith(this.identifier, prefixes.dataset + 'linksToBranch');
            expect(util.getPropertyId).toHaveBeenCalledWith(this.identifier, prefixes.dataset + 'linksToCommit');
            expect(ontologyManagerSvc.getDataProperties).toHaveBeenCalledWith('value', 'value', 'value');
            expect(ontologyManagerSvc.getObjProperties).toHaveBeenCalledWith('value', 'value', 'value');
        });
    });
    describe('should submit a search query', function() {
        beforeEach(function() {
            spyOn(searchSvc, 'createQueryString').and.returnValue('query');
        });
        it('unless an error occurs', function() {
            sparqlManagerSvc.query.and.returnValue($q.reject('Error Message'));
            searchSvc.submitSearch('', {})
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual('Error Message');
                });
            scope.$apply();
            expect(searchSvc.createQueryString).toHaveBeenCalledWith({});
            expect(sparqlManagerSvc.query).toHaveBeenCalledWith('query', '', discoverStateSvc.search.targetedId);
            expect(httpSvc.cancel).toHaveBeenCalledWith(discoverStateSvc.search.targetedId);
        });
        it('successfully', function() {
            sparqlManagerSvc.query.and.returnValue($q.when({}));
            searchSvc.submitSearch('', {})
                .then(function(response) {
                    expect(response).toEqual({});
                }, function() {
                    fail('Promise should have rejected');
                });
            scope.$apply();
            expect(searchSvc.createQueryString).toHaveBeenCalledWith({});
            expect(sparqlManagerSvc.query).toHaveBeenCalledWith('query', '', discoverStateSvc.search.targetedId);
            expect(httpSvc.cancel).toHaveBeenCalledWith(discoverStateSvc.search.targetedId);
        });
    });
    describe('should create a keyword query', function() {
        it('with and', function() {
            var config = {keywords: ['test1', 'test2']};
            var result = searchSvc.createQueryString(config);
            expect(result).toEqual('SELECT DISTINCT ?Entity (GROUP_CONCAT(DISTINCT ?Keyword; SEPARATOR = "<br>") AS ?Keywords) WHERE {\n  {\n    ?Entity ?p ?Keyword.\n    FILTER(CONTAINS(LCASE(?Keyword), LCASE("test1")))\n  }\n  {\n    ?Entity ?p ?Keyword.\n    FILTER(CONTAINS(LCASE(?Keyword), LCASE("test2")))\n  }\n}\nGROUP BY ?Entity');
            expect(config.variables).toEqual({Entity: 'Entity', Keywords: 'Keywords'});
        });
        it('with or', function() {
            var config = {keywords: ['test1', 'test2'], isOrKeywords: true};
            var result = searchSvc.createQueryString(config);
            expect(result).toEqual('SELECT DISTINCT ?Entity (GROUP_CONCAT(DISTINCT ?Keyword; SEPARATOR = "<br>") AS ?Keywords) WHERE {\n  {\n    ?Entity ?p ?Keyword.\n    FILTER(CONTAINS(LCASE(?Keyword), LCASE("test1")))\n  }\n  UNION\n  {\n    ?Entity ?p ?Keyword.\n    FILTER(CONTAINS(LCASE(?Keyword), LCASE("test2")))\n  }\n}\nGROUP BY ?Entity');
            expect(config.variables).toEqual({Entity: 'Entity', Keywords: 'Keywords'});
        });
    });
    describe('should create a type query', function() {
        it('with and', function() {
            var config = {types: [{classIRI: 'http://mobi.com/1'}, {classIRI: 'http://mobi.com/2'}]};
            var result = searchSvc.createQueryString(config);
            expect(result).toEqual('SELECT DISTINCT ?Entity (GROUP_CONCAT(DISTINCT ?Type; SEPARATOR = "<br>") AS ?Types) WHERE {\n  {\n    ?Entity <' + prefixes.rdf + 'type> <http://mobi.com/1>.\n    ?Entity <' + prefixes.rdf + 'type> ?Type.\n  }\n  {\n    ?Entity <' + prefixes.rdf + 'type> <http://mobi.com/2>.\n    ?Entity <' + prefixes.rdf + 'type> ?Type.\n  }\n}\nGROUP BY ?Entity');
            expect(config.variables).toEqual({Entity: 'Entity', Types: 'Types'});
        });
        it('with or', function() {
            var config = {types: [{classIRI: 'http://mobi.com/1'}, {classIRI: 'http://mobi.com/2'}], isOrTypes: true};
            var result = searchSvc.createQueryString(config);
            expect(result).toEqual('SELECT DISTINCT ?Entity (GROUP_CONCAT(DISTINCT ?Type; SEPARATOR = "<br>") AS ?Types) WHERE {\n  {\n    ?Entity <' + prefixes.rdf + 'type> <http://mobi.com/1>.\n    ?Entity <' + prefixes.rdf + 'type> ?Type.\n  }\n  UNION\n  {\n    ?Entity <' + prefixes.rdf + 'type> <http://mobi.com/2>.\n    ?Entity <' + prefixes.rdf + 'type> ?Type.\n  }\n}\nGROUP BY ?Entity');
            expect(config.variables).toEqual({Entity: 'Entity', Types: 'Types'});
        });
    });
    describe('should create a filtered query when filterType is', function() {
        beforeEach(function() {
            this.defaultQuery = {
                type: 'bgp',
                triples: [{
                    subject: '?s',
                    predicate: '?p',
                    object: '?o'
                }]
            };
            this.defaultPath = [{predicate: 'default', range: 'range'}, {predicate: 'predicate', range: 'range'}];
            this.defaultPathDetails = {
                variable: '?var0',
                patterns: [{
                    type: 'bgp',
                    triples: [{
                        subject: '?Entity',
                        predicate: 'default',
                        object: '?var0'
                    }]
                }, {
                    type: 'bgp',
                    triples: [{
                        subject: '?var0',
                        predicate: prefixes.rdf + 'type',
                        object: 'range'
                    }]
                }]
            };
            this.expected = 'SELECT DISTINCT ?Entity WHERE { ?s ?p ?o. }\nGROUP BY ?Entity';
        });
        it('Boolean', function() {
            spyOn(searchSvc, 'createBooleanQuery').and.returnValue(this.defaultQuery);
            var config = {filters: [{type: 'Boolean', path: this.defaultPath, boolean: 'boolean', title: 'title'}]};
            var result = searchSvc.createQueryString(config);
            expect(result).toEqual(this.expected);
            expect(searchSvc.createBooleanQuery).toHaveBeenCalledWith('predicate', 'boolean', 'title', this.defaultPathDetails);
        });
        it('Contains', function() {
            spyOn(searchSvc, 'createContainsQuery').and.returnValue(this.defaultQuery);
            var config = {filters: [{type: 'Contains', path: this.defaultPath, value: 'value', title: 'title'}]};
            var result = searchSvc.createQueryString(config);
            expect(result).toEqual(this.expected);
            expect(searchSvc.createContainsQuery).toHaveBeenCalledWith('predicate', 'value', 'title', this.defaultPathDetails);
        });
        it('Exact', function() {
            spyOn(searchSvc, 'createExactQuery').and.returnValue(this.defaultQuery);
            var config = {filters: [{type: 'Exact', path: this.defaultPath, value: 'value', title: 'title'}]};
            var result = searchSvc.createQueryString(config);
            expect(result).toEqual(this.expected);
            expect(searchSvc.createExactQuery).toHaveBeenCalledWith('predicate', 'value', 'range', 'title', this.defaultPathDetails);
        });
        it('Existence', function() {
            spyOn(searchSvc, 'createExistenceQuery').and.returnValue(this.defaultQuery);
            var config = {filters: [{type: 'Existence', path: this.defaultPath, title: 'title'}]};
            var result = searchSvc.createQueryString(config);
            expect(result).toEqual(this.expected);
            expect(searchSvc.createExistenceQuery).toHaveBeenCalledWith('predicate', 'title', this.defaultPathDetails);
        });
        it('undefined', function() {
            spyOn(searchSvc, 'createExistenceQuery').and.returnValue(this.defaultQuery);
            var config = {filters: [{type: undefined, path: this.defaultPath, title: 'title'}]};
            var result = searchSvc.createQueryString(config);
            expect(result).toEqual(this.expected);
            expect(searchSvc.createExistenceQuery).toHaveBeenCalledWith('predicate', 'title', this.defaultPathDetails);
        });
        it('Greater than', function() {
            spyOn(searchSvc, 'createRangeQuery').and.returnValue(this.defaultQuery);
            var config = {filters: [{type: 'Greater than', path: this.defaultPath, value: 'value', title: 'title'}]};
            var result = searchSvc.createQueryString(config);
            expect(result).toEqual(this.expected);
            expect(searchSvc.createRangeQuery).toHaveBeenCalledWith('predicate', 'range', {greaterThan: 'value'}, 'title', this.defaultPathDetails);
        });
        it('Greater than or equal to', function() {
            spyOn(searchSvc, 'createRangeQuery').and.returnValue(this.defaultQuery);
            var config = {filters: [{type: 'Greater than or equal to', path: this.defaultPath, value: 'value', title: 'title'}]};
            var result = searchSvc.createQueryString(config);
            expect(result).toEqual(this.expected);
            expect(searchSvc.createRangeQuery).toHaveBeenCalledWith('predicate', 'range', {greaterThanOrEqualTo: 'value'}, 'title', this.defaultPathDetails);
        });
        it('Less than', function() {
            spyOn(searchSvc, 'createRangeQuery').and.returnValue(this.defaultQuery);
            var config = {filters: [{type: 'Less than', path: this.defaultPath, value: 'value', title: 'title'}]};
            var result = searchSvc.createQueryString(config);
            expect(result).toEqual(this.expected);
            expect(searchSvc.createRangeQuery).toHaveBeenCalledWith('predicate', 'range', {lessThan: 'value'}, 'title', this.defaultPathDetails);
        });
        it('Less than or equal to', function() {
            spyOn(searchSvc, 'createRangeQuery').and.returnValue(this.defaultQuery);
            var config = {filters: [{type: 'Less than or equal to', path: this.defaultPath, value: 'value', title: 'title'}]};
            var result = searchSvc.createQueryString(config);
            expect(result).toEqual(this.expected);
            expect(searchSvc.createRangeQuery).toHaveBeenCalledWith('predicate', 'range', {lessThanOrEqualTo: 'value'}, 'title', this.defaultPathDetails);
        });
        it('Range', function() {
            spyOn(searchSvc, 'createRangeQuery').and.returnValue(this.defaultQuery);
            var config = {filters: [{type: 'Range', path: this.defaultPath, begin: 'begin', end: 'end', title: 'title'}]};
            var result = searchSvc.createQueryString(config);
            expect(searchSvc.createRangeQuery).toHaveBeenCalledWith('predicate', 'range', {lessThanOrEqualTo: 'end', greaterThanOrEqualTo: 'begin'}, 'title', this.defaultPathDetails);
            expect(result).toEqual(this.expected);
        });
        it('Regex', function() {
            spyOn(searchSvc, 'createRegexQuery').and.returnValue(this.defaultQuery);
            var config = {filters: [{type: 'Regex', path: this.defaultPath, regex: 'regex', title: 'title'}]};
            var result = searchSvc.createQueryString(config);
            expect(result).toEqual(this.expected);
            expect(searchSvc.createRegexQuery).toHaveBeenCalledWith('predicate', 'regex', 'title', this.defaultPathDetails);
        });
    });
    it('createExistenceQuery should create the correct query part', function() {
        expect(searchSvc.createExistenceQuery('predicate', 'exist', this.pathDetails)).toEqual({
            type: 'group',
            patterns: [{}, {
                type: 'bgp',
                triples: [{
                    subject: 'variable',
                    predicate: 'predicate',
                    object: '?var0'
                }]
            }]
        });
    });
    it('createContainsQuery should create the correct query part', function() {
        expect(searchSvc.createContainsQuery('predicate', 'keyword', 'contains', this.pathDetails)).toEqual({
            type: 'group',
            patterns: [{}, {
                type: 'bgp',
                triples: [{
                    subject: 'variable',
                    predicate: 'predicate',
                    object: '?var0'
                }]
            }, {
                type: 'filter',
                expression: {
                    type: 'operation',
                    operator: 'contains',
                    args: [{
                        type: 'operation',
                        operator: 'lcase',
                        args: ['?var0']
                    }, {
                        type: 'operation',
                        operator: 'lcase',
                        args: ['\"keyword\"']
                    }]
                }
            }]
        });
    });
    it('createExactQuery should create the correct query part', function() {
        expect(searchSvc.createExactQuery('predicate', 'keyword', 'range', 'exact', this.pathDetails)).toEqual({
            type: 'group',
            patterns: [{}, {
                type: 'bgp',
                triples: [{
                    subject: 'variable',
                    predicate: 'predicate',
                    object: '?var0'
                }]
            }, {
                type: 'filter',
                expression: {
                    type: 'operation',
                    operator: '=',
                    args: ['?var0', '"keyword"^^range']
                }
            }]
        });
    });
    it('createRegexQuery should create the correct query part', function() {
        expect(searchSvc.createRegexQuery('predicate', '/[A-Z]/', 'regex', this.pathDetails)).toEqual({
            type: 'group',
            patterns: [{}, {
                type: 'bgp',
                triples: [{
                    subject: 'variable',
                    predicate: 'predicate',
                    object: '?var0'
                }]
            }, {
                type: 'filter',
                expression: {
                    type: 'operation',
                    operator: 'regex',
                    args: ['?var0', '\"/[A-Z]/\"']
                }
            }]
        });
    });
    describe('createRangeQuery should create the correct query part when rangeConfig contains', function() {
        it('lessThan', function() {
            expect(searchSvc.createRangeQuery('predicate', 'range', {lessThan: 1}, 'label', this.pathDetails)).toEqual({
                type: 'group',
                patterns: [{}, {
                    type: 'bgp',
                    triples: [{
                        subject: 'variable',
                        predicate: 'predicate',
                        object: '?var0'
                    }]
                }, {
                    type: 'filter',
                    expression: '?var0 < 1'
                }]
            });
            expect(util.getInputType).toHaveBeenCalledWith('range');
        });
        it('lessThanOrEqualTo', function() {
            expect(searchSvc.createRangeQuery('predicate', 'range', {lessThanOrEqualTo: 1}, 'label', this.pathDetails)).toEqual({
                type: 'group',
                patterns: [{}, {
                    type: 'bgp',
                    triples: [{
                        subject: 'variable',
                        predicate: 'predicate',
                        object: '?var0'
                    }]
                }, {
                    type: 'filter',
                    expression: '?var0 <= 1'
                }]
            });
            expect(util.getInputType).toHaveBeenCalledWith('range');
        });
        it('greaterThan', function() {
            expect(searchSvc.createRangeQuery('predicate', 'range', {greaterThan: 1}, 'label', this.pathDetails)).toEqual({
                type: 'group',
                patterns: [{}, {
                    type: 'bgp',
                    triples: [{
                        subject: 'variable',
                        predicate: 'predicate',
                        object: '?var0'
                    }]
                }, {
                    type: 'filter',
                    expression: '?var0 > 1'
                }]
            });
            expect(util.getInputType).toHaveBeenCalledWith('range');
        });
        it('greaterThanOrEqualTo', function() {
            expect(searchSvc.createRangeQuery('predicate', 'range', {greaterThanOrEqualTo: 1}, 'label', this.pathDetails)).toEqual({
                type: 'group',
                patterns: [{}, {
                    type: 'bgp',
                    triples: [{
                        subject: 'variable',
                        predicate: 'predicate',
                        object: '?var0'
                    }]
                }, {
                    type: 'filter',
                    expression: '?var0 >= 1'
                }]
            });
            expect(util.getInputType).toHaveBeenCalledWith('range');
        });
        it('lessThanOrEqualTo and greaterThanOrEqualTo', function() {
            expect(searchSvc.createRangeQuery('predicate', 'range', {lessThanOrEqualTo: 1, greaterThanOrEqualTo: 0}, 'label', this.pathDetails)).toEqual({
                type: 'group',
                patterns: [{}, {
                    type: 'bgp',
                    triples: [{
                        subject: 'variable',
                        predicate: 'predicate',
                        object: '?var0'
                    }]
                }, {
                    type: 'filter',
                    expression: '?var0 <= 1'
                }, {
                    type: 'filter',
                    expression: '?var0 >= 0'
                }]
            });
            expect(util.getInputType).toHaveBeenCalledWith('range');
        });
    });
    it('createRangeQuery should create the correct query part when input type is datetime-local', function() {
        util.getInputType.and.returnValue('datetime-local');
        expect(searchSvc.createRangeQuery('predicate', 'range', {greaterThanOrEqualTo: 1}, 'label', this.pathDetails)).toEqual({
            type: 'group',
            patterns: [{}, {
                type: 'bgp',
                triples: [{
                    subject: 'variable',
                    predicate: 'predicate',
                    object: '?var0'
                }]
            }, {
                type: 'filter',
                expression: '?var0 >= 1^^<' + prefixes.xsd + 'dateTime>'
            }]
        });
        expect(util.getInputType).toHaveBeenCalledWith('range');
    });
    describe('createBooleanQuery should create the correct query part when value is', function() {
        it('true', function() {
            expect(searchSvc.createBooleanQuery('predicate', true, 'boolean', this.pathDetails)).toEqual({
                type: 'group',
                patterns: [{}, {
                    type: 'bgp',
                    triples: [{
                        subject: 'variable',
                        predicate: 'predicate',
                        object: '?var0'
                    }]
                }, {
                    type: 'filter',
                    expression: {
                        type: 'operation',
                        operator: 'in',
                        args: ['?var0', ['"true"^^' + prefixes.xsd + 'boolean', '"1"^^' + prefixes.xsd + 'boolean']]
                    }
                }]
            });
        });
        it('false', function() {
            expect(searchSvc.createBooleanQuery('predicate', false, 'boolean', this.pathDetails)).toEqual({
                type: 'group',
                patterns: [{}, {
                    type: 'bgp',
                    triples: [{
                        subject: 'variable',
                        predicate: 'predicate',
                        object: '?var0'
                    }]
                }, {
                    type: 'filter',
                    expression: {
                        type: 'operation',
                        operator: 'in',
                        args: ['?var0', ['"false"^^' + prefixes.xsd + 'boolean', '"0"^^' + prefixes.xsd + 'boolean']]
                    }
                }]
            });
        });
    });
});
