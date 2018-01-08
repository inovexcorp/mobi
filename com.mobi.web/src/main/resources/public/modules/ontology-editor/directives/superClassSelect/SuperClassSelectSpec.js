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
describe('Super Class Select directive', function() {
    var $compile, scope, ontologyStateSvc, ontoUtils;

    beforeEach(function() {
        module('templates');
        module('superClassSelect');
        mockOntologyState();
        mockUtil();
        mockOntologyUtilsManager();
        injectTrustedFilter();
        injectHighlightFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyUtilsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontoUtils = _ontologyUtilsManagerService_;
        });

        scope.values = [];
        this.element = $compile(angular.element('<super-class-select values="values"></super-class-select>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('superClassSelect');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontoUtils = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('values should be two way bound', function() {
            this.controller.values = ['different'];
            scope.$apply();
            expect(scope.values).toEqual(['different']);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('super-class-select')).toBe(true);
            expect(this.element.hasClass('advanced-language-select')).toBe(true);
        });
        it('for correct links', function() {
            expect(this.element.querySelectorAll('.btn-link .fa-plus').length).toBe(1);
            expect(this.element.querySelectorAll('.btn-link .fa-times').length).toBe(0);
            this.controller.isShown = true;
            scope.$apply();
            expect(this.element.querySelectorAll('.btn-link .fa-plus').length).toBe(0);
            expect(this.element.querySelectorAll('.btn-link .fa-times').length).toBe(1);
        });
        it('with a .form-group', function() {
            expect(this.element.querySelectorAll('.form-group').length).toBe(0);
            this.controller.isShown = true;
            scope.$apply();
            expect(this.element.querySelectorAll('.form-group').length).toBe(1);
        });
        it('with a custom-label', function() {
            expect(this.element.find('custom-label').length).toBe(0);
            this.controller.isShown = true;
            scope.$apply();
            expect(this.element.find('custom-label').length).toBe(1);
        });
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toBe(0);
            this.controller.isShown = true;
            scope.$apply();
            expect(this.element.find('ui-select').length).toBe(1);
        });
        it('with a ui-select-match', function() {
            expect(this.element.find('ui-select-match').length).toBe(0);
            this.controller.isShown = true;
            scope.$apply();
            expect(this.element.find('ui-select-match').length).toBe(1);
        });
        it('with a span[title]', function() {
            expect(this.element.querySelectorAll('span[title]').length).toBe(0);
            this.controller.isShown = true;
            scope.$apply();
            expect(this.element.querySelectorAll('span[title]').length).toBe(1);
        });
        it('with a ui-select-choices', function() {
            expect(this.element.find('ui-select-choices').length).toBe(0);
            this.controller.isShown = true;
            scope.$apply();
            expect(this.element.find('ui-select-choices').length).toBe(1);
        });
        it('with a div[title]', function() {
            expect(this.element.querySelectorAll('div[title]').length).toBe(0);
            this.controller.isShown = true;
            scope.$apply();
            expect(this.element.querySelectorAll('div[title]').length).toBe(1);
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
            expect(this.controller.values).toEqual([]);
        });
        it('getValues should call the correct method', function() {
            ontologyStateSvc.listItem.classes.iris = { classA: 'ontologyId' };
            ontoUtils.getSelectList.and.returnValue(['list']);
            this.controller.getValues('text');
            expect(ontoUtils.getSelectList).toHaveBeenCalledWith(['classA'], 'text', ontoUtils.getDropDownText);
            expect(this.controller.array).toEqual(['list']);
        });
    });
});