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
    var searchSvc;

    beforeEach(function() {
        module('search');
        mockUtil();
        mockDiscoverState();
        mockSparqlManager();

        module(function($provide) {
            $provide.constant('sparqljs', window.sparqljs);
        });

        inject(function(searchService) {
            searchSvc = searchService;
        });
    });

    describe('should create a keyword query', function() {
        it('with and', function() {
            var result = searchSvc.createQueryString(['test1', 'test2']);
            expect(result).toEqual('SELECT DISTINCT ?Subject ?Predicate (GROUP_CONCAT(DISTINCT ?o; SEPARATOR = ", ") AS ?Values) WHERE {\n  {\n    ?Subject ?Predicate ?o.\n    FILTER(CONTAINS(LCASE(?o), LCASE("test1")))\n  }\n  {\n    ?Subject ?Predicate ?o.\n    FILTER(CONTAINS(LCASE(?o), LCASE("test2")))\n  }\n}\nGROUP BY ?Subject ?Predicate');
        })
        it('with or', function() {
            var result = searchSvc.createQueryString(['test1', 'test2'], true);
            expect(result).toEqual('SELECT DISTINCT ?Subject ?Predicate (GROUP_CONCAT(DISTINCT ?o; SEPARATOR = ", ") AS ?Values) WHERE {\n  {\n    ?Subject ?Predicate ?o.\n    FILTER(CONTAINS(LCASE(?o), LCASE("test1")))\n  }\n  UNION\n  {\n    ?Subject ?Predicate ?o.\n    FILTER(CONTAINS(LCASE(?o), LCASE("test2")))\n  }\n}\nGROUP BY ?Subject ?Predicate');
        });
    });
});
