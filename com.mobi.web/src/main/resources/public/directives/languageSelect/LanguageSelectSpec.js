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
describe('Language Select directive', function() {
    var $compile, scope, propertyManagerSvc;

    beforeEach(function() {
        module('templates');
        module('languageSelect');
        mockPropertyManager();
        injectHighlightFilter();
        injectTrustedFilter();

        inject(function(_$compile_, _$rootScope_, _propertyManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            propertyManagerSvc = _propertyManagerService_;
        });

        scope.bindModel = 'test';
    });

    beforeEach(function compile() {
        this.compile = function(html) {
            if (!html) {
                html = '<language-select ng-model="bindModel"></language-select>';
            }
            this.element = $compile(angular.element(html))(scope);
            scope.$digest();
            this.controller = this.element.controller('languageSelect');
            this.isolatedScope = this.element.isolateScope();
        };
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        propertyManagerSvc = null;
        this.element.remove()
    });

    describe('controller bound variable', function() {
        beforeEach(function() {
            this.compile();
        });
        it('bindModel should be two way bound', function() {
            this.controller.bindModel = 'different';
            scope.$apply();
            expect(scope.bindModel).toEqual('different');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.compile();
        });
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('language-select')).toBe(true);
            expect(this.element.hasClass('form-group')).toBe(true);
        });
        it('with a custom-label', function() {
            expect(this.element.find('custom-label').length).toBe(1);
        });
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            this.compile();
        });
        it('clear properly sets the variable', function() {
            this.controller.clear();
            scope.$apply();
            expect(scope.bindModel).toBeUndefined();
        });
    });
    describe('check required attribute', function() {
        it('when present', function() {
            this.compile('<language-select ng-model="bindModel" required></language-select>');
            expect(this.isolatedScope.required).toBe(true);
        });
        it('when missing', function() {
            this.compile();
            expect(this.isolatedScope.required).toBe(false);
        });
    });
});