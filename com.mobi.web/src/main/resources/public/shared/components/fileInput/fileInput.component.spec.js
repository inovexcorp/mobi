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
describe('File Input component', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('shared');
        mockComponent('shared', 'customLabel');
        mockComponent('shared', 'fileChange');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.bindModel = undefined;
        scope.displayText = '';
        scope.helpText = '';
        scope.accept = '';
        scope.inputName = '';
        scope.changeEvent = jasmine.createSpy('changeEvent');
        scope.multiple = '';
        scope.required = '';
        this.element = $compile(angular.element('<file-input bind-model="bindModel" display-text="displayText" help-text="helpText" accept="accept" input-name="inputName" change-event="changeEvent(value)" multiple="multiple" required="required"></file-input>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('fileInput');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('bindModel should be one way bound', function() {
            this.controller.bindModel = {};
            scope.$digest();
            expect(scope.bindModel).toBeUndefined();
        });
        it('displayText should be one way bound', function() {
            this.controller.displayText = 'Test';
            scope.$digest();
            expect(scope.displayText).toEqual('');
        });
        it('helpText should be one way bound', function() {
            this.controller.helpText = 'Test';
            scope.$digest();
            expect(scope.helpText).toEqual('');
        });
        it('accept should be one way bound', function() {
            this.controller.accept = 'Test';
            scope.$digest();
            expect(scope.accept).toEqual('');
        });
        it('inputName should be one way bound', function() {
            this.controller.inputName = 'Test';
            scope.$digest();
            expect(scope.inputName).toEqual('');
        });
        it('multiple should be one way bound', function() {
            this.controller.multiple = undefined;
            scope.$digest();
            expect(scope.multiple).toEqual('');
        });
        it('required should be one way bound', function() {
            this.controller.required = undefined;
            scope.$digest();
            expect(scope.required).toEqual('');
        });
        it('changeEvent is called in the parent scope', function() {
            this.controller.changeEvent({value: []});
            expect(scope.changeEvent).toHaveBeenCalledWith([]);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping contains', function() {
            expect(this.element.prop('tagName')).toEqual('FILE-INPUT');
            expect(this.element.querySelectorAll('input[type="file"]').length).toEqual(1);
        });
        it('if displayText was provided', function() {
            expect(this.element.find('custom-label').length).toEqual(0);

            this.controller.displayText = 'Test';
            scope.$digest();
            expect(this.element.find('custom-label').length).toEqual(1);
        });
        it('if helpText was provided', function() {
            expect(this.element.querySelectorAll('.form-text').length).toEqual(0);

            this.controller.helpText = 'Test';
            scope.$digest();
            expect(this.element.querySelectorAll('.form-text').length).toEqual(1);
        });
        it('depending on whether the input should accept multiple', function() {
            expect(this.element.querySelectorAll('input.multiple').length).toEqual(1);
            
            this.controller.isMultiple = false;
            scope.$digest();
            expect(this.element.querySelectorAll('input.not-multiple').length).toEqual(1);
        });
        it('depending on whether file(s) have been selected', function() {
            var fileNameLabel = angular.element(this.element.querySelectorAll('.file-name-label')[0]);
            expect(fileNameLabel.hasClass('text-body')).toEqual(false);

            this.controller.selected = true;
            scope.$digest();
            expect(fileNameLabel.hasClass('text-body')).toEqual(true);
        });
        it('depending on whether the input should be required', function() {
            var input = this.element.find('input');
            expect(input.attr('required')).toBeTruthy();
            
            this.controller.isRequired = false;
            scope.$digest();
            expect(input.attr('required')).toBeFalsy();
        });
    });
    it('should call click when the button is clicked', function() {
        spyOn(this.controller, 'click');
        var button = this.element.find('button');
        button.triggerHandler('click');
        expect(this.controller.click).toHaveBeenCalled();
    });
});