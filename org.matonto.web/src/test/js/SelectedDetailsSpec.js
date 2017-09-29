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
describe('Selected Details directive', function() {
    var $compile, scope, element, ontologyStateSvc, ontologyManagerService, $filter, controller, $q, ontoUtils, manchesterConverterService;

    beforeEach(function() {
        module('templates');
        module('selectedDetails');
        mockOntologyManager();
        mockOntologyState();
        injectPrefixationFilter();
        mockOntologyUtilsManager();
        mockManchesterConverter();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyManagerService_, _$filter_, _ontologyUtilsManagerService_, _manchesterConverterService_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerService = _ontologyManagerService_;
            manchesterConverterService = _manchesterConverterService_;
            $filter = _$filter_;
            ontoUtils = _ontologyUtilsManagerService_;
            $q = _$q_;
        });

        element = $compile(angular.element('<selected-details></selected-details>'))(scope);
        scope.$digest();
        controller = element.controller('selectedDetails');
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('selected-details')).toBe(true);
        });
        it('depending on whether something is selected', function() {
            expect(element.find('div').length).toBe(1);
            expect(element.find('static-iri').length).toBe(1);

            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(element.find('div').length).toBe(0);
            expect(element.find('static-iri').length).toBe(0);
        });
    });

    describe('controller methods', function() {
        describe('getTypes functions properly', function() {
            it('when @type is empty', function() {
                ontologyStateSvc.listItem.selected = {};
                expect(controller.getTypes()).toEqual('');
            });
            it('when @type has items', function() {
                var expected = 'test, test2';
                ontologyStateSvc.listItem.selected = {'@type': ['test', 'test2']};
                expect(controller.getTypes()).toEqual(expected);
            });
            it('when @type has blank node items', function() {
                ontologyManagerService.isBlankNodeId.and.returnValue(true);
                ontologyStateSvc.listItem.selected = {'@type': ['test', 'test2']};
                controller.getTypes();
                expect(manchesterConverterService.jsonldToManchester).toHaveBeenCalledWith(jasmine.any(String), ontologyStateSvc.listItem.ontology);
            });
        });
        describe('onEdit calls the proper functions', function() {
            var editDeferred;
            beforeEach(function() {
                editDeferred = $q.defer();
                ontologyStateSvc.onEdit.and.returnValue(editDeferred.promise);
                controller.onEdit('begin', 'middle', 'end');
            });
            it('when ontologyState.onEdit resolves', function() {
                editDeferred.resolve();
                scope.$apply();
                expect(ontologyStateSvc.onEdit).toHaveBeenCalledWith('begin', 'middle', 'end');
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(ontoUtils.updateLabel).toHaveBeenCalled();
            });
            it('when ontologyState.onEdit rejects', function() {
                editDeferred.reject();
                scope.$apply();
                expect(ontologyStateSvc.onEdit).toHaveBeenCalledWith('begin', 'middle', 'end');
                expect(ontoUtils.saveCurrentChanges).not.toHaveBeenCalled();
                expect(ontoUtils.updateLabel).not.toHaveBeenCalled();
            });
        });
    });
});
