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
describe('Mapping Name Input directive', function() {
    var $compile,
        scope,
        element,
        mappingManagerSvc;

    beforeEach(function() {
        module('templates');
        module('mappingNameInput');
        injectRegexConstant();
        mockMappingManager();

        inject(function(_$compile_, _$rootScope_, _mappingManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mappingManagerSvc = _mappingManagerService_;
        });

        mappingManagerSvc.mappingIds = ['test'];
        scope.name = '';
        scope.required = true;
        scope.isActive = true;
        scope.focusEvent = jasmine.createSpy('focusEvent');
        var form = $compile('<form></form>')(scope);
        element = angular.element('<mapping-name-input name="name" required="required" is-active="isActive" focus-event="focusEvent()"></mapping-name-input>');
        form.append(element);
        element = $compile(element)(scope);
        scope.$digest();
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            this.isolatedScope = element.isolateScope();
        });
        it('name should be two way bound', function() {
            this.isolatedScope.name = 'test1';
            scope.$digest();
            expect(scope.name).toBe('test1');
        });
        it('required should be one way bound', function() {
            this.isolatedScope.required = false;
            scope.$digest();
            expect(scope.required).toBe(true);
        });
        it('isActive should be one way bound', function() {
            this.isolatedScope.isActive = false;
            scope.$digest();
            expect(scope.isActive).toBe(true);
        });
        it('focusEvent should be called in the parent scope', function() {
            this.isolatedScope.focusEvent();
            expect(scope.focusEvent).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('mapping-name-input')).toBe(true);
            expect(element.hasClass('form-group')).toBe(true);
        });
        it('with the correct classes based on the input field validity and active state', function() {
            var isolatedScope = element.isolateScope();
            isolatedScope.form.name.$touched = true;
            scope.$digest();
            expect(element.hasClass('has-error')).toBe(true);

            isolatedScope.name = 'a';
            scope.$digest();
            expect(element.hasClass('has-success')).toBe(true);

            isolatedScope.isActive = false;
            scope.$digest();
            expect(element.hasClass('has-success')).toBe(false);
            expect(element.hasClass('has-error')).toBe(false);
        });
        it('depending on whether it is required', function() {
            expect(element.querySelectorAll('.help-block').length).toBe(1);

            scope.required = false;
            scope.$digest();
            expect(element.querySelectorAll('.help-block').length).toBe(0);
        });
        it('with an error for invalid characters', function() {
            var isolatedScope = element.isolateScope();
            isolatedScope.name = '$';
            scope.$digest();
            expect(isolatedScope.form.name.$error.pattern).toBe(true);
        });
        it('with an error if the input is a previous mapping id', function() {
            var isolatedScope = element.isolateScope();
            mappingManagerSvc.getMappingId.and.returnValue(mappingManagerSvc.mappingIds[0]);
            isolatedScope.name = mappingManagerSvc.mappingIds[0];
            scope.$digest();
            expect(isolatedScope.form.name.$error.uniqueName).toBe(true);
        });
        it('with an error if the input is longer than 50 characters', function() {
            var isolatedScope = element.isolateScope();
            isolatedScope.name = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
            scope.$digest();
            expect(isolatedScope.form.name.$error.maxlength).toBe(true);
        });
    });
    it('should not show an error if first name passed is a previous mapping id', function() {
        scope.name = 'test';
        var form = $compile('<form></form>')(scope);
        element = angular.element('<mapping-name-input name="name" required="required" is-active="isActive" focus-event="focusEvent()"></mapping-name-input>');
        form.append(element);
        element = $compile(element)(scope);
        scope.$digest();

        var isolatedScope = element.isolateScope();
        expect(isolatedScope.form.$valid).toBe(true);
    });
    it('should have the correct default values for isActive and required', function() {
        var isolatedScope = element.isolateScope();
        expect(isolatedScope.isActive).toBe(true);
        expect(isolatedScope.required).toBe(true);
    });
});