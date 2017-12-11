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
    var $compile, scope, ontologyStateSvc, resObj, prefixes, ontologyManagerSvc, ontoUtils;

    beforeEach(function() {
        module('templates');
        module('relationshipsBlock');
        injectShowPropertiesFilter();
        mockOntologyState();
        mockPrefixes();
        mockResponseObj();
        mockOntologyUtilsManager();
        mockOntologyManager();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _responseObj_, _prefixes_, _ontologyManagerService_, _ontologyUtilsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            resObj = _responseObj_;
            prefixes = _prefixes_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontoUtils = _ontologyUtilsManagerService_;
        });

        scope.relationshipList = [];
        ontologyStateSvc.listItem.ontologyRecord.recordId = 'recordId';
        ontologyStateSvc.listItem.selected = {
            '@id': 'selectedId',
            'prop1': [{'@id': 'value1'}],
            'prop2': [{'@value': 'value2'}]
        };
        ontologyStateSvc.flattenHierarchy.and.returnValue([{prop: 'flat'}]);
        ontologyManagerSvc.isConceptScheme.and.returnValue(false);
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
        ontologyManagerSvc = null;
        ontoUtils = null;
        this.element.remove();
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
        it('with a block-header button', function() {
            expect(this.element.querySelectorAll('block-header button').length).toBe(1);
            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(this.element.querySelectorAll('block-header button').length).toBe(0);
        });
        it('with a .relationship-header', function() {
            expect(this.element.querySelectorAll('.relationship-header').length).toBe(1);
            ontologyManagerSvc.isConceptScheme.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.relationship-header').length).toBe(0);
        });
        it('with a .top-concept-header', function() {
            expect(this.element.querySelectorAll('.top-concept-header').length).toBe(0);
            ontologyManagerSvc.isConceptScheme.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.top-concept-header').length).toBe(1);
        });
        it('with a top-concept-overlay', function() {
            expect(this.element.find('top-concept-overlay').length).toBe(0);
            this.controller.showTopConceptOverlay = true;
            scope.$digest();
            expect(this.element.find('top-concept-overlay').length).toBe(1);
        });
        it('depending on whether there is a top concept property', function() {
            ontologyManagerSvc.isConceptScheme.and.returnValue(true);
            spyOn(this.controller, 'hasTopConceptProperty').and.returnValue(true);
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('block-header button')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            this.controller.hasTopConceptProperty.and.returnValue(false);
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
        it('depending on whether there are relationships', function() {
            ontologyManagerSvc.isConceptScheme.and.returnValue(false);
            scope.$digest();
            var link = angular.element(this.element.querySelectorAll('block-header button')[0]);
            expect(link.attr('disabled')).toBeTruthy();

            this.controller.relationshipList = [{}];
            scope.$digest();
            expect(link.attr('disabled')).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        it('openRemoveOverlay sets the correct variables', function() {
            this.controller.openRemoveOverlay('key', 1);
            expect(this.controller.key).toBe('key');
            expect(this.controller.index).toBe(1);
            expect(this.controller.showRemoveOverlay).toBe(true);
        });
        it('updateHierarchy should call proper methods', function() {
            resObj.getItemIri.and.returnValue('test');
            this.controller.updateHierarchy({}, []);
            expect(resObj.getItemIri).toHaveBeenCalledWith({});
            expect(ontoUtils.updateVocabularyHierarchies).toHaveBeenCalledWith('test', []);
        });
        it('removeFromHierarchy should call the proper methods', function() {
            this.controller.key = 'test';
            this.controller.removeFromHierarchy({});
            expect(ontoUtils.removeFromVocabularyHierarchies).toHaveBeenCalledWith('test', {});
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
    it('should set the correct state when the add relationship button is clicked', function() {
        var button = angular.element(this.element.querySelectorAll('block-header button')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showRelationshipOverlay).toBe(true);
    });
});