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
describe('Super Class Select component', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('ontology-editor');
        mockComponent('ontology-editor', 'ontologyClassSelect');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.bindModel = [];
        scope.changeEvent = jasmine.createSpy('changeEvent');
        this.element = $compile(angular.element('<super-class-select bind-model="bindModel" change-event="changeEvent(values)"></super-class-select>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('superClassSelect');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('bindModel should be one way bound', function() {
            this.controller.bindModel = [{'@id': 'test'}];
            scope.$apply();
            expect(scope.bindModel).toEqual([]);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('SUPER-CLASS-SELECT');
            expect(this.element.querySelectorAll('.super-class-select').length).toBe(1);
            expect(this.element.querySelectorAll('.advanced-language-select').length).toBe(1);
        });
        it('for correct links', function() {
            expect(this.element.querySelectorAll('.btn-link .fa-plus').length).toBe(1);
            expect(this.element.querySelectorAll('.btn-link .fa-times').length).toBe(0);
            this.controller.isShown = true;
            scope.$apply();
            expect(this.element.querySelectorAll('.btn-link .fa-plus').length).toBe(0);
            expect(this.element.querySelectorAll('.btn-link .fa-times').length).toBe(1);
        });
        it('with an ontology-class-select', function() {
            expect(this.element.find('ontology-class-select').length).toBe(0);
            this.controller.isShown = true;
            scope.$apply();
            expect(this.element.find('ontology-class-select').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        it('show sets the proper variables', function() {
            this.controller.show();
            expect(this.controller.isShown).toBe(true);
        });
        it('hide sets the proper variables', function() {
            this.controller.hide();
            expect(this.controller.isShown).toBe(false);
            expect(scope.changeEvent).toHaveBeenCalledWith([]);
        });
        it('onChange should call changeEvent', function() {
            this.controller.onChange(['test']);
            expect(scope.changeEvent).toHaveBeenCalledWith([{'@id': 'test'}]);
        });
    });
    it('correctly updates iris when the bindModel changes', function() {
        scope.bindModel = [{'@id': 'test'}];
        scope.$digest();
        expect(this.controller.iris).toEqual(['test']);
    });
});