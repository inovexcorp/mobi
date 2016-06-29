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
describe('Invalid Ontology Overlay directive', function() {
    var $compile,
        scope,
        mappingManagerSvc,
        mapperStateSvc;

    beforeEach(function() {
        module('templates');
        module('invalidOntologyOverlay');
        mockMappingManager();
        mockMapperState();

        inject(function(_mappingManagerService_, _mapperStateService_) {
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('controller methods', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {name: ''};
            this.element = $compile(angular.element('<invalid-ontology-overlay></invalid-ontology-overlay>'))(scope);
            scope.$digest();
        });
        it('should set the correct state for closing the overlay', function() {
            var controller = this.element.controller('invalidOntologyOverlay');
            controller.close();
            expect(mapperStateSvc.initialize).toHaveBeenCalled();
            expect(mapperStateSvc.invalidOntology).toBe(false);
            expect(mappingManagerSvc.mapping).toEqual(undefined);
            expect(mappingManagerSvc.sourceOntologies).toEqual([]);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<invalid-ontology-overlay></invalid-ontology-overlay>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('invalid-ontology-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with a custom button for closing', function() {
            var buttons = this.element.find('custom-button');
            expect(buttons.length).toBe(1);
            expect(angular.element(buttons[0]).text()).toContain('Close');
        });
    });
});