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
describe('Selected Details directive', function() {
    var $compile, scope, ontologyStateSvc, ontologyManagerService, $filter, $q, ontoUtils, manchesterConverterSvc;

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
            manchesterConverterSvc = _manchesterConverterService_;
            $filter = _$filter_;
            ontoUtils = _ontologyUtilsManagerService_;
            $q = _$q_;
        });

        this.element = $compile(angular.element('<selected-details></selected-details>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('selectedDetails');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontologyManagerService = null;
        $filter = null;
        $q = null;
        ontoUtils = null;
        manchesterConverterSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('selected-details')).toBe(true);
        });
        it('depending on whether something is selected', function() {
            expect(this.element.find('div').length).toBe(1);
            expect(this.element.find('static-iri').length).toBe(1);

            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(this.element.find('div').length).toBe(0);
            expect(this.element.find('static-iri').length).toBe(0);
        });
    });

    describe('controller methods', function() {
        describe('getTypes functions properly', function() {
            it('when @type is empty', function() {
                ontologyStateSvc.listItem.selected = {};
                expect(this.controller.getTypes()).toEqual('');
            });
            it('when @type has items', function() {
                var expected = 'test, test2';
                ontologyStateSvc.listItem.selected = {'@type': ['test', 'test2']};
                expect(this.controller.getTypes()).toEqual(expected);
            });
            it('when @type has blank node items', function() {
                ontologyManagerService.isBlankNodeId.and.returnValue(true);
                ontologyStateSvc.listItem.selected = {'@type': ['test', 'test2']};
                this.controller.getTypes();
                expect(manchesterConverterSvc.jsonldToManchester).toHaveBeenCalledWith(jasmine.any(String), ontologyStateSvc.listItem.ontology);
            });
        });
        describe('onEdit calls the proper functions', function() {
            it('when ontologyState.onEdit resolves', function() {
                ontologyStateSvc.onEdit.and.returnValue($q.when());
                this.controller.onEdit('begin', 'middle', 'end');
                scope.$apply();
                expect(ontologyStateSvc.onEdit).toHaveBeenCalledWith('begin', 'middle', 'end');
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(ontoUtils.updateLabel).toHaveBeenCalled();
            });
            it('when ontologyState.onEdit rejects', function() {
                ontologyStateSvc.onEdit.and.returnValue($q.reject());
                this.controller.onEdit('begin', 'middle', 'end');
                scope.$apply();
                expect(ontologyStateSvc.onEdit).toHaveBeenCalledWith('begin', 'middle', 'end');
                expect(ontoUtils.saveCurrentChanges).not.toHaveBeenCalled();
                expect(ontoUtils.updateLabel).not.toHaveBeenCalled();
            });
        });
    });
});
