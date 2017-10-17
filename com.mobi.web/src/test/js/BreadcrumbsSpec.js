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
describe('Breadcrumbs directive', function() {
    var $compile, scope, element, discoverStateSvc, controller, isolatedScope;

    beforeEach(function() {
        module('templates');
        module('breadcrumbs');
        mockDiscoverState();

        inject(function(_$compile_, _$rootScope_, _discoverStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
        });

        scope.items = ['', ''];
        scope.onClick = jasmine.createSpy('onClick');
        element = $compile(angular.element('<breadcrumbs items="items" on-click="onClick()"></breadcrumbs>'))(scope);
        scope.$digest();
        controller = element.controller('breadcrumbs');
        isolatedScope = element.isolateScope();
    });

    describe('in isolated scope', function() {
        it('items should be one way bound', function() {
            isolatedScope.items = [];
            scope.$digest();
            expect(scope.items).toEqual(['', '']);
        });
        it('onClick to be called in parent scope', function() {
            isolatedScope.onClick();
            expect(scope.onClick).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('OL');
            expect(element.hasClass('breadcrumbs')).toBe(true);
            expect(element.hasClass('breadcrumb')).toBe(true);
        });
        it('depending on how many entities are in the path', function() {
            expect(element.find('li').length).toBe(2);
        });
        it('depending on whether an entity is the last in the list', function() {
            var items = element.find('li');
            
            var firstItem = angular.element(items[0]);
            expect(firstItem.hasClass('active')).toBe(false);
            expect(firstItem.find('span').length).toBe(0);
            expect(firstItem.find('a').length).toBe(1);
            
            var secondItem = angular.element(items[1]);
            expect(secondItem.hasClass('active')).toBe(true);
            expect(secondItem.find('span').length).toBe(1);
            expect(secondItem.find('a').length).toBe(0);
        });
    });
});