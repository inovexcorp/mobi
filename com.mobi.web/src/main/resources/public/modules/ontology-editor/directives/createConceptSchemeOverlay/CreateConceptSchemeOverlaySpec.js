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
describe('Create Concept Scheme Overlay directive', function() {
    var $compile, scope, $q, ontologyManagerSvc, ontologyStateSvc, prefixes, splitIRI, ontoUtils;

    beforeEach(function() {
        module('templates');
        module('createConceptSchemeOverlay');
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
            splitIRI = _splitIRIFilter_;
            ontoUtils = _ontologyUtilsManagerService_;
        });

        this.iri = 'iri#';
        ontologyStateSvc.getDefaultPrefix.and.returnValue(this.iri);
        ontologyManagerSvc.getConceptIRIs.and.returnValue(['concept1']);
        this.element = $compile(angular.element('<create-concept-scheme-overlay></create-concept-scheme-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('createConceptSchemeOverlay');
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

    it('initializes with the correct values', function() {
        expect(ontologyStateSvc.getDefaultPrefix).toHaveBeenCalled();
        expect(this.controller.prefix).toBe(this.iri);
        expect(this.controller.scheme['@id']).toBe(this.controller.prefix);
        expect(this.controller.scheme['@type']).toEqual([prefixes.owl + 'NamedIndividual', prefixes.skos + 'ConceptScheme']);
        expect(this.controller.conceptIRIs).toEqual(['concept1']);
        expect(ontologyManagerSvc.getConceptIRIs).toHaveBeenCalledWith(jasmine.any(Array), ontologyStateSvc.listItem.derivedConcepts);
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('create-concept-scheme-overlay')).toBe(true);
            expect(this.element.hasClass('overlay')).toBe(true);
            expect(this.element.querySelectorAll('.content').length).toBe(1);
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
        it('with a .btn-container', function() {
            expect(this.element.querySelectorAll('.btn-container').length).toBe(1);
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
        it('depending on whether there are concepts', function() {
            expect(this.element.find('ui-select').length).toBe(1);

            this.controller.conceptIRIs = [];
            scope.$digest();
            expect(this.element.find('ui-select').length).toBe(0);
        });
        it('with buttons to create and cancel', function() {
            var buttons = this.element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Create']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Create']).toContain(angular.element(buttons[1]).text().trim());
        });
        it('depending on the form validity', function() {
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();
        });
        it('depending on the form validity', function() {
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.form.$invalid = false;
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on whether the scheme IRI already exists in the ontology.', function() {
            ontoUtils.checkIri.and.returnValue(true);

            scope.$digest();

            var disabled = this.element.querySelectorAll('[disabled]');
            expect(disabled.length).toBe(1);
            expect(angular.element(disabled[0]).text()).toBe('Create');
        });
    });
    describe('controller methods', function() {
        describe('should update the concept scheme id', function() {
            beforeEach(function() {
                this.controller.scheme['@id'] = 'test';
                this.controller.scheme[prefixes.dcterms + 'title'] = [{'@value': 'Name'}];
                this.controller.prefix = 'start';
            });
            it('unless the iri has been changed', function() {
                this.controller.iriHasChanged = true;
                this.controller.nameChanged();
                expect(this.controller.scheme['@id']).toEqual('test');
            });
            it('if the iri has not changed', function() {
                this.controller.iriHasChanged = false;
                this.controller.nameChanged();
                expect(this.controller.scheme['@id']).toEqual(this.controller.prefix + this.controller.scheme[prefixes.dcterms + 'title'][0]['@value']);
            });
        });
        it('should change the iri based on the params', function() {
            this.controller.onEdit('begin', 'then', 'end');
            expect(this.controller.scheme['@id']).toBe('begin' + 'then' + 'end');
            expect(this.controller.iriHasChanged).toBe(true);
            expect(ontologyStateSvc.setCommonIriParts).toHaveBeenCalledWith('begin', 'then');
        });
        it('should create a concept', function() {
            ontologyStateSvc.flattenHierarchy.and.returnValue([{prop: 'entity'}]);
            this.controller.selectedConcepts = [{'@id': 'concept1'}, {'@id': 'concept2'}];
            this.controller.scheme = {'@id': 'scheme'};

            this.controller.create();
            expect(this.controller.scheme[prefixes.skos + 'hasTopConcept']).toEqual(this.controller.selectedConcepts);
            _.forEach(this.controller.selectedConcepts, function(concept) {
                expect(ontologyStateSvc.addEntityToHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes.hierarchy, concept['@id'], ontologyStateSvc.listItem.conceptSchemes.index, 'scheme');
            });
            expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, this.controller.scheme);
            expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(this.controller.scheme, this.controller.language);
            expect(ontologyStateSvc.listItem.conceptSchemes.hierarchy).toEqual([{entityIRI: this.controller.scheme['@id']}]);
            expect(ontologyStateSvc.listItem.conceptSchemes.flat).toEqual([{prop: 'entity'}]);
            expect(ontoUtils.addIndividual).toHaveBeenCalledWith(this.controller.scheme);
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith(this.controller.scheme['@id']);
            expect(ontologyStateSvc.showCreateConceptSchemeOverlay).toBe(false);
            expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
        });
        it('should set the list of concepts', function() {
            ontoUtils.getSelectList.and.returnValue(['concept']);
            this.controller.getConcepts('search');
            expect(this.controller.concepts).toEqual(['concept']);
            expect(ontoUtils.getSelectList).toHaveBeenCalledWith(this.controller.conceptIRIs, 'search');
        });
    });
    it('should call create when the button is clicked', function() {
        spyOn(this.controller, 'create');
        var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.create).toHaveBeenCalled();
    });
    it('should set the correct state when the cancel button is clicked', function() {
        var button = angular.element(this.element.querySelectorAll('.btn-container button:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showCreateConceptSchemeOverlay).toBe(false);
    });
});
