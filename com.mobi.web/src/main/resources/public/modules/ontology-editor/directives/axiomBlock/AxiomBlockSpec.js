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
describe('Axiom Block directive', function() {
    var $compile, scope, ontologyStateSvc, ontologyManagerSvc, propertyManagerSvc, ontoUtils, prefixes, modalSvc;

    beforeEach(function() {
        module('templates');
        module('axiomBlock');
        mockOntologyState();
        mockOntologyManager();
        mockOntologyUtilsManager();
        mockPropertyManager();
        mockModal();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyManagerService_, _propertyManagerService_, _ontologyUtilsManagerService_, _prefixes_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            propertyManagerSvc = _propertyManagerService_;
            ontoUtils = _ontologyUtilsManagerService_;
            prefixes = _prefixes_;
            modalSvc = _modalService_;
        });

        this.element = $compile(angular.element('<axiom-block></axiom-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('axiomBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontologyManagerSvc = null;
        propertyManagerSvc = null;
        ontoUtils = null;
        prefixes = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        describe('should open the correct modal if the selected entity is a', function() {
            it('class', function() {
                ontologyManagerSvc.isClass.and.returnValue(true);
                this.controller.showAxiomOverlay();
                expect(modalSvc.openModal).toHaveBeenCalledWith('axiomOverlay', {axiomList: propertyManagerSvc.classAxiomList}, this.controller.updateClassHierarchy);
            });
            it('data property', function() {
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
                this.controller.showAxiomOverlay();
                expect(modalSvc.openModal).toHaveBeenCalledWith('axiomOverlay', {axiomList: propertyManagerSvc.datatypeAxiomList}, this.controller.updateDataPropHierarchy);
            });
            it('object property', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                this.controller.showAxiomOverlay();
                expect(modalSvc.openModal).toHaveBeenCalledWith('axiomOverlay', {axiomList: propertyManagerSvc.objectAxiomList}, this.controller.updateObjectPropHierarchy);
            });
        });
        describe('should update the class hierarchy', function() {
            beforeEach(function() {
                this.values = ['iri'];
                this.axiom = 'axiom';
            });
            it('unless the axiom is not subClassOf or there are no values', function() {
                this.controller.updateClassHierarchy({axiom: this.axiom, values: this.values});
                expect(ontologyStateSvc.addEntityToHierarchy).not.toHaveBeenCalled();

                this.axiom = prefixes.rdfs + 'subClassOf';
                this.values = [];
                this.controller.updateClassHierarchy({axiom: this.axiom, values: this.values});
                expect(ontologyStateSvc.addEntityToHierarchy).not.toHaveBeenCalled();
                expect(ontologyStateSvc.setVocabularyStuff).not.toHaveBeenCalled();
            });
            describe('if the axiom is subClassOf', function() {
                beforeEach(function() {
                    this.axiom = prefixes.rdfs + 'subClassOf';
                });
                it('and is present in the individual hierarchy', function () {
                    ontologyStateSvc.listItem.individualsParentPath = [ontologyStateSvc.listItem.selected['@id']];
                    this.controller.updateClassHierarchy({axiom: this.axiom, values: this.values});
                    expect(ontoUtils.setSuperClasses).toHaveBeenCalledWith('id', this.values);
                    expect(ontoUtils.updateflatIndividualsHierarchy).toHaveBeenCalledWith(this.values);
                    expect(ontologyStateSvc.setVocabularyStuff).toHaveBeenCalled();
                });
                it('and is not present in the individual hierarchy', function () {
                    this.controller.updateClassHierarchy({axiom: this.axiom, values: this.values});
                    expect(ontoUtils.setSuperClasses).toHaveBeenCalledWith('id', this.values);
                    expect(ontoUtils.updateflatIndividualsHierarchy).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.setVocabularyStuff).toHaveBeenCalled();
                });
            });
        });
        describe('should update the data property hierarchy', function() {
            beforeEach(function() {
                this.axiom = 'axiom';
                this.values = ['value'];
            });
            it('unless the axiom is not subPropertyOf or domain or there are no values', function() {
                this.controller.updateDataPropHierarchy({axiom: this.axiom, values: this.values});
                expect(ontoUtils.setSuperProperties).not.toHaveBeenCalled();
                expect(ontologyStateSvc.createFlatEverythingTree).not.toHaveBeenCalled();

                this.axiom = prefixes.rdfs + 'subPropertyOf';
                this.values = [];
                this.controller.updateDataPropHierarchy({axiom: this.axiom, values: this.values});
                expect(ontoUtils.setSuperProperties).not.toHaveBeenCalled();
                expect(ontologyStateSvc.createFlatEverythingTree).not.toHaveBeenCalled();

                this.axiom = prefixes.rdfs + 'domain';
                this.controller.updateDataPropHierarchy({axiom: this.axiom, values: this.values});
                expect(ontoUtils.setSuperProperties).not.toHaveBeenCalled();
                expect(ontologyStateSvc.createFlatEverythingTree).not.toHaveBeenCalled();
            });
            it('if the axiom is subPropertyOf', function() {
                this.axiom = prefixes.rdfs + 'subPropertyOf';
                this.controller.updateDataPropHierarchy({axiom: this.axiom, values: this.values});
                expect(ontoUtils.setSuperProperties).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], this.values, 'dataProperties');
            });
            it('if the axiom is domain', function() {
                this.axiom = prefixes.rdfs + 'domain';
                ontologyStateSvc.createFlatEverythingTree.and.returnValue([{prop: 'everything'}]);
                ontologyStateSvc.getOntologiesArray.and.returnValue([]);
                this.controller.updateDataPropHierarchy({axiom: this.axiom, values: this.values});
                expect(ontologyStateSvc.getOntologiesArray).toHaveBeenCalled();
                expect(ontologyStateSvc.createFlatEverythingTree).toHaveBeenCalledWith([], ontologyStateSvc.listItem);
                expect(ontologyStateSvc.listItem.flatEverythingTree).toEqual([{prop: 'everything'}]);
            });
        });
        describe('should update the object property hierarchy', function() {
            beforeEach(function() {
                this.values = ['iri'];
                this.axiom = 'axiom';
            });
            it('unless the axiom is not subPropertyOf or domain or there are no values', function() {
                this.controller.updateObjectPropHierarchy({axiom: this.axiom, values: this.values});
                expect(ontoUtils.setSuperProperties).not.toHaveBeenCalled();
                expect(ontologyStateSvc.createFlatEverythingTree).not.toHaveBeenCalled();

                this.axiom = prefixes.rdfs + 'subPropertyOf';
                this.values = [];
                this.controller.updateObjectPropHierarchy({axiom: this.axiom, values: this.values});
                expect(ontoUtils.setSuperProperties).not.toHaveBeenCalled();
                expect(ontologyStateSvc.createFlatEverythingTree).not.toHaveBeenCalled();

                this.axiom = prefixes.rdfs + 'domain';
                this.controller.updateObjectPropHierarchy({axiom: this.axiom, values: this.values});
                expect(ontoUtils.setSuperProperties).not.toHaveBeenCalled();
                expect(ontologyStateSvc.createFlatEverythingTree).not.toHaveBeenCalled();
            });
            describe('if the axiom is subPropertyOf', function() {
                it('and is a derived semanticRelation', function() {
                    this.axiom = prefixes.rdfs + 'subPropertyOf';
                    ontoUtils.containsDerivedSemanticRelation.and.returnValue(true);
                    this.controller.updateObjectPropHierarchy({axiom: this.axiom, values: this.values});
                    expect(ontoUtils.setSuperProperties).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], this.values, 'objectProperties');
                    expect(ontologyStateSvc.setVocabularyStuff).toHaveBeenCalled();
                });
                it('and is not a derived semanticRelation', function() {
                    this.axiom = prefixes.rdfs + 'subPropertyOf';
                    this.controller.updateObjectPropHierarchy({axiom: this.axiom, values: this.values});
                    expect(ontoUtils.setSuperProperties).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], this.values, 'objectProperties');
                    expect(ontologyStateSvc.setVocabularyStuff).not.toHaveBeenCalled();
                });
            });
            it('if the axiom is domain', function() {
                this.axiom = prefixes.rdfs + 'domain';
                ontologyStateSvc.createFlatEverythingTree.and.returnValue([{prop: 'everything'}]);
                ontologyStateSvc.getOntologiesArray.and.returnValue([]);
                this.controller.updateObjectPropHierarchy({axiom: this.axiom, values: this.values});
                expect(ontologyStateSvc.getOntologiesArray).toHaveBeenCalled();
                expect(ontologyStateSvc.createFlatEverythingTree).toHaveBeenCalledWith([], ontologyStateSvc.listItem);
                expect(ontologyStateSvc.listItem.flatEverythingTree).toEqual([{prop: 'everything'}]);
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('axiom-block')).toBe(true);
        });
        it('with a .section-header', function() {
            expect(this.element.querySelectorAll('.section-header').length).toBe(1);
        });
        it('based on whether something is selected and the user can modify the branch', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toBe(1);

            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toBe(0);
        });
        it('when the user cannot modify the branch', function() {
            ontologyStateSvc.canModify.and.returnValue(false);
            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toBe(0);
        });
        it('based on whether the selected entity is imported', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toBe(1);

            ontologyStateSvc.listItem.selected.mobi = {imported: true};
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toBe(0);
        });
        it('based on whether a class is selected', function() {
            ontologyManagerSvc.isClass.and.returnValue(true);
            scope.$digest();
            expect(this.element.find('class-axioms').length).toBe(1);

            ontologyManagerSvc.isClass.and.returnValue(false);
            scope.$digest();
            expect(this.element.find('class-axioms').length).toBe(0);
        });
        it('based on whether an object property is selected', function() {
            ontologyManagerSvc.isObjectProperty.and.returnValue(true);
            scope.$digest();
            expect(this.element.find('object-property-axioms').length).toBe(1);

            ontologyManagerSvc.isObjectProperty.and.returnValue(false);
            scope.$digest();
            expect(this.element.find('object-property-axioms').length).toBe(0);
        });
        it('based on whether a datatype property is selected', function() {
            ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
            scope.$digest();
            expect(this.element.find('datatype-property-axioms').length).toBe(1);

            ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
            scope.$digest();
            expect(this.element.find('datatype-property-axioms').length).toBe(0);
        });
    });
    it('should call showAxiomOverlay when the add axiom link is clicked', function() {
        ontologyStateSvc.canModify.and.returnValue(true);
        scope.$digest();
        spyOn(this.controller, 'showAxiomOverlay');
        var link = angular.element(this.element.querySelectorAll('.section-header a')[0]);
        link.triggerHandler('click');
        expect(this.controller.showAxiomOverlay).toHaveBeenCalled();
    });
});