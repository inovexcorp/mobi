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
describe('Mapper Side Bar directive', function() {
    var $compile,
        scope,
        mappingManagerSvc,
        mapperStateSvc,
        ontologyManagerSvc;

    mockPrefixes();
    beforeEach(function() {
        module('templates');
        module('mapperSideBar');
        mockMappingManager();
        mockMapperState();
        mockOntologyManager();

        inject(function(_mappingManagerService_, _mapperStateService_, _ontologyManagerService_) {
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('controller methods', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<mapper-side-bar></mapper-side-bar>'))(scope);
            scope.$digest();
        });
        it('should test whether there are ontologies availabale', function() {
            var controller = this.element.controller('mapperSideBar');
            var result = controller.noOntologies();
            expect(result).toBe(true);

            ontologyManagerSvc.getList.and.returnValue([{}]);
            scope.$digest();
            result = controller.noOntologies();
            expect(result).toBe(false);

            ontologyManagerSvc.getList.and.returnValue([]);
            ontologyManagerSvc.getOntologyIds.and.returnValue(['']);
            scope.$digest();
            result = controller.noOntologies();
            expect(result).toBe(false);
        });
        it('should navigate to the mapping list', function() {
            var controller = this.element.controller('mapperSideBar');
            mapperStateSvc.editMapping = true;
            controller.mappingList();
            expect(mapperStateSvc.displayCancelConfirm).toBe(true);

            mapperStateSvc.editMapping = false;
            controller.mappingList();
            expect(mapperStateSvc.displayCancelConfirm).toBe(false);
        });
        it('should set the correct state for creating a mapping', function() {
            var controller = this.element.controller('mapperSideBar');
            mapperStateSvc.editMapping = true;
            controller.createMapping();
            expect(mapperStateSvc.displayNewMappingConfirm).toBe(true);
            expect(mapperStateSvc.createMapping).not.toHaveBeenCalled();

            mapperStateSvc.editMapping = false;
            controller.createMapping();
            expect(mapperStateSvc.displayNewMappingConfirm).toBe(false);
            expect(mapperStateSvc.createMapping).toHaveBeenCalled();
        });
        it('should download a mapping', function() {
            mappingManagerSvc.mapping = {name: 'test'};
            var controller = this.element.controller('mapperSideBar');
            controller.downloadMapping();
            scope.$digest();
            expect(mappingManagerSvc.downloadMapping).toHaveBeenCalledWith(mappingManagerSvc.mapping.name);
        });
        it('should set the correct state for adding a property mapping', function() {
            var controller = this.element.controller('mapperSideBar');
            mapperStateSvc.editingClassMappingId = 'test';
            controller.addPropMapping();
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(mapperStateSvc.newProp).toBe(true);
            expect(mapperStateSvc.editingClassMappingId).toBe('test');
            expect(mapperStateSvc.updateAvailableProps).toHaveBeenCalled();
        });
        it('should set the correct state for deleting an entity', function() {
            var controller = this.element.controller('mapperSideBar');
            mapperStateSvc.selectedPropMappingId = 'prop';
            mapperStateSvc.selectedClassMappingId = 'class';
            controller.deleteEntity();
            expect(mapperStateSvc.displayDeleteEntityConfirm).toBe(true);
            expect(mapperStateSvc.deleteId).toBe(mapperStateSvc.selectedPropMappingId);

            mapperStateSvc.selectedPropMappingId = '';
            controller.deleteEntity();
            expect(mapperStateSvc.displayDeleteEntityConfirm).toBe(true);
            expect(mapperStateSvc.deleteId).toBe(mapperStateSvc.selectedClassMappingId);
        });
        it('should set the correct state for deleting a mapping', function() {
            var controller = this.element.controller('mapperSideBar');
            controller.deleteMapping();
            expect(mapperStateSvc.displayDeleteMappingConfirm).toBe(true);
        });
    });
    describe('fills the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<mapper-side-bar></mapper-side-bar>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element..prop('tagName')).toBe('MAPPER-SIDE-BAR');
            var leftNav = this.element.find('left-nav');
            expect(leftNav.length).toBe(1);
            expect(leftNav.hasClass('mapper-side-bar')).toBe(true);
        });
        it('with the correct number of nav items', function() {
            expect(this.element.find('left-nav-item').length).toBe(5);
        });
    });
});