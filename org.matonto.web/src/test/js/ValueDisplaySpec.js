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
describe('Value Display directive', function() {
    var $compile, scope, element, isolatedScope;

    beforeEach(function() {
        module('templates');
        module('valueDisplay');
        injectPrefixationFilter();
        mockUtil();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
        
        scope.value = {'@id': 'new'};
        element = $compile(angular.element('<value-display value="value"></value-display>'))(scope);
        scope.$digest();
        isolatedScope = element.isolateScope();
        controller = element.controller('valueDisplay');
    });

    describe('in isolated scope', function() {
        it('value should be one way bound', function() {
            isolatedScope.value = {'@id': 'different'};
            scope.$digest();
            expect(scope.value).toEqual({'@id': 'new'});
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('SPAN');
            expect(element.hasClass('value-display')).toBe(true);
        });
        it('with a .has-id', function() {
            expect(element.querySelectorAll('.has-id').length).toBe(1);

            scope.value = {};
            scope.$apply();

            expect(element.querySelectorAll('.has-id').length).toBe(0);
        });
        it('with a .has-value', function() {
            expect(element.querySelectorAll('.has-value').length).toBe(0);

            scope.value = {'@value': 'value'};
            scope.$apply();

            expect(element.querySelectorAll('.has-value').length).toBe(1);
        });
        it('with a .text-muted.lang-display', function() {
            expect(element.querySelectorAll('.text-muted.lang-display').length).toBe(0);

            scope.value = {'@value': 'value', '@language': 'en'};
            scope.$apply();

            expect(element.querySelectorAll('.text-muted.lang-display').length).toBe(1);
        });
        it('with a .text-muted.type-display', function() {
            expect(element.querySelectorAll('.text-muted.type-display').length).toBe(0);

            scope.value = {'@value': 'value', '@type': 'type'};
            scope.$apply();

            expect(element.querySelectorAll('.text-muted.type-display').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('has should return', function() {
            var obj = {prop: 'value'};
            it('true when property is present', function() {
                expect(controller.has(obj, 'prop')).toBe(true);
            });
            it('false when property is not present', function() {
                expect(controller.has(obj, 'missing')).toBe(false);
            });
        });
    });
});