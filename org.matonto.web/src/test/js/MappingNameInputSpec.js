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
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.name = '';
            scope.required = true;
            scope.isActive = true;
            scope.focusEvent = jasmine.createSpy('focusEvent');

            var form = $compile('<form></form>')(scope);
            this.element = angular.element('<mapping-name-input name="name" required="required" is-active="isActive" focus-event="focusEvent()"></mapping-name-input>');
            form.append(this.element);
            this.element = $compile(this.element)(scope);
            scope.$digest();
        });

        it('name should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.name = 'test';
            scope.$digest();
            expect(scope.name).toBe('test');
        });
        it('required should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.required = false;
            scope.$digest();
            expect(scope.required).toBe(false);
        });
        it('isActive should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.isActive = false;
            scope.$digest();
            expect(scope.isActive).toBe(false);
        });
        it('focusEvent should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.focusEvent();
            expect(scope.focusEvent).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            mappingManagerSvc.mappingIds = ['test'];
            scope.name = '';
            scope.required = true;
            scope.isActive = true;
            scope.focusEvent = jasmine.createSpy('focusEvent');

            var form = $compile('<form></form>')(scope);
            this.element = angular.element('<mapping-name-input name="name" required="required" is-active="isActive" focus-event="focusEvent()"></mapping-name-input>');
            form.append(this.element);
            this.element = $compile(this.element)(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('mapping-name-input')).toBe(true);
            expect(this.element.hasClass('form-group')).toBe(true);
        });
        it('with the correct classes based on the input field validity and active state', function() {
            expect(this.element.hasClass('has-error')).toBe(true);
            var isolatedScope = this.element.isolateScope();

            isolatedScope.name = 'a';
            scope.$digest();
            expect(this.element.hasClass('has-success')).toBe(true);

            isolatedScope.isActive = false;
            scope.$digest();
            expect(this.element.hasClass('has-success')).toBe(false);
            expect(this.element.hasClass('has-error')).toBe(false);
        });
        it('with an error for invalid characters', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.name = '$';
            scope.$digest();
            expect(isolatedScope.form.name.$error.pattern).toBe(true);
        });
        it('with an error if the input is a previous mapping id', function() {
            var isolatedScope = this.element.isolateScope();
            mappingManagerSvc.getMappingId.and.returnValue(mappingManagerSvc.mappingIds[0]);
            isolatedScope.name = mappingManagerSvc.mappingIds[0];
            scope.$digest();
            expect(isolatedScope.form.name.$error.uniqueName).toBe(true);
        });
        it('with an error if the input is longer than 50 characters', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.name = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
            scope.$digest();
            expect(isolatedScope.form.name.$error.maxlength).toBe(true);
        });
    });
    it('should not show an error if first name passed is a previous mapping id', function() {
        mappingManagerSvc.mappingIds = ['test'];
        scope.name = 'test';
        var form = $compile('<form></form>')(scope);
        var element = angular.element('<mapping-name-input name="name" required="required" is-active="isActive" focus-event="focusEvent()"></mapping-name-input>');
        form.append(element);
        element = $compile(element)(scope);
        scope.$digest();

        var isolatedScope = element.isolateScope();
        expect(isolatedScope.form.$valid).toBe(true);
    });
    it('should have the correct default values for isActive and required', function() {
        var form = $compile('<form></form>')(scope);
        var element = angular.element('<mapping-name-input name="name" required="required" is-active="isActive" focus-event="focusEvent()"></mapping-name-input>');
        form.append(element);
        element = $compile(element)(scope);
        scope.$digest();

        var isolatedScope = element.isolateScope();
        expect(isolatedScope.isActive).toBe(true);
        expect(isolatedScope.required).toBe(true);
    });
});