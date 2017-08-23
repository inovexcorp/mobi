/*-
 * #%L
 * org.matonto.web
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
    var searchSvc, scope, $q, httpSvc, sparqlManagerSvc, discoverStateSvc, prefixes;

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

        inject(function(searchService, _$rootScope_, _$q_, _httpService_, _sparqlManagerService_, _discoverStateService_, _prefixes_) {
            searchSvc = searchService;
            scope = _$rootScope_;
            $q = _$q_;
            httpSvc = _httpService_;
            sparqlManagerSvc = _sparqlManagerService_;
            discoverStateSvc = _discoverStateService_;
            prefixes = _prefixes_;
        });
    });

    describe('should submit a search query', function() {
        var query = 'query';
        beforeEach(function() {
            spyOn(searchSvc, 'createQueryString').and.returnValue(query);
        });
        it('unless an error occurs', function() {
            sparqlManagerSvc.query.and.returnValue($q.reject('Error Message'));
            searchSvc.submitSearch('', {}).then(function() {
                fail('Promise should have rejected');
            }, function(response) {
                expect(response).toEqual('Error Message');
                expect(searchSvc.createQueryString).toHaveBeenCalledWith({});
                expect(sparqlManagerSvc.query).toHaveBeenCalledWith(query, '', discoverStateSvc.search.targetedId);
                expect(httpSvc.cancel).toHaveBeenCalledWith(discoverStateSvc.search.targetedId);
            });
            scope.$apply();
        });
        it('successfully', function() {
            sparqlManagerSvc.query.and.returnValue($q.when({}));
            searchSvc.submitSearch('', {}).then(function(response) {
                expect(response).toEqual({});
                expect(searchSvc.createQueryString).toHaveBeenCalledWith({});
                expect(sparqlManagerSvc.query).toHaveBeenCalledWith(query, '', discoverStateSvc.search.targetedId);
                expect(httpSvc.cancel).toHaveBeenCalledWith(discoverStateSvc.search.targetedId);
            }, function() {
                fail('Promise should have rejected');
            });
            scope.$apply();
        });
    });
    describe('should create a keyword query', function() {
        it('with and', function() {
            var result = searchSvc.createQueryString({keywords: ['test1', 'test2']});
            expect(result).toEqual('SELECT DISTINCT ?Subject ?Predicate (GROUP_CONCAT(DISTINCT ?o; SEPARATOR = "<br>") AS ?Objects) WHERE {\n  {\n    ?Subject ?Predicate ?o.\n    FILTER(CONTAINS(LCASE(?o), LCASE("test1")))\n  }\n  {\n    ?Subject ?Predicate ?o.\n    FILTER(CONTAINS(LCASE(?o), LCASE("test2")))\n  }\n}\nGROUP BY ?Subject ?Predicate');
        });
        it('with or', function() {
            var result = searchSvc.createQueryString({keywords: ['test1', 'test2'], isOrKeywords: true});
            expect(result).toEqual('SELECT DISTINCT ?Subject ?Predicate (GROUP_CONCAT(DISTINCT ?o; SEPARATOR = "<br>") AS ?Objects) WHERE {\n  {\n    ?Subject ?Predicate ?o.\n    FILTER(CONTAINS(LCASE(?o), LCASE("test1")))\n  }\n  UNION\n  {\n    ?Subject ?Predicate ?o.\n    FILTER(CONTAINS(LCASE(?o), LCASE("test2")))\n  }\n}\nGROUP BY ?Subject ?Predicate');
        });
    });
    describe('should create a type query', function() {
        it('with and', function() {
            var result = searchSvc.createQueryString({types: [{classIRI: 'http://matonto.org/1'}, {classIRI: 'http://matonto.org/2'}]});
            expect(result).toEqual('SELECT DISTINCT ?Subject ?Predicate (GROUP_CONCAT(DISTINCT ?o; SEPARATOR = "<br>") AS ?Objects) WHERE {\n  {\n    ?Subject <' + prefixes.rdf + 'type> <http://matonto.org/1>.\n    ?Subject ?Predicate ?o.\n  }\n  {\n    ?Subject <' + prefixes.rdf + 'type> <http://matonto.org/2>.\n    ?Subject ?Predicate ?o.\n  }\n}\nGROUP BY ?Subject ?Predicate');
        });
        it('with or', function() {
            var result = searchSvc.createQueryString({types: [{classIRI: 'http://matonto.org/1'}, {classIRI: 'http://matonto.org/2'}], isOrTypes: true});
            expect(result).toEqual('SELECT DISTINCT ?Subject ?Predicate (GROUP_CONCAT(DISTINCT ?o; SEPARATOR = "<br>") AS ?Objects) WHERE {\n  {\n    ?Subject <' + prefixes.rdf + 'type> <http://matonto.org/1>.\n    ?Subject ?Predicate ?o.\n  }\n  UNION\n  {\n    ?Subject <' + prefixes.rdf + 'type> <http://matonto.org/2>.\n    ?Subject ?Predicate ?o.\n  }\n}\nGROUP BY ?Subject ?Predicate');
        });
    });
    it('createExistenceQuery should create the correct query part', function() {
        expect(searchSvc.createExistenceQuery('predicate')).toEqual({
            type: 'group',
            patterns: [{
                type: 'bgp',
                triples: [{
                    subject: '?Subject',
                    predicate: 'predicate',
                    object: '?o'
                }]
            }, {
                type: 'bgp',
                triples: [{
                    subject: '?Subject',
                    predicate: '?Predicate',
                    object: '?o'
                }]
            }]
        });
    });
    it('createExistenceQuery should create the correct query part', function() {
        expect(searchSvc.createExactQuery('predicate', 'keyword', 'range')).toEqual({
            type: 'group',
            patterns: [{
                type: 'bgp',
                triples: [{
                    subject: '?Subject',
                    predicate: 'predicate',
                    object: '"keyword"^^range'
                }]
            }, {
                type: 'bgp',
                triples: [{
                    subject: '?Subject',
                    predicate: '?Predicate',
                    object: '?o'
                }]
            }]
        });
    });
    it('createContainsQuery should create the correct query part', function() {
        expect(searchSvc.createContainsQuery('predicate', 'keyword')).toEqual({
            type: 'group',
            patterns: [{
                type: 'bgp',
                triples: [{
                    subject: '?Subject',
                    predicate: 'predicate',
                    object: '?o'
                }]
            }, {
                type: 'bgp',
                triples: [{
                    subject: '?Subject',
                    predicate: '?Predicate',
                    object: '?o'
                }]
            }, {
                type: 'filter',
                expression: {
                    type: 'operation',
                    operator: 'contains',
                    args: [{
                        type: 'operation',
                        operator: 'lcase',
                        args: ['?o']
                    }, {
                        type: 'operation',
                        operator: 'lcase',
                        args: ['\"keyword\"']
                    }]
                }
            }]
        });
    });
    it('createRegexQuery should create the correct query part', function() {
        expect(searchSvc.createRegexQuery('predicate', '/[A-Z]/')).toEqual({
            type: 'group',
            patterns: [{
                type: 'bgp',
                triples: [{
                    subject: '?Subject',
                    predicate: 'predicate',
                    object: '?o'
                }]
            }, {
                type: 'bgp',
                triples: [{
                    subject: '?Subject',
                    predicate: '?Predicate',
                    object: '?o'
                }]
            }, {
                type: 'filter',
                expression: {
                    type: 'operation',
                    operator: 'regex',
                    args: ['?o', '\"/[A-Z]/\"']
                }
            }]
        });
    });
    describe('createRangeQuery should create the correct when rangeConfig contains', function() {
        it('lessThan', function() {
            expect(searchSvc.createRangeQuery('predicate', {lessThan: 1})).toEqual({
                type: 'group',
                patterns: [{
                    type: 'bgp',
                    triples: [{
                        subject: '?Subject',
                        predicate: 'predicate',
                        object: '?o'
                    }]
                }, {
                    type: 'bgp',
                    triples: [{
                        subject: '?Subject',
                        predicate: '?Predicate',
                        object: '?o'
                    }]
                }, {
                    type: 'filter',
                    expression: '?o < 1'
                }]
            });
        });
        it('lessThanOrEqualTo', function() {
            expect(searchSvc.createRangeQuery('predicate', {lessThanOrEqualTo: 1})).toEqual({
                type: 'group',
                patterns: [{
                    type: 'bgp',
                    triples: [{
                        subject: '?Subject',
                        predicate: 'predicate',
                        object: '?o'
                    }]
                }, {
                    type: 'bgp',
                    triples: [{
                        subject: '?Subject',
                        predicate: '?Predicate',
                        object: '?o'
                    }]
                }, {
                    type: 'filter',
                    expression: '?o <= 1'
                }]
            });
        });
        it('greaterThan', function() {
            expect(searchSvc.createRangeQuery('predicate', {greaterThan: 1})).toEqual({
                type: 'group',
                patterns: [{
                    type: 'bgp',
                    triples: [{
                        subject: '?Subject',
                        predicate: 'predicate',
                        object: '?o'
                    }]
                }, {
                    type: 'bgp',
                    triples: [{
                        subject: '?Subject',
                        predicate: '?Predicate',
                        object: '?o'
                    }]
                }, {
                    type: 'filter',
                    expression: '?o > 1'
                }]
            });
        });
        it('greaterThanOrEqualTo', function() {
            expect(searchSvc.createRangeQuery('predicate', {greaterThanOrEqualTo: 1})).toEqual({
                type: 'group',
                patterns: [{
                    type: 'bgp',
                    triples: [{
                        subject: '?Subject',
                        predicate: 'predicate',
                        object: '?o'
                    }]
                }, {
                    type: 'bgp',
                    triples: [{
                        subject: '?Subject',
                        predicate: '?Predicate',
                        object: '?o'
                    }]
                }, {
                    type: 'filter',
                    expression: '?o >= 1'
                }]
            });
        });
        it('lessThanOrEqualTo and greaterThanOrEqualTo', function() {
            expect(searchSvc.createRangeQuery('predicate', {lessThanOrEqualTo: 1, greaterThanOrEqualTo: 0})).toEqual({
                type: 'group',
                patterns: [{
                    type: 'bgp',
                    triples: [{
                        subject: '?Subject',
                        predicate: 'predicate',
                        object: '?o'
                    }]
                }, {
                    type: 'bgp',
                    triples: [{
                        subject: '?Subject',
                        predicate: '?Predicate',
                        object: '?o'
                    }]
                }, {
                    type: 'filter',
                    expression: '?o <= 1'
                }, {
                    type: 'filter',
                    expression: '?o >= 0'
                }]
            });
        });
    });
});
