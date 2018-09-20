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
describe('Object Property Overlay directive', function() {
    var $compile, scope, ontologyStateSvc, ontoUtils, propertyManagerSvc, util;

    beforeEach(function() {
        module('templates');
        module('objectPropertyOverlay');
        mockOntologyState();
        mockUtil();
        mockOntologyUtilsManager();
        mockPropertyManager();
        injectTrustedFilter();
        injectHighlightFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyUtilsManagerService_, _propertyManagerService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontoUtils = _ontologyUtilsManagerService_;
            propertyManagerSvc = _propertyManagerService_;
            util = _utilService_;
        });

        ontologyStateSvc.getActiveEntityIRI.and.returnValue('active');
        ontologyStateSvc.listItem = {ontologyRecord: {recordId: 'recordId'}, individuals: {iris: {active: 'ontology', indiv: 'ontology'}}};
        ontologyStateSvc.propertyValue = 'indiv';

        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<object-property-overlay close="close()" dismiss="dismiss()"></object-property-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('objectPropertyOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontoUtils = null;
        propertyManagerSvc = null;
        util = null
        this.element.remove();
    });

    it('initializes with the correct values', function() {
        expect(this.controller.individuals).toEqual({indiv: 'ontology'});
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('OBJECT-PROPERTY-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-body').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toBe(1);
        });
        ['h3', 'ui-select', 'iri-select'].forEach(tag => {
            it('with a ' + tag, function() {
                expect(this.element.find(tag).length).toEqual(1);
            });
        });
        it('with buttons to submit and cancel', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Submit'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
    });
    describe('controller methods', function() {
        describe('should add an object property', function() {
            beforeEach(function() {
                ontologyStateSvc.listItem.selected = {'@type': []};
                this.value = 'value';
                this.prop = 'prop';
                propertyManagerSvc.addId.and.returnValue(true);
            });
            it('unless it is a duplicate value', function() {
                propertyManagerSvc.addId.and.returnValue(false);
                this.controller.addProperty(this.prop, this.value);
                expect(propertyManagerSvc.addId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, this.prop, this.value);
                expect(ontologyStateSvc.addToAdditions).not.toHaveBeenCalled();
                expect(ontoUtils.saveCurrentChanges).not.toHaveBeenCalled();
                expect(util.createWarningToast).toHaveBeenCalled();
                expect(scope.close).toHaveBeenCalled();
            });
            describe('if the selected entity is', function() {
                it('a derived Concept or ConceptScheme', function() {
                    ontoUtils.containsDerivedConcept.and.returnValue(true);
                    this.controller.addProperty(this.prop, this.value);
                    expect(propertyManagerSvc.addId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, this.prop, this.value);
                    expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                    expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                    expect(util.createWarningToast).not.toHaveBeenCalled();
                    expect(scope.close).toHaveBeenCalled();
                    expect(ontoUtils.containsDerivedConcept).toHaveBeenCalledWith([]);
                    expect(ontoUtils.updateVocabularyHierarchies).toHaveBeenCalledWith(this.prop, [{'@id': this.value}]);
                });
                it('a derived ConceptScheme', function() {
                    ontoUtils.containsDerivedConceptScheme.and.returnValue(true);
                    this.controller.addProperty(this.prop, this.value);
                    expect(propertyManagerSvc.addId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, this.prop, this.value);
                    expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                    expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                    expect(util.createWarningToast).not.toHaveBeenCalled();
                    expect(scope.close).toHaveBeenCalled();
                    expect(ontoUtils.containsDerivedConceptScheme).toHaveBeenCalledWith([]);
                    expect(ontoUtils.updateVocabularyHierarchies).toHaveBeenCalledWith(this.prop, [{'@id': this.value}]);
                });
                it('not a derived Concept or ConceptScheme', function() {
                    this.controller.addProperty(this.prop, this.value);
                    expect(propertyManagerSvc.addId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, this.prop, this.value);
                    expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                    expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                    expect(util.createWarningToast).not.toHaveBeenCalled();
                    expect(scope.close).toHaveBeenCalled();
                    expect(ontoUtils.containsDerivedConcept).toHaveBeenCalledWith([]);
                    expect(ontoUtils.containsDerivedConceptScheme).toHaveBeenCalledWith([]);
                    expect(ontoUtils.updateVocabularyHierarchies).not.toHaveBeenCalled();
                });
            });
        });
        it('getValues should call the correct method', function() {
            ontologyStateSvc.listItem = { objectProperties: { iris: {test: 'ontology'} } };
            ontoUtils.getSelectList.and.returnValue(['list']);
            this.controller.getValues('text');
            expect(ontoUtils.getSelectList).toHaveBeenCalledWith(['test'], 'text', ontoUtils.getDropDownText);
            expect(this.controller.values).toEqual(['list']);
        });
        it('should cancel the overlay', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    it('should call addProperty when the button is clicked', function() {
        spyOn(this.controller, 'addProperty');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.addProperty).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
});