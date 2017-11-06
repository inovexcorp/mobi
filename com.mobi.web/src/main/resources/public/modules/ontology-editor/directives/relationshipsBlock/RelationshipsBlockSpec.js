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
describe('Relationships Block directive', function() {
    var $compile, scope, ontologyStateSvc, resObj, prefixes;
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
        this.element = $compile(angular.element('<relationships-block relationship-list="relationshipList"></relationships-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('relationshipsBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        resObj = null;
        prefixes = null;
        this.element.remove();
    });

    afterAll(function() {
        broaderRelations = null;
        narrowerRelations = null;
        conceptToScheme = null;
        schemeToConcept = null;
        values = null;
    });

    describe('controller bound variable', function() {
        it('relationshipList is two way bound', function() {
            this.controller.relationshipList = [{}];
            scope.$digest();
            expect(scope.relationshipList).toEqual([{}]);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('relationships-block')).toBe(true);
            expect(this.element.hasClass('axiom-block')).toBe(true);
        });
        it('with a block', function() {
            expect(this.element.find('block').length).toBe(1);
        });
        it('with a block-header', function() {
            expect(this.element.find('block-header').length).toBe(1);
        });
        it('depending on how many annotations there are', function() {
            expect(this.element.find('property-values').length).toBe(2);
            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(this.element.find('property-values').length).toBe(0);
        });
        it('with a block-content', function() {
            expect(this.element.find('block-content').length).toBe(1);
        });
        it('with a remove-property-overlay', function() {
            expect(this.element.find('remove-property-overlay').length).toBe(0);

            this.controller.showRemoveOverlay = true;
            scope.$apply();

            expect(this.element.find('remove-property-overlay').length).toBe(1);
        });
        it('with a relationship-overlay', function() {
            expect(this.element.find('relationship-overlay').length).toBe(0);

            ontologyStateSvc.showRelationshipOverlay = true;
            scope.$apply();

            expect(this.element.find('relationship-overlay').length).toBe(1);
        });
        it('with a .fa-plus', function() {
            expect(this.element.querySelectorAll('.fa-plus').length).toBe(1);
        });
        it('with property-values', function() {
            expect(this.element.find('property-values').length).toBe(2);
            ontologyStateSvc.listItem.selected = undefined;
            scope.$apply();
            expect(this.element.find('property-values').length).toBe(0);
        });
        it('with a block-header a', function() {
            expect(this.element.querySelectorAll('block-header a').length).toBe(1);
            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(this.element.querySelectorAll('block-header a').length).toBe(0);
        });
        it('with a .relationship-header', function() {
            expect(this.element.querySelectorAll('.relationship-header').length).toBe(1);
            ontologyStateSvc.getActiveKey.and.returnValue('schemes');
            scope.$digest();
            expect(this.element.querySelectorAll('.relationship-header').length).toBe(0);
        });
        it('with a .top-concept-header', function() {
            expect(this.element.querySelectorAll('.top-concept-header').length).toBe(0);
            ontologyStateSvc.getActiveKey.and.returnValue('schemes');
            scope.$digest();
            expect(this.element.querySelectorAll('.top-concept-header').length).toBe(1);
        });
        it('with a top-concept-overlay', function() {
            expect(this.element.find('top-concept-overlay').length).toBe(0);
            this.controller.showTopConceptOverlay = true;
            scope.$digest();
            expect(this.element.find('top-concept-overlay').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        it('openRemoveOverlay sets the correct variables', function() {
            this.controller.openRemoveOverlay('key', 1);
            expect(this.controller.key).toBe('key');
            expect(this.controller.index).toBe(1);
            expect(this.controller.showRemoveOverlay).toBe(true);
        });
        describe('updateHierarchy should call proper methods when the relationship', function() {
            beforeEach(function() {
                resObj.getItemIri.and.callFake(function(item) {
                    return prefixes.skos + item;
                });
            });
            describe('is', function() {
                updateHierarchyTest(broaderRelations, narrowerRelations, 'concepts', 'selectedId');
            });
            describe('is', function() {
                updateHierarchyTest(narrowerRelations, broaderRelations, 'concepts', undefined, 'selectedId');
            });
            describe('is', function() {
                updateHierarchyTest(conceptToScheme, schemeToConcept, 'conceptSchemes', 'selectedId');
            });
            describe('is', function() {
                updateHierarchyTest(schemeToConcept, conceptToScheme, 'conceptSchemes', undefined, 'selectedId');
            });
        });
        describe('removeFromHierarchy should call the proper methods when the relationship', function() {
            describe('is', function() {
                removeHierarchyTest(broaderRelations, narrowerRelations, 'concepts', 'selectedId', 'value1');
            });
            describe('is', function() {
                removeHierarchyTest(narrowerRelations, broaderRelations, 'concepts', 'value1', 'selectedId');
            });
            describe('is', function() {
                removeHierarchyTest(conceptToScheme, schemeToConcept, 'conceptSchemes', 'selectedId');
            });
            describe('is', function() {
                removeHierarchyTest(schemeToConcept, conceptToScheme, 'conceptSchemes', 'value1');
            });
        });
        describe('hasTopConceptProperty should call and return the correct value when getEntityByRecordId is', function() {
            it('present', function() {
                ontologyStateSvc.getEntityByRecordId.and.returnValue({'@id': 'id'});
                expect(this.controller.hasTopConceptProperty()).toBe(true);
                expect(ontologyStateSvc.getEntityByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, prefixes.skos + 'hasTopConcept', ontologyStateSvc.listItem);
            });
            it('undefined', function() {
                ontologyStateSvc.getEntityByRecordId.and.returnValue(undefined);
                expect(this.controller.hasTopConceptProperty()).toBe(false);
                expect(ontologyStateSvc.getEntityByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, prefixes.skos + 'hasTopConcept', ontologyStateSvc.listItem);
            });
        });
    });
    it('should set the correct state when the add relationship link is clicked', function() {
        var link = angular.element(this.element.querySelectorAll('block-header a')[0]);
        link.triggerHandler('click');
        expect(ontologyStateSvc.showRelationshipOverlay).toBe(true);
    });

    function createDummyEntity(property, vals) {
        var entity = {};
        entity[prefixes.skos + property] = vals || values;
        return entity;
    }

    function updateHierarchyTest(targetArray, otherArray, key, entityIRI, parentIRI) {
        _.forEach(targetArray, function(relationship) {
            it(relationship + ' and should be updated', function() {
                this.controller.updateHierarchy(relationship, values);
                _.forEach(values, function(value) {
                    expect(ontologyStateSvc.getEntityByRecordId).toHaveBeenCalledWith('recordId', value['@id'], ontologyStateSvc.listItem);
                    expect(ontologyStateSvc.addEntityToHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem[key].hierarchy, entityIRI || value['@id'], ontologyStateSvc.listItem[key].index, parentIRI || value['@id']);
                });
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem[key].hierarchy, 'recordId');
                expect(ontologyStateSvc.listItem[key].flat).toEqual([{prop: 'flat'}]);
            });
            describe(relationship + ' and should not be updated when target entity has relationship', function() {
                _.forEach(otherArray, function(otherRelationship) {
                    it(otherRelationship, function() {
                        ontologyStateSvc.getEntityByRecordId.and.returnValue(createDummyEntity(otherRelationship));
                        this.controller.updateHierarchy(relationship, values);
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

    function removeHierarchyTest(targetArray, otherArray, key, entityIRI, parentIRI) {
        _.forEach(targetArray, function(relationship) {
            beforeEach(function() {
                this.controller.key = prefixes.skos + relationship;
                _.set(ontologyStateSvc.listItem, 'editorTabStates.schemes.entityIRI', entityIRI);
            });
            it(relationship + ' and should be updated', function() {
                this.controller.removeFromHierarchy({'@id': 'value1'});
                expect(ontologyStateSvc.getEntityByRecordId).toHaveBeenCalledWith('recordId', 'value1', ontologyStateSvc.listItem);
                if (parentIRI) {
                    expect(ontologyStateSvc.deleteEntityFromParentInHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.concepts.hierarchy, entityIRI, parentIRI, ontologyStateSvc.listItem.concepts.index);
                } else {
                    expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes.hierarchy, entityIRI, ontologyStateSvc.listItem.conceptSchemes.index);
                    expect(ontologyStateSvc.listItem.editorTabStates.schemes.entityIRI).toBeUndefined();
                }
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem[key].hierarchy, 'recordId');
                expect(ontologyStateSvc.listItem[key].flat).toEqual([{prop: 'flat'}]);
                expect(ontologyStateSvc.goTo).toHaveBeenCalledWith('selectedId');
            });
            describe(relationship + ' and should not be updated when target entity has relationship', function() {
                _.forEach(otherArray, function(otherRelationship) {
                    it(otherRelationship, function() {
                        ontologyStateSvc.getEntityByRecordId.and.returnValue(createDummyEntity(otherRelationship, [{'@id': 'selectedId'}]));
                        this.controller.removeFromHierarchy({'@id': 'value1'});
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