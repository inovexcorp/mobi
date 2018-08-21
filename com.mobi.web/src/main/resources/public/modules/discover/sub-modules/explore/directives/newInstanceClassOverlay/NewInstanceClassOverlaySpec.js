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
describe('New Instance Property Overlay directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('newInstanceClassOverlay');
        mockUtil();

        inject(function(_$q_, _$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
        scope.onCancel = jasmine.createSpy('onCancel');
        scope.onSubmit = jasmine.createSpy('onSubmit');
        scope.classes = [{id: 'test'}, {id: 'blah'}];
        this.element = $compile(angular.element('<new-instance-class-overlay on-cancel="onCancel()" on-submit="onSubmit()" classes="classes"></new-instance-class-overlay>'))(scope);
        scope.$digest();
        this.isolatedScope = this.element.isolateScope();
        this.controller = this.element.controller('newInstanceClassOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variables', function() {
        it('onCancel should be called in parent scope when invoked', function() {
            this.isolatedScope.onCancel();
            expect(scope.onCancel).toHaveBeenCalled();
        });
        it('onSubmit should be called in parent scope when invoked', function() {
            this.isolatedScope.onSubmit();
            expect(scope.onSubmit).toHaveBeenCalled();
        });
        it('classes should be one way bound', function() {
            this.isolatedScope.classes = [];
            scope.$digest();
            expect(scope.classes).toEqual([{id: 'test'}, {id: 'blah'}]);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('new-instance-class-overlay')).toBe(true);
            expect(this.element.hasClass('overlay')).toBe(true);
        });
        it('with a form', function() {
            expect(this.element.find('form').length).toBe(1);
        });
        it('with a h6', function() {
            expect(this.element.find('h6').length).toBe(1);
        });
        it('with a .main', function() {
            expect(this.element.querySelectorAll('.main').length).toBe(1);
        });
        it('with a p', function() {
            expect(this.element.find('p').length).toBe(1);
        });
        it('with a md-autocomplete', function() {
            expect(this.element.find('md-autocomplete').length).toBe(1);
        });
        it('with a .btn-container.clearfix', function() {
            expect(this.element.querySelectorAll('.btn-container.clearfix').length).toBe(1);
        });
        it('with a .btn-primary', function() {
            expect(this.element.querySelectorAll('.btn-primary').length).toBe(1);
        });
        it('with a regular .btn', function() {
            expect(this.element.querySelectorAll('.btn:not(.btn-primary)').length).toBe(1);
        });
        it('depending on whether the selected class is deprecated', function() {
            var button = angular.element(this.element.querySelectorAll('.btn.btn-primary')[0]);
            expect(this.element.find('error-display').length).toEqual(0);
            expect(button.attr('disabled')).toBeFalsy();

            this.controller.selectedClass = {deprecated: true};
            scope.$digest();
            expect(this.element.find('error-display').length).toEqual(1);
            expect(button.attr('disabled')).toBeTruthy();
        });
    });
    describe('controller methods', function() {
        it('should get filtered classes', function() {
            expect(this.controller.getClasses('test')).toEqual([{id: 'test'}]);
            expect(this.controller.getClasses('TE')).toEqual([{id: 'test'}]);
            expect(this.controller.getClasses('')).toEqual([{id: 'test'}, {id: 'blah'}]);
        });
    });
});