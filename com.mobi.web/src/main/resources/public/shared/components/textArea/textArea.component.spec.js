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
describe('Text Area component', function() {
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
        scope.changeEvent = jasmine.createSpy('changeEvent');
        scope.displayText = '';
        scope.mutedText = '';
        scope.required = true;
        scope.textAreaName = '';
        this.element = $compile(angular.element('<text-area bind-model="bindModel" change-event="changeEvent(value)" display-text="displayText" muted-text="mutedText" required="required" text-area-name="textAreaName"></text-area>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('textArea');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('bindModel should be one way bound', function() {
            this.controller.bindModel = 'Test';
            scope.$digest();
            expect(scope.bindModel).toEqual('');
        });
        it('changeEvent should be called in parent scope', function() {
            this.controller.changeEvent({value: 'Test'});
            expect(scope.changeEvent).toHaveBeenCalledWith('Test');
        });
        it('displayText should be one way bound', function() {
            this.controller.displayText = 'Test';
            scope.$digest();
            expect(scope.displayText).toEqual('');
        });
        it('mutedText should be one way bound', function() {
            this.controller.mutedText = 'Test';
            scope.$digest();
            expect(scope.mutedText).toEqual('');
        });
        it('required should be one way bound', function() {
            this.controller.required = false;
            scope.$digest();
            expect(scope.required).toEqual(true);
        });
        it('textAreaName should be one way bound', function() {
            this.controller.textAreaName = 'Test';
            scope.$digest();
            expect(scope.textAreaName).toEqual('');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('TEXT-AREA');
            expect(this.element.querySelectorAll('.text-area').length).toEqual(1);
            expect(this.element.querySelectorAll('.form-group').length).toEqual(1);
        });
        ['custom-label', 'textarea'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toEqual(1);
            });
        });
        it('depending on whether it is required or not', function() {
            var textArea = angular.element(this.element.find('textarea')[0]);
            expect(textArea.attr('required')).toBeTruthy();

            scope.required = false;
            scope.$digest();
            expect(textArea.attr('required')).toBeFalsy();
        });
    });
    it('should call changeEvent when the text in the textarea changes', function() {
        var input = this.element.find('textarea');
        input.val('Test').triggerHandler('input');
        expect(scope.changeEvent).toHaveBeenCalledWith('Test');
    });
});