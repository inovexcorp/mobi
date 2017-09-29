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
    var $compile, scope, element, ontologyStateSvc, ontologyManagerSvc, controller, resObj, prefixes;

    beforeEach(function() {
        module('templates');
        module('relationshipsBlock');
        injectShowPropertiesFilter();
        mockOntologyState();
        mockOntologyManager();
        mockPrefixes();
        mockResponseObj();
        mockOntologyUtilsManager();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _responseObj_, _ontologyManagerService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            resObj = _responseObj_;
            prefixes = _prefixes_;
        });

        scope.relationshipList = [];
        ontologyStateSvc.listItem.selected = {
            'prop1': [{'@id': 'value1'}],
            'prop2': [{'@value': 'value2'}]
        };
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
        // describe('updateHierarchy', function() {
        //     var values = [{'@id': 'value1'}, {'@id': 'value2'}];
        //     beforeEach(function() {
        //         resObj.getItemIri.and.callFake(function(item) {
        //             return prefixes.skos + item;
        //         });
        //     });
        //     describe('when broader type relationship', function() {
        //         _.forEach(['broader', 'broaderTransitive', 'broadMatch'], function(relationship) {
        //             it(relationship + ' and should be updated, calls the correct method', function() {
        //                 controller.updateHierarchy(relationship, values);
        //                 _.forEach(values, function(value) {
        //                     expect(ontologyStateSvc.addEntityToHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptHierarchy, ontologyStateSvc.selected.matonto.originalIRI, ontologyStateSvc.listItem.conceptIndex, value['@id']);
        //                 });
        //             });
        //             it(relationship + ' and should not be updated, does not call the method', function() {
        //                 var narrowerProp = prefixes.skos + 'narrower';
        //                 var entity = {};
        //                 entity[narrowerProp] = 'value';
        //                 ontologyManagerSvc.getEntityById.and.returnValue(entity);
        //                 _.forEach(values, function(value) {
        //                     expect(ontologyStateSvc.addEntityToHierarchy).not.toHaveBeenCalled();
        //                 });
        //             });
        //         });
        //     });
        //     describe('when narrower type relationship', function() {
        //         _.forEach(['narrower', 'narrowerTransitive', 'narrowMatch'], function(relationship) {
        //             it(relationship + ' and should be updated, calls the correct method', function() {
        //                 controller.updateHierarchy(relationship, values);
        //                 _.forEach(values, function(value) {
        //                     expect(ontologyStateSvc.addEntityToHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptHierarchy, value['@id'], ontologyStateSvc.listItem.conceptIndex, ontologyStateSvc.selected.matonto.originalIRI);
        //                 });
        //             });
        //             it(relationship + ' and should not be updated, does not call the method', function() {
        //                 var broaderProp = prefixes.skos + 'broader';
        //                 var entity = {};
        //                 entity[broaderProp] = 'value';
        //                 ontologyManagerSvc.getEntityById.and.returnValue(entity);
        //                 _.forEach(values, function(value) {
        //                     expect(ontologyStateSvc.addEntityToHierarchy).not.toHaveBeenCalled();
        //                 });
        //             });
        //         });
        //     });
        // });
    });
    it('should set the correct state when the add relationship link is clicked', function() {
        var link = angular.element(element.querySelectorAll('block-header a')[0]);
        link.triggerHandler('click');
        expect(ontologyStateSvc.showRelationshipOverlay).toBe(true);
    });
});