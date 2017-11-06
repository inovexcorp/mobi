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
describe('Object Property Axioms directive', function() {
    var $compile, scope, ontologyStateSvc, propertyManagerSvc, resObj, prefixes, ontoUtils, ontologyManagerSvc;

    beforeEach(function() {
        module('templates');
        module('objectPropertyAxioms');
        injectShowPropertiesFilter();
        mockOntologyState();
        mockPropertyManager();
        mockResponseObj();
        mockPrefixes();
        mockOntologyUtilsManager();
        mockOntologyManager();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _propertyManagerService_, _responseObj_, _prefixes_, _ontologyUtilsManagerService_, _ontologyManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            propertyManagerSvc = _propertyManagerService_;
            resObj = _responseObj_;
            prefixes = _prefixes_;
            ontoUtils = _ontologyUtilsManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
        });

        ontologyStateSvc.listItem.selected = {
            'axiom1': [{'@value': 'value1'}],
            'axiom2': [{'@value': 'value2'}]
        };
        this.element = $compile(angular.element('<object-property-axioms></object-property-axioms>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('objectPropertyAxioms');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        propertyManagerSvc = null;
        resObj = null;
        prefixes = null;
        ontoUtils = null;
        ontologyManagerSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('object-property-axioms')).toBe(true);
        });
        it('depending on how many axioms there are', function() {
            expect(this.element.find('property-values').length).toBe(2);
            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(this.element.find('property-values').length).toBe(0);
        });
        it('depending on whether an axiom is being removed', function() {
            expect(this.element.find('remove-property-overlay').length).toBe(0);

            this.controller.showRemoveOverlay = true;
            scope.$digest();
            expect(this.element.find('remove-property-overlay').length).toBe(1);
        });
        it('depending on whether an axiom is being shown', function() {
            expect(this.element.find('axiom-overlay').length).toBe(0);

            ontologyStateSvc.showAxiomOverlay = true;
            scope.$digest();
            expect(this.element.find('axiom-overlay').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            ontologyStateSvc.listItem.selected.mobi = {originalIRI: ''};
        });
        it('should open the remove overlay', function() {
            this.controller.openRemoveOverlay('key', 0);
            expect(this.controller.key).toBe('key');
            expect(this.controller.index).toBe(0);
            expect(this.controller.showRemoveOverlay).toBe(true);
        });
        describe('should update the hierarchy', function() {
            beforeEach(function() {
                this.values = [{}];
                this.axiom = {};
            });
            it('unless the axiom is not subPropertyOf or domain or there are no values', function() {
                this.controller.updateHierarchy(this.axiom, this.values);
                expect(ontoUtils.setSuperProperties).not.toHaveBeenCalled();
                expect(resObj.getItemIri).not.toHaveBeenCalled();
                expect(ontologyStateSvc.createFlatEverythingTree).not.toHaveBeenCalled();

                this.axiom.localName = 'subPropertyOf';
                this.values = [];
                this.controller.updateHierarchy(this.axiom, this.values);
                expect(ontoUtils.setSuperProperties).not.toHaveBeenCalled();
                expect(resObj.getItemIri).not.toHaveBeenCalled();
                expect(ontologyStateSvc.createFlatEverythingTree).not.toHaveBeenCalled();

                this.axiom.localName = 'domain';
                this.controller.updateHierarchy(this.axiom, this.values);
                expect(ontoUtils.setSuperProperties).not.toHaveBeenCalled();
                expect(resObj.getItemIri).not.toHaveBeenCalled();
                expect(ontologyStateSvc.createFlatEverythingTree).not.toHaveBeenCalled();
            });
            it('if the axiom is subPropertyOf', function() {
                this.axiom.localName = 'subPropertyOf';
                resObj.getItemIri.and.returnValue('iri');
                this.controller.updateHierarchy(this.axiom, this.values);
                expect(ontoUtils.setSuperProperties).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], ['iri'], 'objectProperties');
            });
            it('if the axiom is domain', function() {
                this.axiom.localName = 'domain';
                ontologyStateSvc.createFlatEverythingTree.and.returnValue([{prop: 'everything'}]);
                ontologyStateSvc.getOntologiesArray.and.returnValue([]);
                this.controller.updateHierarchy(this.axiom, this.values);
                expect(ontologyStateSvc.getOntologiesArray).toHaveBeenCalled();
                expect(ontologyStateSvc.createFlatEverythingTree).toHaveBeenCalledWith([], ontologyStateSvc.listItem);
                expect(ontologyStateSvc.listItem.flatEverythingTree).toEqual([{prop: 'everything'}]);
            });
        });
        describe('should remove a class from the hierarchy', function() {
            beforeEach(function() {
                this.axiomObject = {'@id': 'axiom'};
            });
            it('unless the selected key is not subPropertyOf or the value is a blank node', function() {
                this.controller.removeFromHierarchy(this.axiomObject);
                expect(ontologyStateSvc.deleteEntityFromParentInHierarchy).not.toHaveBeenCalled();
                expect(ontologyStateSvc.flattenHierarchy).not.toHaveBeenCalled();

                this.controller.key = prefixes.rdfs + 'subPropertyOf';
                ontologyManagerSvc.isBlankNodeId.and.returnValue(true);
                this.controller.removeFromHierarchy(this.axiomObject);
                expect(ontologyStateSvc.deleteEntityFromParentInHierarchy).not.toHaveBeenCalled();
                expect(ontologyStateSvc.flattenHierarchy).not.toHaveBeenCalled();
            });
            it('if the selected key is subPropertyOf', function() {
                this.controller.key = prefixes.rdfs + 'subPropertyOf';
                ontologyStateSvc.flattenHierarchy.and.returnValue([{entityIRI: 'new'}]);
                this.controller.removeFromHierarchy(this.axiomObject);
                expect(ontologyStateSvc.deleteEntityFromParentInHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.objectProperties.hierarchy, ontologyStateSvc.listItem.selected['@id'], this.axiomObject['@id'], ontologyStateSvc.listItem.objectProperties.index);
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.objectProperties.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
                expect(ontologyStateSvc.listItem.objectProperties.flat).toEqual([{entityIRI: 'new'}]);
            });
        });
    });
});