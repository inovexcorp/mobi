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
    var $compile, scope, $q, ontologyManagerSvc, ontologyStateSvc, prefixes, splitIRI, ontoUtils, propertyManagerSvc;

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
        mockPropertyManager();

        inject(function(_$q_, _$compile_, _$rootScope_, _ontologyManagerService_, _ontologyStateService_, _prefixes_, _splitIRIFilter_, _ontologyUtilsManagerService_, _propertyManagerService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            prefixes = _prefixes_;
            splitIRI = _splitIRIFilter_;
            ontoUtils = _ontologyUtilsManagerService_;
            propertyManagerSvc = _propertyManagerService_;
        });

        this.iri = 'iri#';
        ontologyStateSvc.getDefaultPrefix.and.returnValue(this.iri);
        ontologyManagerSvc.getConceptSchemeIRIs.and.returnValue(['scheme1']);

        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<create-concept-overlay close="close()" dismiss="dismiss()"></create-concept-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('createConceptOverlay');
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
        propertyManagerSvc = null;
        this.element.remove();
    });

    it('initializes with the correct values', function() {
        expect(ontologyStateSvc.getDefaultPrefix).toHaveBeenCalled();
        expect(this.controller.prefix).toBe(this.iri);
        expect(this.controller.concept['@id']).toBe(this.controller.prefix);
        expect(this.controller.concept['@type']).toEqual([prefixes.owl + 'NamedIndividual', prefixes.skos + 'Concept']);
        expect(this.controller.schemeIRIs).toEqual(['scheme1']);
        expect(ontologyManagerSvc.getConceptSchemeIRIs).toHaveBeenCalledWith(jasmine.any(Array), ontologyStateSvc.listItem.derivedConceptSchemes);
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('CREATE-CONCEPT-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-body').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toBe(1);
        });
        it('with a form', function() {
            expect(this.element.find('form').length).toBe(1);
        });
        it('with a static-iri', function() {
            expect(this.element.find('static-iri').length).toBe(1);
        });
        it('with a custom-label', function() {
            expect(this.element.find('custom-label').length).toBe(2);
        });
        it('with an advanced-language-select', function() {
            expect(this.element.find('advanced-language-select').length).toBe(1);
        });
        it('depending on whether there is an error', function() {
            expect(this.element.find('error-display').length).toBe(0);

            this.controller.error = 'Error';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('depending on whether there are concept schemes', function() {
            expect(this.element.find('ui-select').length).toBe(1);

            this.controller.schemeIRIs = [];
            scope.$digest();
            expect(this.element.find('ui-select').length).toBe(0);
        });
        it('with buttons to create and cancel', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
        it('depending on the form validity', function() {
            var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.form.$invalid = false;
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on whether the concept IRI already exists in the ontology.', function() {
            ontoUtils.checkIri.and.returnValue(true);
            scope.$digest();

            var disabled = this.element.querySelectorAll('[disabled]');
            expect(disabled.length).toBe(1);
            expect(angular.element(disabled[0]).text()).toBe('Submit');
        });
    });
    describe('controller methods', function() {
        describe('should update the concept id', function() {
            beforeEach(function() {
                this.controller.concept['@id'] = 'test';
                this.controller.concept[prefixes.skos + 'prefLabel'] = [{'@value': 'Name'}];
                this.controller.prefix = 'start';
            });
            it('unless the iri has been changed', function() {
                this.controller.iriHasChanged = true;
                this.controller.nameChanged();
                expect(this.controller.concept['@id']).toEqual('test');
            });
            it('if the iri has not changed', function() {
                this.controller.iriHasChanged = false;
                this.controller.nameChanged();
                expect(this.controller.concept['@id']).toEqual(this.controller.prefix + this.controller.concept[prefixes.skos + 'prefLabel'][0]['@value']);
            });
        });
        it('should change the iri based on the params', function() {
            this.controller.onEdit('begin', 'then', 'end');
            expect(this.controller.concept['@id']).toBe('begin' + 'then' + 'end');
            expect(this.controller.iriHasChanged).toBe(true);
            expect(ontologyStateSvc.setCommonIriParts).toHaveBeenCalledWith('begin', 'then');
        });
        it('should create a concept', function() {
            ontologyStateSvc.flattenHierarchy.and.returnValue([{prop: 'entity'}]);
            this.scheme = {'@id': 'scheme', mobi: {}};
            this.controller.selectedSchemes = [this.scheme];
            ontologyStateSvc.getEntityByRecordId.and.returnValue(this.scheme);
            this.controller.concept = {'@id': 'concept'};
            var json = {'@id': this.scheme['@id'], [prefixes.skos + 'hasTopConcept']: [{'@id': 'concept'}]};
            propertyManagerSvc.addId.and.returnValue(true);
            this.controller.create();
            expect(propertyManagerSvc.addId).toHaveBeenCalledWith(this.scheme, prefixes.skos + 'hasTopConcept', this.controller.concept['@id']);
            expect(ontologyStateSvc.addEntityToHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes.hierarchy, 'concept', ontologyStateSvc.listItem.conceptSchemes.index, this.scheme['@id']);
            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, json);
            expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
            expect(ontologyStateSvc.listItem.conceptSchemes.flat).toEqual([{prop: 'entity'}]);
            expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(this.controller.concept, this.controller.language);
            expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, this.controller.concept);
            expect(ontoUtils.addConcept).toHaveBeenCalledWith(this.controller.concept);
            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.controller.concept);
            expect(ontoUtils.addIndividual).toHaveBeenCalledWith(this.controller.concept);
            expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            expect(scope.close).toHaveBeenCalled();
        });
        it('should set the list of schemes', function() {
            ontoUtils.getSelectList.and.returnValue(['scheme']);
            this.controller.getSchemes('search');
            expect(this.controller.schemes).toEqual(['scheme']);
            expect(ontoUtils.getSelectList).toHaveBeenCalledWith(this.controller.schemeIRIs, 'search');
        });
        it('should cancel the overlay', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    it('should call create when the button is clicked', function() {
        spyOn(this.controller, 'create');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.create).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
});
