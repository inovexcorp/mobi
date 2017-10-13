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
describe('Ontology Tab directive', function() {
    var $compile,
        scope,
        element;

    beforeEach(function() {
        module('templates');
        module('ontologyTab');
        mockOntologyState();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        element = $compile(angular.element('<ontology-tab></ontology-tab>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('ontology-tab')).toBe(true);
        });
        it('with a tabset', function() {
            expect(element.find('tabset').length).toBe(1);
        });
        it('with tabs', function() {
            expect(element.find('tab').length).toBe(9);
        });
        _.forEach(['branch-select', 'ontology-button-stack', 'project-tab', 'overview-tab', 'classes-tab', 'properties-tab', 'individuals-tab', 'search-tab', 'saved-changes-tab', 'merge-tab', 'commits-tab'], function(tag) {
            it('with a ' + tag, function() {
                expect(element.find(tag).length).toBe(1);
            });
        });
    });
});