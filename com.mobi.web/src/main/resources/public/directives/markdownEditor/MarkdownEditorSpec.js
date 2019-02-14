/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
describe('Markdown Editor component', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('markdownEditor');
        injectShowdownConstant();
        injectTrustedFilter();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.bindModel = '';
        scope.placeHolder = '';
        scope.isFocusMe = true;
        scope.buttonText = '';
        scope.clickEvent = jasmine.createSpy('clickEvent');
        scope.cancelEvent = jasmine.createSpy('cancelEvent');
        this.element = $compile(angular.element('<markdown-editor ng-model="bindModel" is-focus-me="isFocusMe" place-holder="placeHolder" click-event="clickEvent()" cancel-event="cancelEvent()" button-text="buttonText"></markdown-editor>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('markdownEditor');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('bindModel should be two way bound', function() {
            this.controller.bindModel = 'Test';
            scope.$digest();
            expect(scope.bindModel).toEqual('Test');
        });
        it('placeHolder should be one way bound', function() {
            this.controller.placeHolder = 'Test';
            scope.$digest();
            expect(scope.placeHolder).toEqual('');
        });
        it('isFocusMe should be one way bound', function() {
            this.controller.isFocusMe = false;
            scope.$digest();
            expect(scope.isFocusMe).toBe(true);
        });
        it('clickEvent should be called in the parent scope', function() {
            this.controller.clickEvent();
            expect(scope.clickEvent).toHaveBeenCalled();
        });
        it('cancelEvent should be called in the parent scope', function() {
            this.controller.cancelEvent();
            expect(scope.cancelEvent).toHaveBeenCalled();
        });
        it('buttonText should be one way bound', function() {
            this.controller.buttonText = 'Test';
            scope.$digest();
            expect(scope.buttonText).toEqual('');
        });
    });
    describe('controller methods', function() {
        it('should submit the markdown', function() {
            this.controller.click();
            expect(scope.clickEvent).toHaveBeenCalled();
            expect(this.controller.preview).toEqual('');
            expect(this.controller.showPreview).toEqual(false);
        });
        it('should cancel the markdown', function() {
            this.controller.cancel();
            expect(scope.cancelEvent).toHaveBeenCalled();
            expect(this.controller.preview).toEqual('');
            expect(this.controller.showPreview).toEqual(false);
        });
        describe('should toggle the preview to', function() {
            it('true', function() {
                this.controller.converter.makeHtml.and.returnValue('WOW');
                this.controller.togglePreview();
                expect(this.controller.showPreview).toEqual(true);
                expect(this.controller.converter.makeHtml).toHaveBeenCalledWith(this.controller.bindModel);
                expect(this.controller.preview).toEqual('WOW');
            });
            it('false', function() {
                this.controller.showPreview = true;
                this.controller.preview = 'WOW';
                this.controller.togglePreview();
                expect(this.controller.showPreview).toEqual(false);
                expect(this.controller.converter.makeHtml).not.toHaveBeenCalled();
                expect(this.controller.preview).toEqual('');
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('MARKDOWN-EDITOR');
            expect(this.element.querySelectorAll('.markdown-editor').length).toEqual(1);
            expect(this.element.querySelectorAll('.form-group').length).toEqual(1);
            expect(this.element.querySelectorAll('.markdown-editor-header').length).toEqual(1);
        });
        it('with a button to submit', function() {
            var buttons = this.element.querySelectorAll('button.btn-primary');
            expect(buttons.length).toBe(1);
            expect(angular.element(buttons[0]).text().trim()).toEqual(scope.buttonText);
        });
        it('depending on whether a cancelEvent was supplied', function() {
            var buttons = this.element.querySelectorAll('button:not(.btn-primary)');
            expect(buttons.length).toBe(1);
            expect(angular.element(buttons[0]).text().trim()).toEqual('Cancel');
            
            this.controller.cancelEvent = undefined;
            scope.$digest();
            var buttons = this.element.querySelectorAll('button:not(.btn-primary)');
            expect(buttons.length).toBe(0);
        });
        it('if the preview of the markdown should be shown', function() {
            var button = angular.element(this.element.querySelectorAll('.preview-button')[0]);
            expect(button.hasClass('fa-eye')).toEqual(true);
            expect(button.hasClass('fa-eye-slash')).toEqual(false);
            expect(this.element.find('textarea').length).toEqual(1);
            expect(this.element.querySelectorAll('.markdown-preview').length).toEqual(0);

            this.controller.showPreview = true;
            scope.$digest();
            expect(button.hasClass('fa-eye')).toEqual(false);
            expect(button.hasClass('fa-eye-slash')).toEqual(true);
            expect(this.element.find('textarea').length).toEqual(0);
            expect(this.element.querySelectorAll('.markdown-preview').length).toEqual(1);
        });
        it('if the markdown is empty', function() {
            var button = this.element.find('button');
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.bindModel = 'WOW';
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
    it('should call click when the button is clicked', function() {
        spyOn(this.controller, 'click');
        var button = angular.element(this.element.querySelectorAll('button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.click).toHaveBeenCalled();
    });
});