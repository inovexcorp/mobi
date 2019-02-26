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
describe('Search Bar component', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('shared');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.bindModel = '';
        scope.changeEvent = jasmine.createSpy('changeEvent');
        scope.submitEvent = jasmine.createSpy('submitEvent');
        this.element = $compile(angular.element('<search-bar bind-model="bindModel" change-event="changeEvent(value)" submit-event="submitEvent()"></search-bar>'))(scope);
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
        it('bindModel should be one way bound', function() {
            this.controller.bindModel = 'test';
            scope.$digest();
            expect(scope.bindModel).toEqual('');
        });
        it('changeEvent should be called in parent scope', function() {
            this.controller.changeEvent({value: 'Test'});
            expect(scope.changeEvent).toHaveBeenCalledWith('Test');
        });
        it('submitEvent should be called in parent scope', function() {
            this.controller.submitEvent();
            expect(scope.submitEvent).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('SEARCH-BAR');
            expect(this.element.querySelectorAll('.search-bar').length).toEqual(1);
            expect(this.element.querySelectorAll('.input-group').length).toEqual(1);
        });
        it('with an input', function() {
            expect(this.element.find('input').length).toEqual(1);
        });
        it('with a .input-group-icon', function() {
            expect(this.element.querySelectorAll('.input-group-icon').length).toEqual(1);
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
    it('should call changeEvent when the text in the input changes', function() {
        var input = this.element.find('input');
        input.val('Test').triggerHandler('input');
        expect(scope.changeEvent).toHaveBeenCalledWith('Test');
    });
});