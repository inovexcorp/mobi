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
        element,
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
        element = $compile(angular.element('<sparql-result-table></sparql-result-table>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('sparql-result-table')).toBe(true);
        });
        it('with a block', function() {
            expect(element.find('block').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(element.find('block-content').length).toBe(1);
        });
        it('with a block-footer', function() {
            expect(element.find('block-footer').length).toBe(1);
        });
        it('with a table', function() {
            expect(element.querySelectorAll('table.table').length).toBe(1);
        });
        it('with a pagination', function() {
            expect(element.find('pagination').length).toBe(1);
        });
        it('with a download button', function() {
            expect(element.querySelectorAll('button.download-button').length).toBe(1);
        });
        it('depending on how many binding names there are', function() {
            var theadList = element.querySelectorAll('thead');
            expect(element.html()).not.toContain('None');
            expect(theadList.length).toBe(1);
            var thead = theadList[0];
            expect(thead.querySelectorAll('th').length).toBe(sparqlManagerSvc.bindings.length);
        });
        it('depending on how many results there are', function() {
            var tbodyList = element.querySelectorAll('tbody');
            expect(element.html()).not.toContain('None');
            expect(tbodyList.length).toBe(1);
            var tbody = tbodyList[0];
            expect(tbody.querySelectorAll('tr').length).toBe(sparqlManagerSvc.data.length);
        });
        it('depending on whether an error occurred error message', function() {
            expect(element.find('error-display').length).toBe(0);
            expect(element.find('pre').length).toBe(0);

            sparqlManagerSvc.errorMessage = 'Error message';
            scope.$digest();
            expect(element.find('error-display').length).toBe(1);
            expect(element.find('pre').length).toBe(1);
        });
        it('depending on whether there is an info message', function() {
            expect(element.find('info-message').length).toBe(0);

            sparqlManagerSvc.infoMessage = 'Info message';
            scope.$digest();
            expect(element.find('info-message').length).toBe(1);
        });
    });
});