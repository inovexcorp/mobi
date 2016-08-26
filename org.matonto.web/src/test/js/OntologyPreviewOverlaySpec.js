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
describe('Ontology Preview Overlay directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc,
        mapperStateSvc;

    beforeEach(function() {
        module('templates');
        module('ontologyPreviewOverlay');
        mockOntologyManager();
        mockMapperState();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _mapperStateService_) {
            ontologyManagerSvc = _ontologyManagerService_;
            mapperStateSvc = _mapperStateService_;
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.ontology = {};
            this.element = $compile(angular.element('<ontology-preview-overlay ontology="ontology"></ontology-preview-overlay>'))(scope);
            scope.$digest();
        });
        it('ontology should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.ontology = {entities: []};
            scope.$digest();
            expect(scope.ontology).toEqual({entities: []});
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.ontology = {};
            this.element = $compile(angular.element('<ontology-preview-overlay ontology="ontology"></ontology-preview-overlay>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('ontology-preview-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with an ontology preview', function() {
            expect(this.element.find('ontology-preview').length).toBe(1);
        });
        it('with a custom button to close', function() {
            var buttons = this.element.find('custom-button');
            expect(buttons.length).toBe(1);
            expect(angular.element(buttons[0]).text()).toBe('Close');
        });
    });
});