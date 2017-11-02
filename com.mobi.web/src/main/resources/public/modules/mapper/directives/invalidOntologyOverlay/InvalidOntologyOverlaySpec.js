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
describe('Invalid Ontology Overlay directive', function() {
    var $compile, scope, mapperStateSvc;

    beforeEach(function() {
        module('templates');
        module('invalidOntologyOverlay');
        mockMapperState();
        injectSplitIRIFilter();

        inject(function(_$compile_, _$rootScope_, _mapperStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mapperStateSvc = _mapperStateService_;
        });

        mapperStateSvc.mapping = {record: {title: 'Mapping Title'}};
        this.element = $compile(angular.element('<invalid-ontology-overlay></invalid-ontology-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('invalidOntologyOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        mapperStateSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        it('should set the correct state for closing the overlay', function() {
            this.controller.close();
            expect(mapperStateSvc.initialize).toHaveBeenCalled();
            expect(mapperStateSvc.invalidOntology).toBe(false);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('invalid-ontology-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with the mapping record title', function() {
            expect(this.element.html()).toContain(mapperStateSvc.mapping.record.title);
        });
        it('with a button for closing', function() {
            var buttons = this.element.find('button');
            expect(buttons.length).toBe(1);
            expect(angular.element(buttons[0]).text()).toContain('Close');
        });
    });
});