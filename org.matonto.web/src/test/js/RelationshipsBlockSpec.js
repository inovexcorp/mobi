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
    var $compile;
    var scope;
    var element;
    var ontologyStateSvc;
    var ontologyManagerSvc;
    var controller;
    var resObj;
    var prefixes;

    beforeEach(function() {
        module('templates');
        module('relationshipsBlock');
        injectShowPropertiesFilter();
        mockOntologyState();
        mockOntologyManager();
        mockPrefixes();
        mockResponseObj();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _responseObj_, _ontologyManagerService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            resObj = _responseObj_;
            prefixes = _prefixes_;
        });

        scope.relationshipList = [];
        ontologyStateSvc.showRelationshipOverlay = true;
        element = $compile(angular.element('<relationships-block relationship-list="relationshipList"></relationships-block>'))(scope);
        scope.$digest();
        controller = element.controller('relationshipsBlock');
    });

    describe('replaces the element with the correct html', function() {
        it('for a DIV', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('for .relationship-block', function() {
            expect(element.hasClass('relationship-block')).toBe(true);
        });
        it('for .axiom-block', function() {
            expect(element.hasClass('axiom-block')).toBe(true);
        });
        it('based on block', function() {
            var blocks = element.find('block');
            expect(blocks.length).toBe(1);
        });
        it('based on block-header', function() {
            var blockHeaders = element.find('block-header');
            expect(blockHeaders.length).toBe(1);
        });
        it('based on block-content', function() {
            var blockContent = element.find('block-content');
            expect(blockContent.length).toBe(1);
        });
        it('based on relationship-overlay', function() {
            var relationshipOverlays = element.find('relationship-overlay');
            expect(relationshipOverlays.length).toBe(1);
        });
        it('based on remove-property-overlay', function() {
            controller.showRemoveOverlay = true;
            scope.$digest();
            var removePropertyOverlays = element.find('remove-property-overlay');
            expect(removePropertyOverlays.length).toBe(1);
        });
    });

    describe('controller methods', function() {
        it('openRemoveOverlay sets the correct variables', function() {
            var key = 'key';
            var index = 0;
            controller.openRemoveOverlay(key, index);
            expect(controller.key).toBe(key);
            expect(controller.index).toBe(index);
            expect(controller.showRemoveOverlay).toBe(true);
        });
        describe('updateHierarchy', function() {
            var values = [{'@id': 'value1'}, {'@id': 'value2'}];
            beforeEach(function() {
                resObj.getItemIri.and.callFake(function(item) {
                    return prefixes.skos + item;
                });
            });
            describe('when broader type relationship', function() {
                _.forEach(['broader', 'broaderTransitive', 'broadMatch'], relationship => {
                    it(relationship + ' and should be updated, calls the correct method', function() {
                        controller.updateHierarchy(relationship, values);
                        _.forEach(values, value => {
                            expect(ontologyStateSvc.addEntityToHierarchy).toHaveBeenCalledWith(
                                ontologyStateSvc.listItem.conceptHierarchy,
                                ontologyStateSvc.selected.matonto.originalIRI,
                                ontologyStateSvc.listItem.conceptIndex,
                                value['@id']
                            );
                        });
                    });
                    it(relationship + ' and should not be updated, does not call the method', function() {
                        var narrowerProp = prefixes.skos + 'narrower';
                        var entity = {};
                        entity[narrowerProp] = 'value';
                        ontologyManagerSvc.getEntityById.and.returnValue(entity);
                        _.forEach(values, value => {
                            expect(ontologyStateSvc.addEntityToHierarchy).not.toHaveBeenCalled();
                        });
                    });
                });
            });
            describe('when narrower type relationship', function() {
                _.forEach(['narrower', 'narrowerTransitive', 'narrowMatch'], relationship => {
                    it(relationship + ' and should be updated, calls the correct method', function() {
                        controller.updateHierarchy(relationship, values);
                        _.forEach(values, value => {
                            expect(ontologyStateSvc.addEntityToHierarchy).toHaveBeenCalledWith(
                                ontologyStateSvc.listItem.conceptHierarchy,
                                value['@id'],
                                ontologyStateSvc.listItem.conceptIndex,
                                ontologyStateSvc.selected.matonto.originalIRI
                            );
                        });
                    });
                    it(relationship + ' and should not be updated, does not call the method', function() {
                        var broaderProp = prefixes.skos + 'broader';
                        var entity = {};
                        entity[broaderProp] = 'value';
                        ontologyManagerSvc.getEntityById.and.returnValue(entity);
                        _.forEach(values, value => {
                            expect(ontologyStateSvc.addEntityToHierarchy).not.toHaveBeenCalled();
                        });
                    });
                });
            });
        });
    });
});