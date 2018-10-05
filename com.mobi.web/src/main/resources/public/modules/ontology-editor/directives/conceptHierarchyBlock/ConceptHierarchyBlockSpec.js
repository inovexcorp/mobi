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
describe('Concept Hierarchy Block directive', function() {
    var $compile, scope, ontologyStateSvc, modalSvc;

    beforeEach(function() {
        module('templates');
        module('conceptHierarchyBlock');
        mockOntologyState();
        mockOntologyUtilsManager();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            modalSvc = _modalService_;
        });

        this.element = $compile(angular.element('<concept-hierarchy-block></concept-hierarchy-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('conceptHierarchyBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('concept-hierarchy-block')).toBe(true);
        });
        it('with a .section-header', function() {
            expect(this.element.querySelectorAll('.section-header').length).toBe(1);
        });
        it('with a link to add a concept if the user can modify', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toBe(1);
        });
        it('with no link to add a concept if the user cannot modify', function() {
            ontologyStateSvc.canModify.and.returnValue(false);
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toBe(0);
        });
        it('with a hierarchy-tree', function() {
            expect(this.element.find('hierarchy-tree').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        it('should open the createConceptOverlay', function() {
            this.controller.showCreateConceptOverlay();
            expect(ontologyStateSvc.unSelectItem).toHaveBeenCalled();
            expect(modalSvc.openModal).toHaveBeenCalledWith('createConceptOverlay');
        });
    });
    it('should call showCreateConceptOverlay when the create concept link is clicked', function() {
        ontologyStateSvc.canModify.and.returnValue(true);
        scope.$digest();
        spyOn(this.controller, 'showCreateConceptOverlay');
        var link = angular.element(this.element.querySelectorAll('.section-header a')[0]);
        link.triggerHandler('click');
        expect(this.controller.showCreateConceptOverlay).toHaveBeenCalled();
    });
});