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
    var $compile, scope, $q, ontologyManagerSvc, ontologyStateSvc, prefixes, splitIRI, ontoUtils;

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
            splitIRI = _splitIRIFilter_;
            ontoUtils = _ontologyUtilsManagerService_;
        });

        this.iri = 'iri#';
        ontologyStateSvc.getDefaultPrefix.and.returnValue(this.iri);
        this.element = $compile(angular.element('<create-concept-overlay></create-concept-overlay>'))(scope);
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
        this.element.remove();
    });

    it('initializes with the correct values', function() {
        expect(ontologyStateSvc.getDefaultPrefix).toHaveBeenCalled();
        expect(this.controller.prefix).toBe(this.iri);
        expect(this.controller.concept['@id']).toBe(this.controller.prefix);
        expect(this.controller.concept['@type']).toEqual([prefixes.owl + 'NamedIndividual', prefixes.skos + 'Concept']);
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('create-concept-overlay')).toBe(true);
            expect(this.element.hasClass('overlay')).toBe(true);
        });
        it('with a .content', function() {
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
        it('depending on whether there are concept schemes', function() {
            expect(this.element.find('ui-select').length).toBe(1);

            ontologyManagerSvc.hasConceptSchemes.and.returnValue(false);
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

            this.controller.form.$invalid = false;
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on whether the concept IRI already exists in the ontology.', function() {
            ontoUtils.checkIri.and.returnValue(true);
            scope.$digest();

            var disabled = this.element.querySelectorAll('[disabled]');
            expect(disabled.length).toBe(1);
            expect(angular.element(disabled[0]).text()).toBe('Create');
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
        describe('should create a concept', function() {
            beforeEach(function() {
                ontologyStateSvc.flattenHierarchy.and.returnValue([{prop: 'entity'}]);
                this.schemes = {
                    scheme1: {'@id': 'scheme1', mobi: {}},
                    scheme2: {'@id': 'scheme2', mobi: {}}
                };
                this.schemes.scheme1[prefixes.skos + 'hasTopConcept'] = [{'@id': 'test'}];
                this.controller.schemes = _.values(this.schemes);
                var self = this;
                ontologyStateSvc.getEntityByRecordId.and.callFake(function(recordId, schemeId) {
                    return _.get(self.schemes, schemeId);
                });
                this.controller.concept = {'@id': 'concept'};
                this.json = {};
                this.json[prefixes.skos + 'hasTopConcept'] = [{'@id': 'concept'}];
            });
            it('if in the ontology editor', function() {
                ontologyStateSvc.listItem.ontologyRecord.type = 'ontology';
                this.controller.create();
                expect(this.schemes.scheme1[prefixes.skos + 'hasTopConcept'].length).toBe(2);
                expect(this.schemes.scheme2[prefixes.skos + 'hasTopConcept'].length).toBe(1);
                this.controller.schemes.forEach(function(scheme) {
                    expect(ontologyStateSvc.addEntityToHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes.hierarchy, 'concept', ontologyStateSvc.listItem.conceptSchemes.index, scheme['@id']);
                    this.json['@id'] = scheme['@id'];
                    expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.json);
                }, this);
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
                expect(ontologyStateSvc.listItem.conceptSchemes.flat).toEqual([{prop: 'entity'}]);
                expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(this.controller.concept, this.controller.language);
                expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, this.controller.concept);
                expect(ontoUtils.addConcept).toHaveBeenCalledWith(this.controller.concept);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.controller.concept);
                expect(ontoUtils.addIndividual).toHaveBeenCalledWith(this.controller.concept);
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith(this.controller.concept['@id']);
                expect(ontologyStateSvc.showCreateConceptOverlay).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
            it('if in the vocabulary editor', function() {
                this.controller.create();
                expect(this.schemes.scheme1[prefixes.skos + 'hasTopConcept'].length).toBe(2);
                expect(this.schemes.scheme2[prefixes.skos + 'hasTopConcept'].length).toBe(1);
                this.controller.schemes.forEach(function(scheme) {
                    expect(ontologyStateSvc.addEntityToHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes.hierarchy, 'concept', ontologyStateSvc.listItem.conceptSchemes.index, scheme['@id']);
                    this.json['@id'] = scheme['@id'];
                    expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.json);
                }, this);
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
                expect(ontologyStateSvc.listItem.conceptSchemes.flat).toEqual([{prop: 'entity'}]);
                expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(this.controller.concept, this.controller.language);
                expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, this.controller.concept);
                expect(ontoUtils.addConcept).toHaveBeenCalledWith(this.controller.concept);
                /*expect(ontologyStateSvc.listItem.concepts.hierarchy).toContain({entityIRI: this.controller.concept['@id']});
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.concepts.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
                expect(ontologyStateSvc.listItem.concepts.flat).toEqual([{prop: 'entity'}]);*/
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.controller.concept);
                expect(ontoUtils.addIndividual).not.toHaveBeenCalled();
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith(this.controller.concept['@id']);
                expect(ontologyStateSvc.showCreateConceptOverlay).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
        });
    });
    it('should call create when the button is clicked', function() {
        spyOn(this.controller, 'create');
        var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.create).toHaveBeenCalled();
    });
    it('should set the correct state when the cancel button is clicked', function() {
        var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showCreateConceptOverlay).toBe(false);
    });
});
