/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
describe('SPARQL Result Block component', function() {
    var $compile, scope, sparqlManagerSvc, modalSvc;

    beforeEach(function() {
        module('templates');
        module('query');
        mockComponent('discover', 'sparqlResultTable');
        mockSparqlManager();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _sparqlManagerService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            sparqlManagerSvc = _sparqlManagerService_;
            modalSvc = _modalService_;
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
        this.element = $compile(angular.element('<sparql-result-block></sparql-result-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('sparqlResultBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        sparqlManagerSvc = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('contains correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('SPARQL-RESULT-BLOCK');
        });
        ['block', 'block-content', 'block-footer', 'sparql-result-table', 'paging'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toBe(1);
            });
        });
        it('with a download button', function() {
            expect(this.element.querySelectorAll('button.download-button').length).toBe(1);
        });
        it('depending on whether an error occurred error message', function() {
            expect(this.element.find('error-display').length).toBe(0);
            expect(this.element.find('pre').length).toBe(0);

            sparqlManagerSvc.errorMessage = 'Error message';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
            expect(this.element.find('pre').length).toBe(1);
        });
        it('depending on whether there is an info message', function() {
            expect(this.element.find('info-message').length).toBe(0);

            sparqlManagerSvc.infoMessage = 'Info message';
            scope.$digest();
            expect(this.element.find('info-message').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        it('should open the downloadQueryOverlay', function() {
            this.controller.downloadQuery();
            expect(modalSvc.openModal).toHaveBeenCalledWith('downloadQueryOverlay', {}, undefined, 'sm');
        });
        it('should run query with the specified page', function() {
            this.controller.query(10);
            expect(sparqlManagerSvc.currentPage).toEqual(10);
            expect(sparqlManagerSvc.queryRdf).toHaveBeenCalled();
        });
    });
});