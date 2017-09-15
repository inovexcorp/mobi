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
describe('Analytic State Service', function() {
    var $q, scope, analyticStateSvc, prefixes, httpSvc, utilSvc, sparqlManagerSvc, response;

    beforeEach(function() {
        module('analyticState');
        mockHttpService();
        mockPrefixes();
        mockSparqlManager();
        mockUtil();

        inject(function(_$q_, _$rootScope_, analyticStateService, _prefixes_, _httpService_, _utilService_, _sparqlManagerService_) {
            $q = _$q_;
            scope = _$rootScope_;
            analyticStateSvc = analyticStateService;
            prefixes = _prefixes_;
            httpSvc = _httpService_;
            utilSvc = _utilService_;
            sparqlManagerSvc = _sparqlManagerService_;
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
        
        response = {
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
    
    it('showEditor sets the variables correctly', function() {
        analyticStateSvc.showEditor();
        expect(analyticStateSvc.landing).toBe(false);
        expect(analyticStateSvc.editor).toBe(true);
    });
    it('showLanding sets the variables correctly', function() {
        analyticStateSvc.showLanding();
        expect(analyticStateSvc.landing).toBe(true);
        expect(analyticStateSvc.editor).toBe(false);
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
            sparqlManagerSvc.pagedQuery.and.returnValue($q.when(response));
            selectProperty();
            onPagedSuccess();
        });
        it('rejects', function() {
            sparqlManagerSvc.pagedQuery.and.returnValue($q.reject('error'));
            selectProperty();
            onPagedError();
        });
    });
    describe('removeProperty sets the variables correctly when pagedQuery', function() {
        beforeEach(function() {
            analyticStateSvc.properties = [];
            spyOn(analyticStateSvc, 'createQueryString').and.returnValue('query-string');
        });
        it('resolves', function() {
            sparqlManagerSvc.pagedQuery.and.returnValue($q.when(response));
            removeProperty();
            onPagedSuccess();
        });
        it('rejects', function() {
            sparqlManagerSvc.pagedQuery.and.returnValue($q.reject('error'));
            removeProperty();
            onPagedError();
        });
    });
    it('createQueryString sets the correct variables and returns the correct string', function() {
        analyticStateSvc.selectedClass = {id: 'classId'};
        analyticStateSvc.selectedProperties = [{id: 'propId', title: 'title'}];
        expect(analyticStateSvc.createQueryString().replace(/\s/g, '')).toEqual(('SELECT DISTINCT (GROUP_CONCAT(DISTINCT ?var0; SEPARATOR = "<br>") AS ?var0s) WHERE { { ?s <rdf:type> undefined:classId. } UNION { ?s undefined:propId ?var0. } } GROUP BY ?s').replace(/\s/g, ''));
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
                type: 'union',
                patterns: [{
                    type: 'bgp',
                    triples: [{
                        subject: '?s',
                        predicate: prefixes.rdf + 'type',
                        object: 'classId'
                    }]
                }, {
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
                getPageResolves('next');
            });
            it('rejects', function() {
                getPageRejects('next');
            });
        });
        describe('prev and get', function() {
            it('resolves', function() {
                getPageResolves('prev');
            });
            it('rejects', function() {
                getPageRejects('prev');
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
            sparqlManagerSvc.pagedQuery.and.returnValue($q.when(response));
            sortResults();
            onPagedSuccess();
        });
        it('rejects', function() {
            sparqlManagerSvc.pagedQuery.and.returnValue($q.reject('error'));
            sortResults();
            onPagedError();
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
    
    function getPageResolves(direction) {
        httpSvc.get.and.returnValue($q.when(response));
        analyticStateSvc.getPage(direction);
        scope.$apply();
        expect(httpSvc.get).toHaveBeenCalledWith(direction + '-url', undefined, 'spinnerId');
        onPagedSuccess();
    }
    
    function getPageRejects(direction) {
        httpSvc.get.and.returnValue($q.reject('error'));
        analyticStateSvc.getPage(direction);
        scope.$apply();
        expect(httpSvc.get).toHaveBeenCalledWith(direction + '-url', undefined, 'spinnerId');
        onPagedError();
    }
    
    function onPagedSuccess() {
        expect(analyticStateSvc.queryError).toBe('');
        expect(analyticStateSvc.results).toEqual({data: [], bindings: []});
        expect(analyticStateSvc.totalSize).toEqual(10);
        expect(utilSvc.parseLinks).toHaveBeenCalledWith('link-text');
        expect(analyticStateSvc.links).toEqual({prev: 'prev-link', next: 'next-link'});
    }
    
    function onPagedError() {
        expect(analyticStateSvc.results).toBeUndefined();
        expect(analyticStateSvc.queryError).toBe('error');
    }
    
    function sortResults() {
        analyticStateSvc.sortResults('?s', false);
        scope.$apply();
        expect(analyticStateSvc.query.order).toEqual([{expression: '?s', descending: false}]);
        getPagedResults();
    }
    
    function getPagedResults() {
        expect(httpSvc.cancel).toHaveBeenCalledWith('spinnerId');
        expect(analyticStateSvc.currentPage).toBe(0);
        expect(sparqlManagerSvc.pagedQuery).toHaveBeenCalledWith(jasmine.any(String), {
            datasetRecordIRI: 'datasetId',
            id: 'spinnerId',
            page: 0,
            limit: 10
        });
    }
    
    function selectProperty() {
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
    
    function removeProperty() {
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
