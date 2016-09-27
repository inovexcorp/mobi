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
describe('SPARQL Result Table directive', function() {
    var $compile,
        $window,
        scope,
        sparqlManagerSvc,
        element;

    beforeEach(function() {
        module('templates');
        module('sparqlResultTable');
        mockSparqlManager();

        inject(function(_sparqlManagerService_) {
            sparqlManagerSvc = _sparqlManagerService_;
        });

        inject(function(_$compile_, _$rootScope_, _$window_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $window = _$window_;
        });

        sparqlManagerSvc.data = {
            paginatedResults: {
                results: [
                    {
                        var1: {type: 'a-type1', value: 'a-value1'},
                        var2: {type: 'a-type2', value: 'a-value2'}
                    },
                    {
                        var1: {type: 'b-type1', value: 'b-value1'},
                        var2: {type: 'b-type2', value: 'b-value2'}
                    }
                ]
            },
            bindingNames: ['var1', 'var2']
        }

        sparqlManagerSvc.results = [

        ];
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.sparqlManagerService = sparqlManagerSvc;
            element = $compile(angular.element('<sparql-result-table></sparql-result-table>'))(scope);
            scope.$digest();
        });
        it('for a div', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on block', function() {
            var block = element.find('block');
            expect(block.length).toBe(1);
        });
        it('based on block-content', function() {
            var blockFooter = element.find('block-content');
            expect(blockFooter.length).toBe(1);
        });
        it('based on block-footer', function() {
            var blockFooter = element.find('block-footer');
            expect(blockFooter.length).toBe(1);
        });
        it('based on table', function() {
            var table = element.querySelectorAll('.table');
            expect(table.length).toBe(1);
        });
        it('based on pagination directive', function() {
            var pagination = element.find('pagination');
            expect(pagination.length).toBe(1);
        });
        it('<th>s should match bindingNames length', function() {
            var theadList = element.querySelectorAll('thead');
            expect(element.html()).not.toContain('None');
            expect(theadList.length).toBe(1);
            var thead = theadList[0];
            expect(thead.querySelectorAll('th').length).toBe(scope.sparqlManagerService.data.bindingNames.length);
        });
        it('<tr>s should match results length', function() {
            var tbodyList = element.querySelectorAll('tbody');
            expect(element.html()).not.toContain('None');
            expect(tbodyList.length).toBe(1);
            var tbody = tbodyList[0];
            expect(tbody.querySelectorAll('tr').length).toBe(scope.sparqlManagerService.data.paginatedResults.results.length);
        });
        it('shows error message if populated', function() {
            var errorP = element.querySelectorAll('.text-danger');
            expect(errorP.length).toBe(0);

            scope.sparqlManagerService.errorMessage = 'Error message';
            scope.$digest();

            errorP = element.querySelectorAll('.text-danger');
            expect(errorP.length).toBe(1);
        });
        it('shows info message if populated', function() {
            var errorP = element.querySelectorAll('.text-info');
            expect(errorP.length).toBe(0);

            scope.sparqlManagerService.infoMessage = 'Info message';
            scope.$digest();

            errorP = element.querySelectorAll('.text-info');
            expect(errorP.length).toBe(1);
        });
    });
});