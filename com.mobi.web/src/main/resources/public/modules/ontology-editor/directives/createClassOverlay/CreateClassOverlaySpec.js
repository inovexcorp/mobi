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
describe('Create Class Overlay directive', function() {
    var $compile, scope, $q, ontologyStateSvc, prefixes, ontoUtils;

    beforeEach(function() {
        module('templates');
        module('createClassOverlay');
        mockOntologyState();
        mockPrefixes();
        mockOntologyUtilsManager();
        injectCamelCaseFilter();

        inject(function(_$q_, _$compile_, _$rootScope_, _ontologyStateService_, _prefixes_, _ontologyUtilsManagerService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            prefixes = _prefixes_;
            ontoUtils = _ontologyUtilsManagerService_;
        });

        this.iri = 'iri#';
        ontologyStateSvc.getDefaultPrefix.and.returnValue(this.iri);
        this.element = $compile(angular.element('<create-class-overlay></create-class-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('createClassOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        ontologyStateSvc = null;
        prefixes = null;
        ontoUtils = null;
        this.element.remove();
    });

    describe('initializes with the correct values', function() {
        it('if parent ontology is opened', function() {
            expect(ontologyStateSvc.getDefaultPrefix).toHaveBeenCalled();
            expect(this.controller.prefix).toBe(this.iri);
            expect(this.controller.clazz['@id']).toBe(this.controller.prefix);
            expect(this.controller.clazz['@type']).toEqual(['Class']);
        });
        it('if parent ontology is not opened', function() {
            expect(ontologyStateSvc.getDefaultPrefix).toHaveBeenCalled();
            expect(this.controller.prefix).toBe(this.iri);
            expect(this.controller.clazz['@id']).toBe(this.controller.prefix);
            expect(this.controller.clazz['@type']).toEqual(['Class']);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('create-class-overlay')).toBe(true);
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
            expect(this.element.find('custom-label').length).toBe(1);
        });
        it('with a text-area', function() {
            expect(this.element.find('text-area').length).toBe(1);
        });
        it('with a .btn-container', function() {
            expect(this.element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('with an advanced-language-select', function() {
            expect(this.element.find('advanced-language-select').length).toBe(1);
        });
        it('with a super-class-select', function() {
            expect(this.element.find('super-class-select').length).toBe(1);
        });
        it('depending on whether there is an error', function() {
            expect(this.element.find('error-display').length).toBe(0);

            this.controller.error = 'Error';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('with buttons to create and cancel', function() {
            var buttons = this.element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Create']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Create']).toContain(angular.element(buttons[1]).text().trim());
        });
        it('depending on whether the class IRI already exists in the ontology.', function() {
            ontoUtils.checkIri.and.returnValue(true);
            scope.$digest();

            var disabled = this.element.querySelectorAll('[disabled]');
            expect(disabled.length).toBe(1);
            expect(angular.element(disabled[0]).text()).toBe('Create');
        });
    });
    describe('controller methods', function() {
        describe('nameChanged', function() {
            beforeEach(function() {
                this.controller.clazz = {};
                this.controller.clazz[prefixes.dcterms + 'title'] = [{'@value': 'Name'}];
                this.controller.prefix = 'start';
            });
            it('changes iri if iriHasChanged is false', function() {
                this.controller.iriHasChanged = false;
                this.controller.nameChanged();
                expect(this.controller.clazz['@id']).toEqual(this.controller.prefix + this.controller.clazz[prefixes.dcterms +
                    'title'][0]['@value']);
            });
            it('does not change iri if iriHasChanged is true', function() {
                this.controller.iriHasChanged = true;
                this.controller.clazz['@id'] = 'iri';
                this.controller.nameChanged();
                expect(this.controller.clazz['@id']).toEqual('iri');
            });
        });
        it('onEdit changes iri based on the params', function() {
            this.controller.onEdit('begin', 'then', 'end');
            expect(this.controller.clazz['@id']).toBe('begin' + 'then' + 'end');
            expect(this.controller.iriHasChanged).toBe(true);
            expect(ontologyStateSvc.setCommonIriParts).toHaveBeenCalledWith('begin', 'then');
        });
        describe('create calls the correct manager functions when controller.values', function() {
            beforeEach(function() {
                ontologyStateSvc.createFlatEverythingTree.and.returnValue([{prop: 'everything'}]);
                ontologyStateSvc.flattenHierarchy.and.returnValue([{prop: 'entity'}]);
                ontologyStateSvc.getOntologiesArray.and.returnValue([]);
                ontologyStateSvc.listItem.classes.hierarchy = [];
                this.controller.language = 'en';
                this.controller.clazz = {'@id': 'class-iri'};
                this.controller.clazz[prefixes.dcterms + 'title'] = [{'@value': 'label'}];
                this.controller.clazz[prefixes.dcterms + 'description'] = [{'@value': 'description'}];
            });
            it('is empty', function() {
                this.controller.create();
                expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(this.controller.clazz, this.controller.language);
                expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, this.controller.clazz);
                expect(ontologyStateSvc.getOntologiesArray).toHaveBeenCalled();
                expect(ontologyStateSvc.createFlatEverythingTree).toHaveBeenCalledWith([], ontologyStateSvc.listItem);
                expect(ontologyStateSvc.listItem.flatEverythingTree).toEqual([{prop: 'everything'}]);
                expect(ontologyStateSvc.addToClassIRIs).toHaveBeenCalledWith(ontologyStateSvc.listItem, this.controller.clazz['@id']);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.controller.clazz);
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.classes.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
                expect(ontologyStateSvc.listItem.classes.flat).toEqual([{prop: 'entity'}]);
                expect(ontologyStateSvc.listItem.classes.hierarchy).toContain({'entityIRI': 'class-iri'});
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith(this.controller.clazz['@id']);
                expect(ontologyStateSvc.showCreateClassOverlay).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(ontoUtils.setSuperClasses).not.toHaveBeenCalled();
            });
            describe('has values', function() {
                beforeEach(function () {
                    this.controller.values = [{'@id': 'classA'}];
                });
                it('including a derived concept', function() {
                    ontoUtils.containsDerivedConcept.and.returnValue(true);
                    this.controller.create();
                    expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(this.controller.clazz, this.controller.language);
                    expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, this.controller.clazz);
                    expect(ontologyStateSvc.getOntologiesArray).toHaveBeenCalled();
                    expect(ontologyStateSvc.createFlatEverythingTree).toHaveBeenCalledWith([], ontologyStateSvc.listItem);
                    expect(ontologyStateSvc.listItem.flatEverythingTree).toEqual([{prop: 'everything'}]);
                    expect(ontologyStateSvc.addToClassIRIs).toHaveBeenCalledWith(ontologyStateSvc.listItem, this.controller.clazz['@id']);
                    expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.controller.clazz);
                    expect(ontologyStateSvc.flattenHierarchy).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith(this.controller.clazz['@id']);
                    expect(ontologyStateSvc.showCreateClassOverlay).toBe(false);
                    expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                    expect(ontologyStateSvc.listItem.classes.hierarchy).toEqual([]);
                    expect(_.get(this.controller.clazz, prefixes.rdfs + 'subClassOf')).toEqual([{'@id': 'classA'}]);
                    expect(ontologyStateSvc.listItem.derivedConcepts).toContain('class-iri');
                    expect(ontoUtils.setSuperClasses).toHaveBeenCalledWith('class-iri', ['classA']);
                });
                it('without a derived concept', function() {
                    this.controller.create();
                    expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(this.controller.clazz, this.controller.language);
                    expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, this.controller.clazz);
                    expect(ontologyStateSvc.getOntologiesArray).toHaveBeenCalled();
                    expect(ontologyStateSvc.createFlatEverythingTree).toHaveBeenCalledWith([], ontologyStateSvc.listItem);
                    expect(ontologyStateSvc.listItem.flatEverythingTree).toEqual([{prop: 'everything'}]);
                    expect(ontologyStateSvc.addToClassIRIs).toHaveBeenCalledWith(ontologyStateSvc.listItem, this.controller.clazz['@id']);
                    expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.controller.clazz);
                    expect(ontologyStateSvc.flattenHierarchy).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith(this.controller.clazz['@id']);
                    expect(ontologyStateSvc.showCreateClassOverlay).toBe(false);
                    expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                    expect(ontologyStateSvc.listItem.classes.hierarchy).toEqual([]);
                    expect(_.get(this.controller.clazz, prefixes.rdfs + 'subClassOf')).toEqual([{'@id': 'classA'}]);
                    expect(ontologyStateSvc.listItem.derivedConcepts).toEqual([]);
                    expect(ontoUtils.setSuperClasses).toHaveBeenCalledWith('class-iri', ['classA']);
                });
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
        expect(ontologyStateSvc.showCreateClassOverlay).toBe(false);
    });
});
