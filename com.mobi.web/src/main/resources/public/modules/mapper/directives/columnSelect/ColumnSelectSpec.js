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
describe('Column Select directive', function() {
    var $compile,
        scope,
        element,
        isolatedScope,
        controller,
        delimitedManagerSvc;

    beforeEach(function() {
        module('templates');
        module('columnSelect');
        mockDelimitedManager();
        injectTrustedFilter();
        injectHighlightFilter();

        inject(function(_$compile_, _$rootScope_, _delimitedManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            delimitedManagerSvc = _delimitedManagerService_;
        });

        scope.columns = [];
        scope.selectedColumn = '';
        delimitedManagerSvc.dataRows = [[]];
        element = $compile(angular.element('<column-select columns="columns" selected-column="selectedColumn"></column-select>'))(scope);
        scope.$digest();
        isolatedScope = element.isolateScope();
        controller = element.controller('columnSelect');
    });

    describe('controller bound variable', function() {
        it('selectedColumn should be two way bound', function() {
            controller.selectedColumn = '0';
            scope.$digest();
            expect(scope.selectedColumn).toEqual('0');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('column-select')).toBe(true);
        });
        it('with a column select', function() {
            expect(element.find('ui-select').length).toBe(1);
        });
        it('with a .help-block', function() {
            expect(element.querySelectorAll('.help-block').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        it('should test whether the header for a column index matches', function() {
            delimitedManagerSvc.getHeader.and.returnValue('a');
            var tests = [{expected: 'a', result: true}, {expected: 'A', result: true}, {expected: 'b', result: false}];
            _.forEach(tests, function(test) {
                expect(controller.compare('0', test.expected)).toBe(test.result);
                expect(delimitedManagerSvc.getHeader).toHaveBeenCalledWith('0');
            });
        });
        it('should get a preview of a column value', function() {
            delimitedManagerSvc.dataRows = [['first'], ['second']];
            controller.selectedColumn = '0';
            expect(controller.getValuePreview()).toBe('second');
            delimitedManagerSvc.containsHeaders = false;
            expect(controller.getValuePreview()).toBe('first');
        });
    });
});