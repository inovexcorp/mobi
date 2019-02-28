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
describe('Inline Edit component', function() {
    var $compile, scope, utilSvc;

    beforeEach(function() {
        module('templates');
        module('shared');
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            utilSvc = _utilService_;
        });

        scope.text = 'Text';
        scope.canEdit = false;
        scope.area = false;
        scope.required = false;
        scope.placeholder = 'Placeholder';
        scope.saveEvent = jasmine.createSpy('saveEvent');
        this.element = $compile(angular.element('<inline-edit text="text" can-edit="canEdit" area="area" required="required" placeholder="placeholder" save-event="saveEvent(text)"></inline-edit>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('inlineEdit');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        utilSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('text should be one way bound', function() {
            this.controller.text = 'New Text';
            scope.$digest();
            expect(scope.text).toEqual('Text');
        });
        it('canEdit should be one way bound', function() {
            this.controller.canEdit = true;
            scope.$digest();
            expect(scope.canEdit).toEqual(false);
        });
        it('area should be one way bound', function() {
            this.controller.area = true;
            scope.$digest();
            expect(scope.area).toEqual(false);
        });
        it('required should be one way bound', function() {
            this.controller.required = true;
            scope.$digest();
            expect(scope.required).toEqual(false);
        });
        it('saveEvent should be called in the parent scope', function() {
            this.controller.saveEvent({text: 'New Text'});
            expect(scope.saveEvent).toHaveBeenCalledWith('New Text');
        });
    });
    describe('controller methods', function() {
        describe('saveChanges', function() {
            it('should reset if required is set and text is empty', function() {
                this.controller.required = true;
                this.controller.text = '';
                this.controller.edit = true;
                this.controller.saveChanges();
                expect(this.controller.text).toEqual('Text');
                expect(this.controller.edit).toEqual(false);
                expect(utilSvc.createWarningToast).toHaveBeenCalled();
            });
            it('should save changes', function() {
                this.controller.text = 'New Text';
                this.controller.edit = true;
                this.controller.saveChanges();
                expect(scope.saveEvent).toHaveBeenCalledWith('New Text');
            });
        });
        it('onBlur should reset state', function() {
            this.controller.text = 'Changed Text';
            this.controller.edit = true;
            this.controller.onBlur();
            expect(this.controller.text).toEqual('Text');
            expect(this.controller.edit).toEqual(false);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('INLINE-EDIT');
            expect(this.element.querySelectorAll('.inline-edit').length).toEqual(1);
        });
        describe('depending if the user can edit', function() {
            beforeEach(function() {
                this.controller.canEdit = true;
            });
            describe('and is edit mode', function() {
                beforeEach(function() {
                    this.controller.edit = true;
                });
                it('and area is set', function() {
                    this.controller.area = true;
                    scope.$digest();
                    expect(this.element.querySelectorAll('input').length).toEqual(0);
                    expect(this.element.querySelectorAll('textarea').length).toEqual(1);
                    expect(this.element.querySelectorAll('.fa-save').length).toEqual(1);
                });
                it('and area is not set', function() {
                    this.controller.area = false;
                    scope.$digest();
                    expect(this.element.querySelectorAll('input').length).toEqual(1);
                    expect(this.element.querySelectorAll('textarea').length).toEqual(0);
                    expect(this.element.querySelectorAll('.fa-save').length).toEqual(1);
                });
            });
            it('and is not in edit mode', function() {
                this.controller.edit = false;
                scope.$digest();
                expect(this.element.querySelectorAll('input').length).toEqual(0);
                expect(this.element.querySelectorAll('textarea').length).toEqual(0);
                expect(this.element.querySelectorAll('.fa-save').length).toEqual(0);
            });
        });
        it('depending if the user cannot edit', function() {
            this.controller.canEdit = false;
            scope.$digest();
            expect(this.element.querySelectorAll('input').length).toEqual(0);
            expect(this.element.querySelectorAll('textarea').length).toEqual(0);
            expect(this.element.querySelectorAll('.fa-save').length).toEqual(0);
        });
        it('should set edit to true when clicked', function() {
            this.controller.canEdit = true;
            scope.$digest();

            expect(this.controller.edit).toEqual(false);
            var editableArea = angular.element(this.element.querySelectorAll('.hover-area'));
            editableArea.triggerHandler('click');
            expect(this.controller.edit).toEqual(true);
        });
    });
});