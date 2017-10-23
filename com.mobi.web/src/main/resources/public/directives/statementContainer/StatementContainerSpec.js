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
describe('Statement Container directive', function() {
    var $compile, element, scope;

    beforeEach(function() {
        module('templates');
        module('statementContainer');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        element = $compile(angular.element('<statement-container></statement-container>'))(scope);
        scope.$digest();
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('statement-container')).toBe(true);
        });
        it('without a p', function() {
            expect(element.find('p').length).toBe(0);
        });
        it('with a p when additions attribute is set', function() {
            element = $compile(angular.element('<statement-container additions></statement-container>'))(scope);
            scope.$digest();
            expect(element.find('p').length).toBe(1);
            expect(angular.element(element.find('p')[0]).text()).toBe('Added Statements:');
        });
        it('with a p when deletions attribute is set', function() {
            element = $compile(angular.element('<statement-container deletions></statement-container>'))(scope);
            scope.$digest();
            expect(element.find('p').length).toBe(1);
            expect(angular.element(element.find('p')[0]).text()).toBe('Deleted Statements:');
        });
        it('with a table', function() {
            expect(element.find('table').length).toBe(1);
        });
        it('with a tbody', function() {
            expect(element.find('tbody').length).toBe(1);
        });
    });
});
