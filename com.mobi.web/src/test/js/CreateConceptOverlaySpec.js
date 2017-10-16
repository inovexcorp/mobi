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
describe('Create Concept Overlay directive', function() {
    var $compile, scope, $q, element, controller, ontologyManagerSvc, ontologyStateSvc, prefixes, splitIRIFilter, ontoUtils;
    var iri = 'iri#';

    beforeEach(function() {
        module('templates');
        module('createConceptOverlay');
        injectRegexConstant();
        injectCamelCaseFilter();
        injectSplitIRIFilter();
        injectHighlightFilter();
        injectTrustedFilter();
        mockOntologyManager();
        mockOntologyState();
        mockPrefixes();
        mockUtil();
        mockOntologyUtilsManager();

        inject(function(_$q_, _$compile_, _$rootScope_, _ontologyManagerService_, _ontologyStateService_, _prefixes_, _splitIRIFilter_, _ontologyUtilsManagerService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            prefixes = _prefixes_;
            splitIRIFilter = _splitIRIFilter_;
            ontoUtils = _ontologyUtilsManagerService_;
        });

        ontologyStateSvc.getDefaultPrefix.and.returnValue(iri);
        element = $compile(angular.element('<create-concept-overlay></create-concept-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('createConceptOverlay');
    });
    describe('initializes with the correct values', function() {
        it('if parent ontology is opened', function() {
            expect(ontologyStateSvc.getDefaultPrefix).toHaveBeenCalled();
            expect(controller.prefix).toBe(iri);
            expect(controller.concept['@id']).toBe(controller.prefix);
            expect(controller.concept['@type']).toEqual([prefixes.owl + 'NamedIndividual', prefixes.skos + 'Concept']);
        });
        it('if parent ontology is not opened', function() {
            expect(ontologyStateSvc.getDefaultPrefix).toHaveBeenCalled();
            expect(controller.prefix).toBe(iri);
            expect(controller.concept['@id']).toBe(controller.prefix);
            expect(controller.concept['@type']).toEqual([prefixes.owl + 'NamedIndividual', prefixes.skos + 'Concept']);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('create-concept-overlay')).toBe(true);
            expect(element.hasClass('overlay')).toBe(true);
        });
        it('with a .content', function() {
            expect(element.querySelectorAll('.content').length).toBe(1);
        });
        it('with a form', function() {
            expect(element.find('form').length).toBe(1);
        });
        it('with a static-iri', function() {
            expect(element.find('static-iri').length).toBe(1);
        });
        it('with a custom-label', function() {
            expect(element.find('custom-label').length).toBe(2);
        });
        it('with a .btn-container', function() {
            expect(element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('with an advanced-language-select', function() {
            expect(element.find('advanced-language-select').length).toBe(1);
        });
        it('depending on whether there is an error', function() {
            expect(element.find('error-display').length).toBe(0);

            controller = element.controller('createConceptOverlay');
            controller.error = 'Error';
            scope.$digest();
            expect(element.find('error-display').length).toBe(1);
        });
        it('depending on whether there are concept schemes', function() {
            expect(element.find('ui-select').length).toBe(1);

            ontologyManagerSvc.hasConceptSchemes.and.returnValue(false);
            scope.$digest();
            expect(element.find('ui-select').length).toBe(0);
        });
        it('with buttons to create and cancel', function() {
            var buttons = element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Create']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Create']).toContain(angular.element(buttons[1]).text().trim());
        });
        it('depending on the form validity', function() {
            var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            controller = element.controller('createConceptOverlay');
            controller.form.$invalid = false;
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on whether the concept IRI already exists in the ontology.', function() {
            ontoUtils.checkIri.and.returnValue(true);
            
            scope.$digest();
            
            var disabled = element.querySelectorAll('[disabled]');
            expect(disabled.length).toBe(1);
            expect(angular.element(disabled[0]).text()).toBe('Create');
        });
    });
    describe('controller methods', function() {
        describe('should update the concept id', function() {
            beforeEach(function() {
                controller.concept['@id'] = 'test';
                controller.concept[prefixes.skos + 'prefLabel'] = [{'@value': 'Name'}];
                controller.prefix = 'start';
            });
            it('unless the iri has been changed', function() {
                controller.iriHasChanged = true;
                controller.nameChanged();
                expect(controller.concept['@id']).toEqual('test');
            });
            it('if the iri has not changed', function() {
                controller.iriHasChanged = false;
                controller.nameChanged();
                expect(controller.concept['@id']).toEqual(controller.prefix + controller.concept[prefixes.skos + 'prefLabel'][0]['@value']);
            });
        });
        it('should change the iri based on the params', function() {
            controller.onEdit('begin', 'then', 'end');
            expect(controller.concept['@id']).toBe('begin' + 'then' + 'end');
            expect(controller.iriHasChanged).toBe(true);
            expect(ontologyStateSvc.setCommonIriParts).toHaveBeenCalledWith('begin', 'then');
        });
        it('should create a concept', function() {
            ontologyStateSvc.flattenHierarchy.and.returnValue([{prop: 'entity'}]);
            var schemes = {
                'scheme1': {'@id': 'scheme1', mobi: {}},
                'scheme2': {'@id': 'scheme2', mobi: {}}
            };
            schemes.scheme1[prefixes.skos + 'hasTopConcept'] = [{'@id': 'test'}];
            controller.schemes = _.values(schemes);
            ontologyStateSvc.getEntityByRecordId.and.callFake(function(recordId, schemeId) {
                return _.get(schemes, schemeId);
            });
            controller.concept = {'@id': 'concept'};
            var json = {};
            json[prefixes.skos + 'hasTopConcept'] = [{'@id': 'concept'}];

            controller.create();
            expect(schemes.scheme1[prefixes.skos + 'hasTopConcept'].length).toBe(2);
            expect(schemes.scheme2[prefixes.skos + 'hasTopConcept'].length).toBe(1);
            _.forEach(controller.schemes, function(scheme) {
                expect(ontologyStateSvc.addEntityToHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemeHierarchy, 'concept', ontologyStateSvc.listItem.conceptSchemeIndex, scheme['@id']);
                json['@id'] = scheme['@id'];
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, json);
            });
            expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemeHierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
            expect(ontologyStateSvc.listItem.flatConceptSchemeHierarchy).toEqual([{prop: 'entity'}]);
            expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(controller.concept, controller.language);
            expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, controller.concept);
            expect(ontologyStateSvc.listItem.conceptHierarchy).toContain({entityIRI: controller.concept['@id']});
            expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptHierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
            expect(ontologyStateSvc.listItem.flatConceptHierarchy).toEqual([{prop: 'entity'}]);
            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, controller.concept);
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith(controller.concept['@id']);
            expect(ontologyStateSvc.showCreateConceptOverlay).toBe(false);
            expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
        });
    });
    it('should call create when the button is clicked', function() {
        controller = element.controller('createConceptOverlay');
        spyOn(controller, 'create');

        var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(controller.create).toHaveBeenCalled();
    });
    it('should set the correct state when the cancel button is clicked', function() {
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showCreateConceptOverlay).toBe(false);
    });
});
