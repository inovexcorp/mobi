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
describe('Keyword Select component', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('shared');
        mockComponent('shared', 'customLabel');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.bindModel = '';
        scope.hideLabel = false;
        scope.isFocusMe = false;
        scope.changeEvent = jasmine.createSpy('changeEvent');
        this.element = $compile(angular.element('<keyword-select bind-model="bindModel" hide-label="hideLabel" is-focus-me="isFocusMe" change-event="changeEvent(value)"></keyword-select>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('keywordSelect');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('bindModel is one way bound', function() {
            this.controller.bindModel = 'test';
            scope.$digest();
            expect(scope.bindModel).toEqual('');
        });
        it('changeEvent is called in the parent scope', function() {
            this.controller.changeEvent({value: 'Test'});
            expect(scope.changeEvent).toHaveBeenCalledWith('Test');
        });
        it('hideLabel is one way bound', function() {
            this.controller.hideLabel = true;
            scope.$digest();
            expect(scope.hideLabel).toBe(false);
        });
        it('isFocusMe is one way bound', function() {
            this.controller.isFocusMe = true;
            scope.$digest();
            expect(scope.isFocusMe).toBe(false);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('KEYWORD-SELECT');
            expect(this.element.querySelectorAll('.keyword-select').length).toEqual(1);
        });
        it('without a custom-label when hideLabel', function () {
            this.controller.hideLabel = true;
            scope.$digest();
            expect(this.element.find('custom-label').length).toBe(0);
        });
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toBe(1);
        });
    });
});
