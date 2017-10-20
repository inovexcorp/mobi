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
    var $compile, scope;

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
        this.element = angular.element('<block-search ng-model="bindModel" keyup-event="keyupEvent()" clear-event="clearEvent()"></block-search>');
        parent.append(this.element);
        this.element = $compile(this.element)(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            this.isolatedScope = this.element.isolateScope();
        });
        it('bindModel should be two way bound', function() {
            this.isolatedScope.bindModel = 'test';
            scope.$digest();
            expect(scope.bindModel).toBe('test');
        })
        it('keyupEvent should be called in parent scope when invoked', function() {
            this.isolatedScope.keyupEvent();
            expect(scope.keyupEvent).toHaveBeenCalled();
        });
        it('clearEvent should be called in parent scope when invoked', function() {
            this.isolatedScope.clearEvent();
            expect(scope.clearEvent).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        it('for a DIV tag', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
        });
        it('based on .search', function() {
            expect(this.element.hasClass('search')).toBe(true);
        });
        it('based on i', function() {
            expect(this.element.find('i').length).toBe(1);
        });
        it('based on .fa-search', function() {
            expect(this.element.querySelectorAll('.fa-search').length).toBe(1);
        });
        it('based on input', function() {
            expect(this.element.find('input').length).toBe(1);
        });
        it('based on a', function() {
            expect(this.element.find('a').length).toBe(1);
        });
        it('based on .fa-times-circle', function() {
            expect(this.element.querySelectorAll('.fa-times-circle').length).toBe(1);
        });
    });
});