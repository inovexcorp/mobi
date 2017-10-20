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
    var $compile, scope, element, controller, deferred, ontologyStateSvc, prefixes, ontoUtils;
    var iri = 'iri#';

    beforeEach(function() {
        module('templates');
        module('createClassOverlay');
        injectRegexConstant();
        injectCamelCaseFilter();
        injectSplitIRIFilter();
        mockOntologyState();
        mockPrefixes();
        mockOntologyUtilsManager();

        inject(function(_$q_, _$compile_, _$rootScope_, _ontologyStateService_, _prefixes_, _ontologyUtilsManagerService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            deferred = _$q_.defer();
            prefixes = _prefixes_;
            ontoUtils = _ontologyUtilsManagerService_;
        });

        ontologyStateSvc.getDefaultPrefix.and.returnValue(iri);
        element = $compile(angular.element('<create-class-overlay></create-class-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('createClassOverlay');
    });

    describe('initializes with the correct values', function() {
        it('if parent ontology is opened', function() {
            expect(ontologyStateSvc.getDefaultPrefix).toHaveBeenCalled();
            expect(controller.prefix).toBe(iri);
            expect(controller.clazz['@id']).toBe(controller.prefix);
            expect(controller.clazz['@type']).toEqual(['Class']);
        });
        it('if parent ontology is not opened', function() {
            expect(ontologyStateSvc.getDefaultPrefix).toHaveBeenCalled();
            expect(controller.prefix).toBe(iri);
            expect(controller.clazz['@id']).toBe(controller.prefix);
            expect(controller.clazz['@type']).toEqual(['Class']);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('create-class-overlay')).toBe(true);
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
            expect(element.find('custom-label').length).toBe(1);
        });
        it('with a text-area', function() {
            expect(element.find('text-area').length).toBe(1);
        });
        it('with a .btn-container', function() {
            expect(element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('with an advanced-language-select', function() {
            expect(element.find('advanced-language-select').length).toBe(1);
        });
        it('with a super-class-select', function() {
            expect(element.find('super-class-select').length).toBe(1);
        });
        it('depending on whether there is an error', function() {
            expect(element.find('error-display').length).toBe(0);

            controller = element.controller('createClassOverlay');
            controller.error = 'Error';
            scope.$digest();
            expect(element.find('error-display').length).toBe(1);
        });
        it('with buttons to create and cancel', function() {
            var buttons = element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Create']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Create']).toContain(angular.element(buttons[1]).text().trim());
        });
        it('depending on whether the class IRI already exists in the ontology.', function() {
            ontoUtils.checkIri.and.returnValue(true);
            
            scope.$digest();
            
            var disabled = element.querySelectorAll('[disabled]');
            expect(disabled.length).toBe(1);
            expect(angular.element(disabled[0]).text()).toBe('Create');
        });
    });
    describe('controller methods', function() {
        describe('nameChanged', function() {
            beforeEach(function() {
                controller.clazz = {};
                controller.clazz[prefixes.dcterms + 'title'] = [{'@value': 'Name'}];
                controller.prefix = 'start';
            });
            it('changes iri if iriHasChanged is false', function() {
                controller.iriHasChanged = false;
                controller.nameChanged();
                expect(controller.clazz['@id']).toEqual(controller.prefix + controller.clazz[prefixes.dcterms +
                    'title'][0]['@value']);
            });
            it('does not change iri if iriHasChanged is true', function() {
                controller.iriHasChanged = true;
                controller.clazz['@id'] = 'iri';
                controller.nameChanged();
                expect(controller.clazz['@id']).toEqual('iri');
            });
        });
        it('onEdit changes iri based on the params', function() {
            controller.onEdit('begin', 'then', 'end');
            expect(controller.clazz['@id']).toBe('begin' + 'then' + 'end');
            expect(controller.iriHasChanged).toBe(true);
            expect(ontologyStateSvc.setCommonIriParts).toHaveBeenCalledWith('begin', 'then');
        });
        describe('create calls the correct manager functions when controller.values', function() {
            beforeEach(function() {
                ontologyStateSvc.createFlatEverythingTree.and.returnValue([{prop: 'everything'}]);
                ontologyStateSvc.flattenHierarchy.and.returnValue([{prop: 'entity'}]);
                ontologyStateSvc.getOntologiesArray.and.returnValue([]);
                ontologyStateSvc.listItem.classHierarchy = [];
                controller.language = 'en';
                controller.clazz = {'@id': 'class-iri'};
                controller.clazz[prefixes.dcterms + 'title'] = [{'@value': 'label'}];
                controller.clazz[prefixes.dcterms + 'description'] = [{'@value': 'description'}];
            });
            it('is empty', function() {
                controller.create();
                expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(controller.clazz, controller.language);
                expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, controller.clazz);
                expect(ontologyStateSvc.getOntologiesArray).toHaveBeenCalled();
                expect(ontologyStateSvc.createFlatEverythingTree).toHaveBeenCalledWith([], ontologyStateSvc.listItem);
                expect(ontologyStateSvc.listItem.flatEverythingTree).toEqual([{prop: 'everything'}]);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, controller.clazz);
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.classHierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
                expect(ontologyStateSvc.listItem.flatClassHierarchy).toEqual([{prop: 'entity'}]);
                expect(ontologyStateSvc.listItem.classHierarchy).toContain({'entityIRI': 'class-iri'});
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith(controller.clazz['@id']);
                expect(ontologyStateSvc.showCreateClassOverlay).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(ontoUtils.setSuperClasses).not.toHaveBeenCalled();
            });
            it('has values', function() {
                controller.values = [{'@id': 'classA'}];
                controller.create();
                expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(controller.clazz, controller.language);
                expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, controller.clazz);
                expect(ontologyStateSvc.getOntologiesArray).toHaveBeenCalled();
                expect(ontologyStateSvc.createFlatEverythingTree).toHaveBeenCalledWith([], ontologyStateSvc.listItem);
                expect(ontologyStateSvc.listItem.flatEverythingTree).toEqual([{prop: 'everything'}]);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, controller.clazz);
                expect(ontologyStateSvc.flattenHierarchy).not.toHaveBeenCalled();
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith(controller.clazz['@id']);
                expect(ontologyStateSvc.showCreateClassOverlay).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.classHierarchy).toEqual([]);
                expect(_.get(controller.clazz, prefixes.rdfs + 'subClassOf')).toEqual([{'@id': 'classA'}]);
                expect(ontoUtils.setSuperClasses).toHaveBeenCalledWith('class-iri', ['classA']);
            });
        });
    });
    it('should call create when the button is clicked', function() {
        controller = element.controller('createClassOverlay');
        spyOn(controller, 'create');

        var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(controller.create).toHaveBeenCalled();
    });
    it('should set the correct state when the cancel button is clicked', function() {
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showCreateClassOverlay).toBe(false);
    });
});
