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
describe('Mapping Title directive', function() {
    var $compile,
        scope,
        mappingManagerSvc,
        mapperStateSvc,
        controller;

    beforeEach(function() {
        module('templates');
        module('mappingTitle');
        mockMappingManager();
        mockMapperState();
        injectSplitIRIFilter();

        inject(function(_$compile_, _$rootScope_, _mappingManagerService_, _mapperStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mapperStateSvc = _mapperStateService_;
            mappingManagerSvc = _mappingManagerService_;
        });
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {id: '', jsonld: []};
            this.element = $compile(angular.element('<mapping-title></mapping-title>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('mapping-title')).toBe(true);
        });
        it('depending on whether a new mapping is being created', function() {
            var link = this.element.find('a');
            expect(link.length).toBe(0);

            mapperStateSvc.newMapping = true;
            scope.$digest();
            link = this.element.find('a');
            expect(link.length).toBe(1);
        });
    });
    it('should set the correct state when the edit button is clicked', function() {
        mappingManagerSvc.mapping = {id: '', jsonld: []};
        mapperStateSvc.newMapping = true;
        var element = $compile(angular.element('<mapping-title></mapping-title>'))(scope);
        scope.$digest();
        
        var link = angular.element(element.find('a')[0]);
        angular.element(link).triggerHandler('click');
        expect(mapperStateSvc.editMappingName).toBe(true);
    });
});