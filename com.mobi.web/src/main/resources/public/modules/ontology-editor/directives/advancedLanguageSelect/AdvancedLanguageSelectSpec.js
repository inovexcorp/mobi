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
describe('Advanced Language Select directive', function() {
    var $compile, scope, element, controller;

    beforeEach(function() {
        module('templates');
        module('advancedLanguageSelect');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.bindModel = 'test';
        element = $compile(angular.element('<advanced-language-select ng-model="bindModel"></advanced-language-select>'))(scope);
        scope.$digest();
        controller = element.controller('advancedLanguageSelect');
    });

    describe('controller bound variable', function() {
        it('bindModel should be two way bound', function() {
            controller.bindModel = 'different';
            scope.$apply();
            expect(scope.bindModel).toEqual('different');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('advanced-language-select')).toBe(true);
        });
        it('for correct links', function() {
            expect(element.querySelectorAll('.btn-link .fa-plus').length).toBe(1);
            expect(element.querySelectorAll('.btn-link .fa-times').length).toBe(0);
            controller.isShown = true;
            scope.$apply();
            expect(element.querySelectorAll('.btn-link .fa-plus').length).toBe(0);
            expect(element.querySelectorAll('.btn-link .fa-times').length).toBe(1);
        });
        it('for language-select', function() {
            expect(element.find('language-select').length).toBe(0);
            controller.isShown = true;
            scope.$apply();
            expect(element.find('language-select').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        it('show sets the proper variables', function() {
            controller.show();
            expect(controller.isShown).toBe(true);
            expect(controller.bindModel).toBe('en');
        });
        it('hide sets the proper variables', function() {
            controller.hide();
            expect(controller.isShown).toBe(false);
            expect(controller.bindModel).toBeUndefined();
        });
    });
});