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
describe('Text Area directive', function() {
    var $compile,
        scope;

    beforeEach(function() {
        module('templates');
        angular.module('customLabel', []);
        module('textArea');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.bindModel = '';
            scope.changeEvent = jasmine.createSpy('changeEvent');
            scope.displayText = '';
            scope.mutedText = '';
            scope.required = true;
            scope.textAreaName = '';

            this.element = $compile(angular.element('<text-area ng-model="bindModel" change-event="changeEvent()" display-text="displayText" muted-text="mutedText" required="required" text-area-name="textAreaName"></text-area>'))(scope);
            scope.$digest();
        });
        it('bindModel should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.bindModel = 'Test';
            scope.$digest();
            expect(scope.bindModel).toEqual('Test');
        });
        it('changeEvent should be called in parent scope when invoked', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.changeEvent();

            expect(scope.changeEvent).toHaveBeenCalled();
        });
        it('displayText should be one way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.displayText = 'Test';
            scope.$digest();
            expect(scope.displayText).toEqual('');
        });
        it('mutedText should be one way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.mutedText = 'Test';
            scope.$digest();
            expect(scope.mutedText).toEqual('');
        });
        it('required should be one way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.required = false;
            scope.$digest();
            expect(scope.required).toBe(true);
        });
        it('textAreaName should be one way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.textAreaName = 'Test';
            scope.$digest();
            expect(scope.textAreaName).toBe('');
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            scope.bindModel = '';
            scope.changeEvent = jasmine.createSpy('changeEvent');
            scope.displayText = '';
            scope.mutedText = '';

            this.element = $compile(angular.element('<text-area ng-model="bindModel" change-event="changeEvent()" display-text="displayText" muted-text="mutedText" required="required" text-area-name="textAreaName"></text-area>'))(scope);
            scope.$digest();
            this.firstChild = angular.element(this.element.children()[0]);
        });
        it('for wrapping containers', function() {
            expect(this.firstChild.hasClass('form-group')).toBe(true);
        });
        it('with a custom label', function() {
            expect(this.firstChild.find('custom-label').length).toBe(1);
        });
        it('with a textarea element', function() {
            expect(this.firstChild.find('textarea').length).toBe(1);
        });
        it('depending on whether it is required or not', function() {
            var textArea = angular.element(this.firstChild.find('textarea')[0]);
            expect(textArea.attr('required')).toBeFalsy();

            scope.required = true;
            scope.$digest();
            expect(textArea.attr('required')).toBeTruthy();
        });
    });
    it('should call changeEvent when the text in the textarea changes', function() {
        scope.bindModel = '';
        scope.changeEvent = jasmine.createSpy('changeEvent');
        var element = $compile(angular.element('<text-area ng-model="bindModel" change-event="changeEvent()" display-text="displayText" muted-text="mutedText" required="required" text-area-name="textAreaName"></text-area>'))(scope);
        scope.$digest();

        var input = angular.element(element.find('textarea')[0]);
        input.val('Test').triggerHandler('input');
        expect(scope.changeEvent).toHaveBeenCalled();
    });
});