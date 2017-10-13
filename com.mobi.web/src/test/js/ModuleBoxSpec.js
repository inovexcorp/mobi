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
describe('Module Box directive', function() {
    var $compile,
        scope,
        element;

    beforeEach(function() {
        module('templates');
        module('moduleBox');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.backgroundColor = '#fff';
            scope.headerText = 'header';
            scope.iconName = 'icon';

            element = $compile(angular.element('<module-box background-color="backgroundColor" header-text="headerText" icon-name="iconName"></module-box>'))(scope);
            scope.$digest();
        });

        it('props should be one way bound', function() {
            var isolatedScope = element.isolateScope();
            isolatedScope.backgroundColor = '#000';
            isolatedScope.headerText = 'isolated-header';
            isolatedScope.iconName = 'isolated-icon';
            scope.$digest();

            expect(scope.backgroundColor).toBe('#fff');
            expect(scope.headerText).toBe('header');
            expect(scope.iconName).toBe('icon');
        });
        it('isolated scope variables should match the scope variables', function() {
            var isolatedScope = element.isolateScope();
            expect(isolatedScope.backgroundColor).toBe(scope.backgroundColor);
            expect(isolatedScope.headerText).toBe(scope.headerText);
            expect(isolatedScope.iconName).toBe(scope.iconName);
        });
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.backgroundColor = '#fff';
            scope.headerText = 'header';
            scope.iconName = 'icon';

            element = $compile(angular.element('<module-box background-color="backgroundColor" header-text="headerText" icon-name="iconName"></module-box>'))(scope);
            scope.$digest();
        });
        it('for div tag', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('for class selectors', function() {
            var iconWrappers = element.querySelectorAll('.icon-wrapper');
            expect(iconWrappers.length).toBe(1);
            var headers = element.querySelectorAll('h2');
            expect(headers.length).toBe(1);
            var descriptions = element.querySelectorAll('.description');
            expect(descriptions.length).toBe(1);
        });
    });
});