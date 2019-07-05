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
describe('Advanced Language Select component', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('ontology-editor');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.bindModel = 'test';
        scope.changeEvent = jasmine.createSpy('changeEvent');
        this.element = $compile(angular.element('<advanced-language-select bind-model="bindModel" change-event="changeEvent(value)"></advanced-language-select>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('advancedLanguageSelect');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('bindModel should be one way bound', function() {
            this.controller.bindModel = 'different';
            scope.$apply();
            expect(scope.bindModel).toEqual('test');
        });
        it('changeEvent should be called in parent scope', function() {
            this.controller.changeEvent({value: 'test'});
            expect(scope.changeEvent).toHaveBeenCalledWith('test');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('ADVANCED-LANGUAGE-SELECT');
            expect(this.element.querySelectorAll('.advanced-language-select').length).toEqual(1);
        });
        it('for correct links', function() {
            expect(this.element.querySelectorAll('.btn-link .fa-plus').length).toEqual(1);
            expect(this.element.querySelectorAll('.btn-link .fa-times').length).toEqual(0);
            this.controller.isShown = true;
            scope.$apply();
            expect(this.element.querySelectorAll('.btn-link .fa-plus').length).toEqual(0);
            expect(this.element.querySelectorAll('.btn-link .fa-times').length).toEqual(1);
        });
        it('for language-select', function() {
            expect(this.element.find('language-select').length).toEqual(0);
            this.controller.isShown = true;
            scope.$apply();
            expect(this.element.find('language-select').length).toEqual(1);
        });
    });
    describe('controller methods', function() {
        it('show sets the proper variables', function() {
            this.controller.show();
            expect(this.controller.isShown).toEqual(true);
            expect(scope.changeEvent).toHaveBeenCalledWith('en');
        });
        it('hide sets the proper variables', function() {
            this.controller.hide();
            expect(this.controller.isShown).toEqual(false);
            expect(scope.changeEvent).toHaveBeenCalledWith(undefined);
        });
        it('onChange should call changeEvent', function() {
            this.controller.onChange('test');
            expect(scope.changeEvent).toHaveBeenCalledWith('test');
        });
    });
});