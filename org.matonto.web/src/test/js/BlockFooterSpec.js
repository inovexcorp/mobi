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
describe('Block footer directive', function() {
    var $compile,
        element,
        controller,
        isolatedScope,
        scope;

    beforeEach(function() {
        module('templates');
        module('blockFooter');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.linkText = 'text';
        scope.linkEvent = jasmine.createSpy('linkEvent');

        var parent = $compile('<div></div>')(scope);
        parent.data('$blockController', {});
        element = angular.element('<block-footer link-event="linkEvent()" link-text="linkText"></block-footer>');
        parent.append(element);
        element = $compile(element)(scope);
        scope.$digest();
    });
    describe('in isolated scope', function() {
        beforeEach(function() {
            isolatedScope = element.isolateScope();
        });
        it('linkEvent should be called in parent scope when invoked', function() {
            isolatedScope.linkEvent();
            expect(scope.linkEvent).toHaveBeenCalled();
        });
        it('linkText should be one way bound', function() {
            isolatedScope.linkText = 'new';
            scope.$digest();
            expect(scope.linkText).toEqual('text');
        });
    });
    describe('contains the correct html', function() {
        it('for a DIV tag', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on .footer', function() {
            expect(element.hasClass('footer')).toBe(true);
        });
        it('based on a', function() {
            expect(element.find('a').length).toBe(1);
        });
        it('based on i', function() {
            expect(element.find('i').length).toBe(1);
        });
        it('based on span', function() {
            expect(element.find('span').length).toBe(1);
        });
    });
});
