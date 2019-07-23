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
describe('Language Select component', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('shared');
        mockComponent('shared', 'customLabel');
        mockPropertyManager();
        injectHighlightFilter();
        injectTrustedFilter();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.bindModel = 'test';
        scope.changeEvent = jasmine.createSpy('changeEvent');
        scope.disableClear = false;
        scope.required = '';
        this.element = $compile(angular.element('<language-select bind-model="bindModel" change-event="changeEvent(value)" disable-clear="disableClear" required="required"></language-select>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('languageSelect');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove()
    });

    describe('controller bound variable', function() {
        it('bindModel should be one way bound', function() {
            this.controller.bindModel = 'different';
            scope.$apply();
            expect(scope.bindModel).toEqual('test');
        });
        it('disableClear should be one way bound', function() {
            this.controller.disableClear = true;
            scope.$apply();
            expect(scope.disableClear).toEqual(false);
        });
        it('changeEvent should be one way bound', function() {
            this.controller.changeEvent({value: 'test'});
            expect(scope.changeEvent).toHaveBeenCalledWith('test');
        });
        it('required should be one way bound', function() {
            this.controller.required = undefined;
            scope.$digest();
            expect(scope.required).toEqual('');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('LANGUAGE-SELECT');
            expect(this.element.querySelectorAll('.language-select').length).toEqual(1);
            expect(this.element.querySelectorAll('.form-group').length).toEqual(1);
        });
        ['custom-label', 'ui-select'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toEqual(1);
            });
        });
    });
    describe('controller methods', function() {
        it('clear properly sets the variable', function() {
            this.controller.clear();
            scope.$apply();
            expect(scope.changeEvent).toHaveBeenCalledWith(undefined);
        });
    });
    describe('check required attribute', function() {
        it('when present', function() {
            scope.required = '';
            this.controller.$onInit();
            expect(this.controller.isRequired).toEqual(true);
        });
        it('when missing', function() {
            this.controller.required = undefined;
            this.controller.$onInit();
            expect(this.controller.isRequired).toEqual(false);
        });
    });
});