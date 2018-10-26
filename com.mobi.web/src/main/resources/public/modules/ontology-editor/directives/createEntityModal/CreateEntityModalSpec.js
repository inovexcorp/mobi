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
describe('Create Entity Modal directive', function() {
    var $compile, scope, ontologyStateSvc, modalSvc;

    beforeEach(function() {
        module('templates');
        module('createEntityModal');
        mockOntologyState();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            modalSvc = _modalService_;
        });

        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<create-entity-modal dismiss="dismiss()"></create-entity-modal>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('createEntityModal');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        ontologyManagerSvc = null;
        ontologyStateSvc = null;
        prefixes = null;
        splitIRI = null;
        ontoUtils = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('CREATE-ENTITY-MODAL');
            expect(this.element.querySelectorAll('.modal-header').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-body').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toBe(1);
        });
        it('with a button to create a class', function() {
            expect(this.element.querySelectorAll('button.create-class').length).toBe(1);
        });
        it('with a button to create a data property', function() {
            expect(this.element.querySelectorAll('button.create-data-property').length).toBe(1);
        });
        it('with a button to create an object property', function() {
            expect(this.element.querySelectorAll('button.create-object-property').length).toBe(1);
        });
        it('with a button to create an annotation property', function() {
            expect(this.element.querySelectorAll('button.create-annotation-property').length).toBe(1);
        });
        it('with a button to create an individual', function() {
            expect(this.element.querySelectorAll('button.create-individual').length).toBe(1);
        });
        it('with a button to create a concept if the ontology is a vocabulary', function() {
            expect(this.element.querySelectorAll('button.create-concept').length).toBe(0);

            ontologyStateSvc.listItem.isVocabulary = true;
            scope.$digest();
            expect(this.element.querySelectorAll('button.create-concept').length).toBe(1);
        });
        it('with a button to create a concept scheme if the ontology is a vocabulary', function() {
            expect(this.element.querySelectorAll('button.create-concept-scheme').length).toBe(0);

            ontologyStateSvc.listItem.isVocabulary = true;
            scope.$digest();
            expect(this.element.querySelectorAll('button.create-concept-scheme').length).toBe(1);
        });
        it('with a button to cancel', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toBe(1);
            expect(angular.element(buttons[0]).text().trim()).toEqual('Cancel');
        });
    });
    describe('controller methods', function() {
        it('should open the modal for creating a class', function() {
            this.controller.createClass();
            expect(scope.dismiss).toHaveBeenCalled();
            expect(modalSvc.openModal).toHaveBeenCalledWith('createClassOverlay');
        });
        it('should open the modal for creating a data property', function() {
            this.controller.createDataProperty();
            expect(scope.dismiss).toHaveBeenCalled();
            expect(modalSvc.openModal).toHaveBeenCalledWith('createDataPropertyOverlay');
        });
        it('should open the modal for creating an object property', function() {
            this.controller.createObjectProperty();
            expect(scope.dismiss).toHaveBeenCalled();
            expect(modalSvc.openModal).toHaveBeenCalledWith('createObjectPropertyOverlay');
        });
        it('should open the modal for creating an annotation property', function() {
            this.controller.createAnnotationProperty();
            expect(scope.dismiss).toHaveBeenCalled();
            expect(modalSvc.openModal).toHaveBeenCalledWith('createAnnotationPropertyOverlay');
        });
        it('should open the modal for creating an individual', function() {
            this.controller.createIndividual();
            expect(scope.dismiss).toHaveBeenCalled();
            expect(modalSvc.openModal).toHaveBeenCalledWith('createIndividualOverlay');
        });
        it('should open the modal for creating a concept', function() {
            this.controller.createConcept();
            expect(scope.dismiss).toHaveBeenCalled();
            expect(modalSvc.openModal).toHaveBeenCalledWith('createConceptOverlay');
        });
        it('should open the modal for creating a concept scheme', function() {
            this.controller.createConceptScheme();
            expect(scope.dismiss).toHaveBeenCalled();
            expect(modalSvc.openModal).toHaveBeenCalledWith('createConceptSchemeOverlay');
        });
    });
    it('should call createClass when the button is clicked', function() {
        spyOn(this.controller, 'createClass');
        var button = angular.element(this.element.querySelectorAll('button.create-class')[0]);
        button.triggerHandler('click');
        expect(this.controller.createClass).toHaveBeenCalled();
    });
    it('should call createDataProperty when the button is clicked', function() {
        spyOn(this.controller, 'createDataProperty');
        var button = angular.element(this.element.querySelectorAll('button.create-data-property')[0]);
        button.triggerHandler('click');
        expect(this.controller.createDataProperty).toHaveBeenCalled();
    });
    it('should call createObjectProperty when the button is clicked', function() {
        spyOn(this.controller, 'createObjectProperty');
        var button = angular.element(this.element.querySelectorAll('button.create-object-property')[0]);
        button.triggerHandler('click');
        expect(this.controller.createObjectProperty).toHaveBeenCalled();
    });
    it('should call createAnnotationProperty when the button is clicked', function() {
        spyOn(this.controller, 'createAnnotationProperty');
        var button = angular.element(this.element.querySelectorAll('button.create-annotation-property')[0]);
        button.triggerHandler('click');
        expect(this.controller.createAnnotationProperty).toHaveBeenCalled();
    });
    it('should call createIndividual when the button is clicked', function() {
        spyOn(this.controller, 'createIndividual');
        var button = angular.element(this.element.querySelectorAll('button.create-individual')[0]);
        button.triggerHandler('click');
        expect(this.controller.createIndividual).toHaveBeenCalled();
    });
    it('should call createConcept when the button is clicked', function() {
        ontologyStateSvc.listItem.isVocabulary = true;
        scope.$digest();
        spyOn(this.controller, 'createConcept');
        var button = angular.element(this.element.querySelectorAll('button.create-concept')[0]);
        button.triggerHandler('click');
        expect(this.controller.createConcept).toHaveBeenCalled();
    });
    it('should call createConceptScheme when the button is clicked', function() {
        ontologyStateSvc.listItem.isVocabulary = true;
        scope.$digest();
        spyOn(this.controller, 'createConceptScheme');
        var button = angular.element(this.element.querySelectorAll('button.create-concept-scheme')[0]);
        button.triggerHandler('click');
        expect(this.controller.createConceptScheme).toHaveBeenCalled();
    });
});
