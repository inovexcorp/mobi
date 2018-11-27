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
        scope.isFocusMe = true;
        scope.placeHolder = '';
        this.element = $compile(angular.element('<markdown-editor ng-model="bindModel" is-focus-me="isFocusMe" place-holder="placeHolder"></markdown-editor>'))(scope);
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
    });
    describe('controller methods', function() {
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
            expect(this.element.querySelectorAll('.markdown-editor.form-group').length).toEqual(1);
            expect(this.element.querySelectorAll('.markdown-editor-header').length).toEqual(1);
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
    });
});