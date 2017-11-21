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
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('moduleBox');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.backgroundColor = '#fff';
        scope.headerText = 'header';
        scope.iconName = 'icon';
        this.element = $compile(angular.element('<module-box background-color="backgroundColor" header-text="headerText" icon-name="iconName"></module-box>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        beforeEach(function () {
            this.isolatedScope = this.element.isolateScope();
        });
        it('props should be one way bound', function() {
            this.isolatedScope.backgroundColor = '#000';
            this.isolatedScope.headerText = 'isolated-header';
            this.isolatedScope.iconName = 'isolated-icon';
            scope.$digest();

            expect(scope.backgroundColor).toBe('#fff');
            expect(scope.headerText).toBe('header');
            expect(scope.iconName).toBe('icon');
        });
        it('isolated scope variables should match the scope variables', function() {
            expect(this.isolatedScope.backgroundColor).toBe(scope.backgroundColor);
            expect(this.isolatedScope.headerText).toBe(scope.headerText);
            expect(this.isolatedScope.iconName).toBe(scope.iconName);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for div tag', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
        });
        it('for class selectors', function() {
            var iconWrappers = this.element.querySelectorAll('.icon-wrapper');
            expect(iconWrappers.length).toBe(1);
            var headers = this.element.querySelectorAll('h2');
            expect(headers.length).toBe(1);
            var descriptions = this.element.querySelectorAll('.description');
            expect(descriptions.length).toBe(1);
        });
    });
});