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
    var $compile, scope, $q, $filter, ontologyStateSvc, ontologyManagerSvc, ontoUtils, manchesterConverterSvc, modalSvc;

    beforeEach(function() {
        module('templates');
        module('selectedDetails');
        mockOntologyManager();
        mockOntologyState();
        injectPrefixationFilter();
        mockOntologyUtilsManager();
        mockManchesterConverter();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _$q_, _$filter_, _ontologyStateService_, _ontologyManagerService_, _ontologyUtilsManagerService_, _manchesterConverterService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            $filter = _$filter_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            manchesterConverterSvc = _manchesterConverterService_;
            ontoUtils = _ontologyUtilsManagerService_;
            modalSvc = _modalService_;
        });

        ontologyStateSvc.canModify.and.returnValue(true);
        scope.readOnly = false;
        this.element = $compile(angular.element('<selected-details read-only="readOnly"></selected-details>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('selectedDetails');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        $filter = null;
        ontologyStateSvc = null;
        ontologyManagerSvc = null;
        ontoUtils = null;
        manchesterConverterSvc = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('readOnly is one way bound', function() {
            this.controller.readOnly = true;
            scope.$digest();
            expect(scope.readOnly).toEqual(false);
        });
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
        it('depending on whether the selected entity has types', function() {
            expect(this.element.querySelectorAll('.type-wrapper').length).toEqual(0);
            ontologyStateSvc.listItem.selected['@type'] = ['test'];
            scope.$digest();
            expect(this.element.querySelectorAll('.type-wrapper').length).toEqual(1);
        });
        it('depending on whether the details should be read only', function() {
            ontologyManagerSvc.isIndividual.and.returnValue(true);
            ontologyStateSvc.listItem.selected['@type'] = ['test'];
            scope.$digest();
            expect(this.element.find('static-iri').length).toBe(1);
            expect(this.element.find('a').length).toBe(1);
            scope.readOnly = true;
            scope.$digest();
            expect(this.element.find('static-iri').length).toBe(1);
            expect(this.element.find('a').length).toBe(0);
        });
        it('depending on whether the entity is an individual', function() {
            ontologyManagerSvc.isIndividual.and.returnValue(false);
            ontologyStateSvc.listItem.selected['@type'] = ['test'];
            scope.$digest();
            expect(this.element.find('a').length).toBe(0);
            ontologyManagerSvc.isIndividual.and.returnValue(true);
            scope.$digest();
            expect(this.element.find('a').length).toBe(1);
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
                ontologyManagerSvc.isBlankNodeId.and.returnValue(true);
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
        it('should open the individual types modal', function() {
            this.controller.showTypesOverlay();
            expect(modalSvc.openModal).toHaveBeenCalledWith('individualTypesModal');
        });
    });
});
