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
describe('Imports Block directive', function() {
    var $compile, scope, element, ontologyStateSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('importsBlock');
        mockOntologyState();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            prefixes = _prefixes_;
        });

        ontologyStateSvc.selected[prefixes.owl + 'imports'] = [];
        element = $compile(angular.element('<imports-block></imports-block>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('imports-block')).toBe(true);
        });
        it('with a block', function() {
            expect(element.find('block').length).toBe(1);
        });
        it('with a block-header', function() {
            expect(element.find('block-header').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(element.find('block-content').length).toBe(1);
        });
        it('with an a', function() {
            expect(element.querySelectorAll('a.pull-right').length).toBe(1);
        });
        it('with a imports-overlay', function() {
            expect(element.find('imports-overlay').length).toBe(0);
            element.controller('importsBlock').showOverlay = true;
            scope.$apply();
            expect(element.find('imports-overlay').length).toBe(1);
        });
        it('depending on the length of the selected ontology imports', function() {
            expect(element.querySelectorAll('.text-info.message').length).toBe(1);
            expect(element.querySelectorAll('.import').length).toBe(0);

            ontologyStateSvc.selected[prefixes.owl + 'imports'] = [{'@id': 'import'}];
            scope.$apply();
            expect(element.querySelectorAll('.text-info.message').length).toBe(0);
            expect(element.querySelectorAll('.import').length).toBe(1);
        });
    });
});