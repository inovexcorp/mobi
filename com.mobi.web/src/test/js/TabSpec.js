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
describe('Tab directive', function() {
    var $compile,
        element,
        elementSansWrapper,
        isolatedScope,
        scope;

    beforeEach(function() {
        module('templates');
        module('tab');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.active = true;
        scope.heading = '';
        scope.isLast = false;
        scope.marked = true;
        scope.onClick = jasmine.createSpy('onClick');
        scope.onClose = jasmine.createSpy('onClose');

        var parent = $compile('<div></div>')(scope);
        parent.data('$tabsetController', {
            addTab: jasmine.createSpy('addTab'),
            removeTab: jasmine.createSpy('removeTab')
        });
        element = angular.element('<div><tab active="active" heading="heading" is-last="isLast" marked="marked" on-click="onClick()" on-close="onClose()"></tab></div>');
        parent.append(element);
        element = $compile(element)(scope);
        scope.$digest();
        elementSansWrapper = angular.element(element.children()[0]);
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            isolatedScope = elementSansWrapper.scope();
        });
        /*it('active should be two way bound', function() {
            isolatedScope.active = false;
            scope.$digest();
            expect(scope.active).toEqual(false);
        });*/
        it('heading should be one way bound', function() {
            isolatedScope.heading = 'new';
            scope.$digest();
            expect(scope.heading).toEqual('');
        });
        it('isLast should be one way bound', function() {
            isolatedScope.isLast = true;
            scope.$digest();
            expect(scope.isLast).toEqual(false);
        });
        it('marked should be one way bound', function() {
            isolatedScope.marked = false;
            scope.$digest();
            expect(scope.marked).toEqual(true);
        });
        it('onClick should be called in parent scope when invoked', function() {
            isolatedScope.onClick();
            expect(scope.onClick).toHaveBeenCalled();
        });
        it('onClose should be called in parent scope when invoked', function() {
            isolatedScope.onClose();
            expect(scope.onClose).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        it('for a DIV tag', function() {
            expect(elementSansWrapper.prop('tagName')).toBe('DIV');
        });
        it('based on .tab', function() {
            expect(elementSansWrapper.hasClass('tab')).toBe(true);
        });
    });
});
