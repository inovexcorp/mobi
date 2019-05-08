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
describe('Breadcrumbs component', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('shared');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.items = ['', ''];
        scope.onClick = jasmine.createSpy('onClick');
        this.element = $compile(angular.element('<breadcrumbs items="items" on-click="onClick()"></breadcrumbs>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('breadcrumbs');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('items should be one way bound', function() {
            this.controller.items = [];
            scope.$digest();
            expect(scope.items).toEqual(['', '']);
        });
        it('onClick to be called in parent scope', function() {
            this.controller.onClick();
            expect(scope.onClick).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('BREADCRUMBS');
            expect(this.element.querySelectorAll('ol.breadcrumbs').length).toEqual(1);
            expect(this.element.querySelectorAll('.breadcrumb').length).toEqual(1);
        });
        it('depending on how many entities are in the path', function() {
            expect(this.element.find('li').length).toEqual(2);
        });
        it('depending on whether an entity is the last in the list', function() {
            var items = this.element.find('li');

            var firstItem = angular.element(items[0]);
            expect(firstItem.hasClass('active')).toEqual(false);
            expect(firstItem.find('span').length).toEqual(0);
            expect(firstItem.find('a').length).toEqual(1);

            var secondItem = angular.element(items[1]);
            expect(secondItem.hasClass('active')).toEqual(true);
            expect(secondItem.find('span').length).toEqual(1);
            expect(secondItem.find('a').length).toEqual(0);
        });
    });
});