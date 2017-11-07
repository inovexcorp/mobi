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
describe('Top Concept Overlay directive', function() {
    var $compile, scope, ontologyStateSvc, ontologyManagerSvc, ontoUtils, prefixes;

    beforeEach(function() {
        module('templates');
        module('topConceptOverlay');
        injectHighlightFilter();
        injectTrustedFilter();
        mockOntologyManager();
        mockOntologyState();
        mockOntologyUtilsManager();
        mockPrefixes();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyManagerService_, _ontologyUtilsManagerService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontoUtils = _ontologyUtilsManagerService_;
            prefixes = _prefixes_;
        });

        scope.onSubmit = jasmine.createSpy('onSubmit');
        scope.closeOverlay = jasmine.createSpy('closeOverlay');
        this.element = $compile(angular.element('<top-concept-overlay on-submit="onSubmit()" close-overlay="closeOverlay()"></top-concept-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('topConceptOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontologyManagerSvc = null;
        ontoUtils = null;
        prefixes = null;
        this.element.remove();
    });

    describe('controller bound variables', function() {
        it('onSubmit to be called in parent scope', function() {
            this.controller.onSubmit();
            expect(scope.onSubmit).toHaveBeenCalled();
        });
        it('closeOverlay to be called in parent scope', function() {
            this.controller.closeOverlay();
            expect(scope.closeOverlay).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('top-concept-overlay')).toBe(true);
            expect(this.element.hasClass('overlay')).toBe(true);
        });
        it('with a form', function() {
            expect(this.element.find('form').length).toBe(1);
        });
        it('with a h6', function() {
            expect(this.element.find('h6').length).toBe(1);
        });
        it('with .form-group', function() {
            expect(this.element.querySelectorAll('.form-group').length).toBe(1);
        });
        it('with custom-label', function() {
            expect(this.element.find('custom-label').length).toBe(1);
        });
        it('with ui-select', function() {
            expect(this.element.find('ui-select').length).toBe(1);
        });
        it('with a .btn-container', function() {
            expect(this.element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('with buttons to add and cancel', function() {
            var buttons = this.element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Add']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Add']).toContain(angular.element(buttons[1]).text().trim());
        });
        it('depending on whether values are selected', function() {
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.values = [{}];
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        it('should add a top concept', function() {
            this.controller.values = [{}];
            this.controller.addTopConcept();
            expect(ontologyStateSvc.listItem.selected[prefixes.skos + 'hasTopConcept']).toEqual(this.controller.values);
            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
            expect(scope.closeOverlay).toHaveBeenCalled();
            expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
        });
    });
});