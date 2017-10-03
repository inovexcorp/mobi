/*-
 * #%L
 * org.matonto.web
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
describe('Relationships Block directive', function() {
    var $compile, scope, element, ontologyStateSvc, controller, resObj, prefixes;
    var broaderRelations = ['broader', 'broaderTransitive', 'broadMatch'];
    var narrowerRelations = ['narrower', 'narrowerTransitive', 'narrowMatch'];
    var conceptToScheme = ['inScheme', 'topConceptOf'];
    var schemeToConcept = ['hasTopConcept'];
    var values = [{'@id': 'value1'}, {'@id': 'value2'}];

    beforeEach(function() {
        module('templates');
        module('relationshipsBlock');
        injectShowPropertiesFilter();
        mockOntologyState();
        mockPrefixes();
        mockResponseObj();
        mockOntologyUtilsManager();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _responseObj_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            resObj = _responseObj_;
            prefixes = _prefixes_;
        });

        scope.relationshipList = [];
        ontologyStateSvc.listItem.ontologyRecord.recordId = 'recordId';
        ontologyStateSvc.listItem.selected = {
            '@id': 'selectedId',
            'prop1': [{'@id': 'value1'}],
            'prop2': [{'@value': 'value2'}]
        };
        ontologyStateSvc.flattenHierarchy.and.returnValue([{prop: 'flat'}]);
        element = $compile(angular.element('<relationships-block relationship-list="relationshipList"></relationships-block>'))(scope);
        scope.$digest();
        controller = element.controller('relationshipsBlock');
    });

    describe('controller bound variable', function() {
        beforeEach(function() {
            controller = element.controller('relationshipsBlock');
        });
        it('relationshipList is two way bound', function() {
            controller.relationshipList = [{}];
            scope.$digest();
            expect(scope.relationshipList).toEqual([{}]);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('relationships-block')).toBe(true);
            expect(element.hasClass('axiom-block')).toBe(true);
        });
        it('with a block', function() {
            expect(element.find('block').length).toBe(1);
        });
        it('with a block-header', function() {
            expect(element.find('block-header').length).toBe(1);
        });
        it('depending on how many annotations there are', function() {
            expect(element.find('property-values').length).toBe(2);
            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(element.find('property-values').length).toBe(0);
        });
        it('with a block-content', function() {
            expect(element.find('block-content').length).toBe(1);
        });
        it('with a remove-property-overlay', function() {
            expect(element.find('remove-property-overlay').length).toBe(0);

            controller.showRemoveOverlay = true;
            scope.$apply();
            
            expect(element.find('remove-property-overlay').length).toBe(1);
        });
        it('with a relationship-overlay', function() {
            expect(element.find('relationship-overlay').length).toBe(0);

            ontologyStateSvc.showRelationshipOverlay = true;
            scope.$apply();
            
            expect(element.find('relationship-overlay').length).toBe(1);
        });
        it('with a .fa-plus', function() {
            expect(element.querySelectorAll('.fa-plus').length).toBe(1);
        });
        it('with property-values', function() {
            expect(element.find('property-values').length).toBe(2);
            ontologyStateSvc.listItem.selected = undefined;
            scope.$apply();
            expect(element.find('property-values').length).toBe(0);
        });
        it('with a block-header a', function() {
            expect(element.querySelectorAll('block-header a').length).toBe(1);
            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(element.querySelectorAll('block-header a').length).toBe(0);
        });
    });
    describe('controller methods', function() {
        it('openRemoveOverlay sets the correct variables', function() {
            controller.openRemoveOverlay('key', 1);
            expect(controller.key).toBe('key');
            expect(controller.index).toBe(1);
            expect(controller.showRemoveOverlay).toBe(true);
        });
        describe('updateHierarchy should call proper methods when the relationship', function() {
            beforeEach(function() {
                resObj.getItemIri.and.callFake(function(item) {
                    return prefixes.skos + item;
                });
            });
            describe('is', function() {
                updateHierarchyTest(broaderRelations, narrowerRelations, 'conceptHierarchy', 'conceptIndex', 'flatConceptHierarchy', 'selectedId');
            });
            describe('is', function() {
                updateHierarchyTest(narrowerRelations, broaderRelations, 'conceptHierarchy', 'conceptIndex', 'flatConceptHierarchy', undefined, 'selectedId');
            });
            describe('is', function() {
                updateHierarchyTest(conceptToScheme, schemeToConcept, 'conceptSchemeHierarchy', 'conceptSchemeIndex', 'flatConceptSchemeHierarchy', 'selectedId');
            });
            describe('is', function() {
                updateHierarchyTest(schemeToConcept, conceptToScheme, 'conceptSchemeHierarchy', 'conceptSchemeIndex', 'flatConceptSchemeHierarchy', undefined, 'selectedId');
            });
        });
        describe('removeFromHierarchy should call the proper methods when the relationship', function() {
            describe('is', function() {
                removeHierarchyTest(broaderRelations, narrowerRelations, 'conceptHierarchy', 'flatConceptHierarchy', 'selectedId', 'value1');
            });
            describe('is', function() {
                removeHierarchyTest(narrowerRelations, broaderRelations, 'conceptHierarchy', 'flatConceptHierarchy', 'value1', 'selectedId');
            });
            describe('is', function() {
                removeHierarchyTest(conceptToScheme, schemeToConcept, 'conceptSchemeHierarchy', 'flatConceptSchemeHierarchy', 'selectedId');
            });
            describe('is', function() {
                removeHierarchyTest(schemeToConcept, conceptToScheme, 'conceptSchemeHierarchy', 'flatConceptSchemeHierarchy', 'value1');
            });
        });
    });
    it('should set the correct state when the add relationship link is clicked', function() {
        var link = angular.element(element.querySelectorAll('block-header a')[0]);
        link.triggerHandler('click');
        expect(ontologyStateSvc.showRelationshipOverlay).toBe(true);
    });

    function createDummyEntity(property, vals) {
        var entity = {};
        entity[prefixes.skos + property] = vals || values;
        return entity;
    }

    function updateHierarchyTest(targetArray, otherArray, hierarchyName, indexName, flatHierarchyName, entityIRI, parentIRI) {
        _.forEach(targetArray, function(relationship) {
            it(relationship + ' and should be updated', function() {
                controller.updateHierarchy(relationship, values);
                _.forEach(values, function(value) {
                    expect(ontologyStateSvc.getEntityByRecordId).toHaveBeenCalledWith('recordId', value['@id'], ontologyStateSvc.listItem);
                    expect(ontologyStateSvc.addEntityToHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem[hierarchyName], entityIRI || value['@id'], ontologyStateSvc.listItem[indexName], parentIRI || value['@id']);
                });
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem[hierarchyName], 'recordId');
                expect(ontologyStateSvc.listItem[flatHierarchyName]).toEqual([{prop: 'flat'}]);
            });
            describe(relationship + ' and should not be updated when target entity has relationship', function() {
                _.forEach(otherArray, function(otherRelationship) {
                    it(otherRelationship, function() {
                        ontologyStateSvc.getEntityByRecordId.and.returnValue(createDummyEntity(otherRelationship));
                        controller.updateHierarchy(relationship, values);
                        _.forEach(values, function(value) {
                            expect(ontologyStateSvc.getEntityByRecordId).toHaveBeenCalledWith('recordId', value['@id'], ontologyStateSvc.listItem);
                        });
                        expect(ontologyStateSvc.addEntityToHierarchy).not.toHaveBeenCalled();
                        expect(ontologyStateSvc.flattenHierarchy).not.toHaveBeenCalled();
                    });
                });
            });
        });
    }

    function removeHierarchyTest(targetArray, otherArray, hierarchyName, flatHierarchyName, entityIRI, parentIRI) {
        _.forEach(targetArray, function(relationship) {
            beforeEach(function() {
                controller.key = prefixes.skos + relationship;
            });
            it(relationship + ' and should be updated', function() {
                controller.removeFromHierarchy({'@id': 'value1'});
                expect(ontologyStateSvc.getEntityByRecordId).toHaveBeenCalledWith('recordId', 'value1', ontologyStateSvc.listItem);
                if (parentIRI) {
                    expect(ontologyStateSvc.deleteEntityFromParentInHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptHierarchy, entityIRI, parentIRI, ontologyStateSvc.listItem.conceptIndex);
                } else {
                    expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemeHierarchy, entityIRI, ontologyStateSvc.listItem.conceptSchemeIndex);
                }
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem[hierarchyName], 'recordId');
                expect(ontologyStateSvc.listItem[flatHierarchyName]).toEqual([{prop: 'flat'}]);
                expect(ontologyStateSvc.goTo).toHaveBeenCalledWith('selectedId');
            });
            describe(relationship + ' and should not be updated when target entity has relationship', function() {
                _.forEach(otherArray, function(otherRelationship) {
                    it(otherRelationship, function() {
                        ontologyStateSvc.getEntityByRecordId.and.returnValue(createDummyEntity(otherRelationship, [{'@id': 'selectedId'}]));
                        controller.removeFromHierarchy({'@id': 'value1'});
                        expect(ontologyStateSvc.getEntityByRecordId).toHaveBeenCalledWith('recordId', 'value1', ontologyStateSvc.listItem);
                        if (parentIRI) {
                            expect(ontologyStateSvc.deleteEntityFromParentInHierarchy).not.toHaveBeenCalled();
                        } else {
                            expect(ontologyStateSvc.deleteEntityFromHierarchy).not.toHaveBeenCalled();
                        }
                        expect(ontologyStateSvc.flattenHierarchy).not.toHaveBeenCalled();
                        expect(ontologyStateSvc.goTo).not.toHaveBeenCalled();
                    });
                });
            });
        });
    }
});