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
describe('Individual Hierarchy directive', function() {
    var $compile, scope, ontologyStateSvc, modalSvc;

    beforeEach(function() {
        module('templates');
        module('individualHierarchyBlock');
        mockOntologyState();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            modalSvc = _modalService_;
        });

        this.element = $compile(angular.element('<individual-hierarchy-block></individual-hierarchy-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('individualHierarchyBlock');
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
            expect(this.element.hasClass('individual-hierarchy-block')).toBe(true);
        });
        it('with a .section-header', function() {
            expect(this.element.querySelectorAll('.section-header').length).toBe(1);
        });
        it('with a individual-tree', function() {
            expect(this.element.find('individual-tree').length).toBe(1);
        });
        it('with a link to create an individual when the user can modify branch', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toBe(1);
        });
        it('with a link to create an individual when the user cannot modify branch', function() {
            ontologyStateSvc.canModify.and.returnValue(false);
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toBe(0);
        });
    });
    describe('controller methods', function() {
        it('should open the createIndividualOverlay', function() {
            this.controller.showCreateIndividualOverlay();
            expect(ontologyStateSvc.unSelectItem).toHaveBeenCalled();
            expect(modalSvc.openModal).toHaveBeenCalledWith('createIndividualOverlay');
        });
    });
    it('should call showCreateIndividualOverlay when the create individual link is clicked', function() {
        ontologyStateSvc.canModify.and.returnValue(true);
        scope.$digest();
        spyOn(this.controller, 'showCreateIndividualOverlay');
        var link = angular.element(this.element.querySelectorAll('.section-header a')[0]);
        link.triggerHandler('click');
        expect(this.controller.showCreateIndividualOverlay).toHaveBeenCalled();
    });
});