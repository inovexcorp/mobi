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

        ontologyManagerSvc.getConceptIRIs.and.returnValue(['concept1', 'concept2']);
        ontologyStateSvc.listItem.selected[prefixes.skos + 'hasTopConcept'] = [{'@id': 'concept2'}];
        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<top-concept-overlay close="close($value)" dismiss="dismiss()"></top-concept-overlay>'))(scope);
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

    it('should initialize with the correct value for filteredConcepts', function() {
        expect(this.controller.filteredConcepts).toEqual(['concept1']);
        expect(ontologyManagerSvc.getConceptIRIs).toHaveBeenCalledWith(jasmine.any(Array), ontologyStateSvc.listItem.derivedConcepts);
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('TOP-CONCEPT-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-body').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toEqual(1);
        });
        it('with a form', function() {
            expect(this.element.find('form').length).toBe(1);
        });
        it('with a h3', function() {
            expect(this.element.find('h3').length).toBe(1);
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
        it('with buttons to submit and cancel', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
        it('depending on whether values are selected', function() {
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
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
            expect(ontologyStateSvc.listItem.selected[prefixes.skos + 'hasTopConcept']).toEqual([{'@id': 'concept2'}, {}]);
            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
            expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            expect(scope.close).toHaveBeenCalledWith({relationship: prefixes.skos + 'hasTopConcept', values: this.controller.values});
        });
        it('should get filtered concepts', function() {
            ontoUtils.getSelectList.and.returnValue(['list']);
            this.controller.getConcepts('search');
            expect(this.controller.filteredConcepts).toEqual(['list']);
            expect(ontoUtils.getSelectList).toHaveBeenCalledWith(['concept1'], 'search');
        });
        it('should set the list of concepts', function() {
            ontoUtils.getSelectList.and.returnValue(['concept']);
            this.controller.getConcepts('search');
            expect(this.controller.filteredConcepts).toEqual(['concept']);
            expect(ontoUtils.getSelectList).toHaveBeenCalledWith(['concept1'], 'search');
        });
        it('should cancel the overlay', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
});