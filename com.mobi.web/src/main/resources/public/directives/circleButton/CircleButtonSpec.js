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
describe('Circle Button directive', function() {
    var $compile, scope, isolatedScope, element;

    beforeEach(function() {
        module('templates');
        module('circleButton');

        // To test out a directive, you need to inject $compile and $rootScope
        // and save them to use
        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.btnIcon = 'fa-square';
        scope.btnSmall = false;
        scope.displayText = 'text';

        // To create a copy of the directive, use the $compile(angular.element())($rootScope)
        // syntax
        element = $compile(angular.element('<circle-button btn-icon="btnIcon" btn-small="btnSmall" display-text="displayText"></circle-button>'))(scope);
        // This needs to be called explicitly if you change anything with the directive,
        // being either a variable change or a function call
        scope.$digest();

        isolatedScope = element.isolateScope();
    });

    describe('in isolated scope', function() {
        it('btnIcon should be one way bound', function() {
            isolatedScope.btnIcon = 'fa-square-o';
            scope.$digest();
            expect(scope.btnIcon).toEqual('fa-square');
        });
        it('btnSmall should be one way bound', function() {
            isolatedScope.btnSmall = true;
            scope.$digest();
            expect(scope.btnSmall).toEqual(false);
        });
        it('displayText should be one way bound', function() {
            isolatedScope.displayText = 'new';
            scope.$digest();
            expect(scope.displayText).toEqual('text');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for a button', function() {
            expect(element.prop('tagName')).toBe('BUTTON');
        });
        it('based on btnIcon', function() {
            var iconList = element.querySelectorAll('.' + scope.btnIcon);
            expect(iconList.length).toBe(1);
        });
        it('based on btnSmall', function() {
            expect(element.hasClass('small')).toBe(false);
            var isolatedScope = element.isolateScope();
            scope.btnSmall = true;
            scope.$digest();
            expect(element.hasClass('small')).toBe(true);
        });
    });
});