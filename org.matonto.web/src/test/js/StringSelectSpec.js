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
describe('String Select directive', function() {
    var $compile,
        scope,
        element,
        $filter;

    injectHighlightFilter();
    injectTrustedFilter();
    injectSplitIRIFilter();

    beforeEach(function() {
        module('templates');
        module('stringSelect');
        mockOntologyManager();

        module(function($provide) {
            $provide.value('removeIriFromArrayFilter', jasmine.createSpy('removeIriFromArrayFilter').and.callFake(function(arr) {
                return arr;
            }));
        });

        inject(function(_$compile_, _$rootScope_, _$filter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $filter = _$filter_;
        });
    });

    beforeEach(function() {
        scope.bindModel = '';
        scope.changeEvent = jasmine.createSpy('changeEvent');
        scope.displayText = '';
        scope.selectList = [];
        scope.mutedText = '';

        element = $compile(angular.element('<string-select ng-model="bindModel" change-event="changeEvent" display-text="displayText" exclude-self="excludeSelf" select-list="selectList" muted-text="mutedText"></string-select>'))(scope);
        scope.$digest();
    });

    describe('in isolated scope', function() {
        it('displayText should be two way bound', function() {
            var isolatedScope = element.isolateScope();
            isolatedScope.displayText = 'new value';
            scope.$digest();
            expect(scope.displayText).toEqual('new value');
        });
        it('mutedText should be two way bound', function() {
            var isolatedScope = element.isolateScope();
            isolatedScope.mutedText = 'new value';
            scope.$digest();
            expect(scope.mutedText).toEqual('new value');
        });
        it('selectList should be two way bound', function() {
            var isolatedScope = element.isolateScope();
            isolatedScope.selectList = ['new value'];
            scope.$digest();
            expect(scope.selectList).toEqual(['new value']);
        });
    });
    describe('controller bound variables', function() {
        it('bindModel should be two way bound', function() {
            var controller = element.controller('stringSelect');
            controller.bindModel = 'new value';
            scope.$digest();
            expect(scope.bindModel).toBe('new value');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for a DIV', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('has form-group class', function() {
            expect(element.hasClass('form-group')).toBe(true);
        });
        it('based on custom-label', function() {
            var items = element.querySelectorAll('custom-label');
            expect(items.length).toBe(1);
        });
        it('based on ui-select', function() {
            var items = element.querySelectorAll('ui-select');
            expect(items.length).toBe(1);
        });
    });
});