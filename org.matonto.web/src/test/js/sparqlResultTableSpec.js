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
        scope,
        sparqlManagerSvc;

    beforeEach(function() {
        module('templates');
        module('sparqlResultTable');
        mockSparqlManager();

        inject(function(_$compile_, _$rootScope_, _sparqlManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            sparqlManagerSvc = _sparqlManagerService_;
        });

        sparqlManagerSvc.data = [
            {
                var1: {type: 'a-type1', value: 'a-value1'},
                var2: {type: 'a-type2', value: 'a-value2'}
            },
            {
                var1: {type: 'b-type1', value: 'b-value1'},
                var2: {type: 'b-type2', value: 'b-value2'}
            }
        ];
        sparqlManagerSvc.bindings = ['var1', 'var2'];
        this.element = $compile(angular.element('<sparql-result-table></sparql-result-table>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for a div', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
        });
        it('based on block', function() {
            expect(this.element.find('block').length).toBe(1);
        });
        it('based on block-content', function() {
            expect(this.element.find('block-content').length).toBe(1);
        });
        it('based on block-footer', function() {
            expect(this.element.find('block-footer').length).toBe(1);
        });
        it('based on table', function() {
            expect(this.element.querySelectorAll('.table').length).toBe(1);
        });
        it('based on pagination directive', function() {
            expect(this.element.find('pagination').length).toBe(1);
        });
        it('with a download button', function() {
            expect(this.element.querySelectorAll('button.download-button').length).toBe(1);
        });
        it('<th>s should match bindingNames length', function() {
            var theadList = this.element.querySelectorAll('thead');
            expect(this.element.html()).not.toContain('None');
            expect(theadList.length).toBe(1);
            var thead = theadList[0];
            expect(thead.querySelectorAll('th').length).toBe(sparqlManagerSvc.bindings.length);
        });
        it('<tr>s should match results length', function() {
            var tbodyList = this.element.querySelectorAll('tbody');
            expect(this.element.html()).not.toContain('None');
            expect(tbodyList.length).toBe(1);
            var tbody = tbodyList[0];
            expect(tbody.querySelectorAll('tr').length).toBe(sparqlManagerSvc.data.length);
        });
        it('shows error message if populated', function() {
            expect(this.element.find('error-display').length).toBe(0);

            sparqlManagerSvc.errorMessage = 'Error message';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('shows info message if populated', function() {
            expect(this.element.find('info-message').length).toBe(0);

            sparqlManagerSvc.infoMessage = 'Info message';
            scope.$digest();
            expect(this.element.find('info-message').length).toBe(1);
        });
    });
});