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
describe('Block search directive', function() {
    var $compile,
        element,
        controller,
        isolatedScope,
        scope;

    beforeEach(function() {
        module('templates');
        module('blockSearch');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.keyupEvent = jasmine.createSpy('keyupEvent');
        scope.clearEvent = jasmine.createSpy('clearEvent');
        scope.bindModel = '';

        var parent = $compile('<div></div>')(scope);
        parent.data('$blockController', {});
        element = angular.element('<block-search ng-model="bindModel" keyup-event="keyupEvent()" clear-event="clearEvent()"></block-search>');
        parent.append(element);
        element = $compile(element)(scope);
        scope.$digest();
    });
    describe('in isolated scope', function() {
        beforeEach(function() {
            isolatedScope = element.isolateScope();
        });
        it('bindModel should be two way bound', function() {
            isolatedScope.bindModel = 'test';
            scope.$digest();
            expect(scope.bindModel).toBe('test');
        })
        it('keyupEvent should be called in parent scope when invoked', function() {
            isolatedScope.keyupEvent();
            expect(scope.keyupEvent).toHaveBeenCalled();
        });
        it('clearEvent should be called in parent scope when invoked', function() {
            isolatedScope.clearEvent();
            expect(scope.clearEvent).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        it('for a DIV tag', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on .search', function() {
            expect(element.hasClass('search')).toBe(true);
        });
        it('based on i', function() {
            expect(element.find('i').length).toBe(1);
        });
        it('based on .fa-search', function() {
            expect(element.querySelectorAll('.fa-search').length).toBe(1);
        });
        it('based on input', function() {
            expect(element.find('input').length).toBe(1);
        });
        it('based on a', function() {
            expect(element.find('a').length).toBe(1);
        });
        it('based on .fa-times-circle', function() {
            expect(element.querySelectorAll('.fa-times-circle').length).toBe(1);
        });
    });
});