/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
describe('Search Bar directive', function() {
    var $compile, scope, $timeout;

    beforeEach(function() {
        module('templates');
        module('shared');

        inject(function(_$compile_, _$rootScope_, _$timeout_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $timeout = _$timeout_;
        });

        scope.bindModal = '';
        scope.submitEvent = jasmine.createSpy('submitEvent');
        this.element = $compile(angular.element('<search-bar ng-model="bindModel" submit-event="submitEvent()"></search-bar>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('searchBar');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $timeout = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('bindModel should be two way bound', function() {
            this.controller.bindModel = 'test';
            scope.$digest();
            expect(scope.bindModel).toBe('test');
        });
        it('submitEvent should be called in parent scope when invoked', function() {
            this.controller.submitEvent();
            expect(scope.submitEvent).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('search-bar')).toBe(true);
            expect(this.element.hasClass('input-group')).toBe(true);
        });
        it('with an input', function() {
            expect(this.element.find('input').length).toBe(1);
        });
        it('with a .input-group-icon', function() {
            expect(this.element.querySelectorAll('.input-group-icon').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        it('should perform a search if the key pressed was ENTER', function() {
            this.controller.onKeyUp({});
            expect(scope.submitEvent).not.toHaveBeenCalled();

            this.controller.onKeyUp({keyCode: 13});
            expect(scope.submitEvent).toHaveBeenCalled();
        });
    });
});