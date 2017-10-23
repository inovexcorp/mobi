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
describe('SPARQL Result Block directive', function() {
    var $compile, scope, element, sparqlManagerSvc;

    beforeEach(function() {
        module('templates');
        module('sparqlResultBlock');
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
        element = $compile(angular.element('<sparql-result-block></sparql-result-block>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('sparql-result-block')).toBe(true);
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
        it('with a sparql-result-table', function() {
            expect(element.find('sparql-result-table').length).toBe(1);
        });
        it('with a pagination', function() {
            expect(element.find('pagination').length).toBe(1);
        });
        it('with a download button', function() {
            expect(element.querySelectorAll('button.download-button').length).toBe(1);
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