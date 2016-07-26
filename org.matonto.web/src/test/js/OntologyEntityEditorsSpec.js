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
describe('Ontology Entity Editors directive', function() {
    var $compile,
        scope,
        element,
        controller,
        stateManagerSvc;

    beforeEach(function() {
        module('templates');
        module('ontologyEntityEditors');
        mockStateManager();

        inject(function(_$compile_, _$rootScope_, _stateManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            stateManagerSvc = _stateManagerService_;
        });
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            element = $compile(angular.element('<ontology-entity-editors></ontology-entity-editors>'))(scope);
            scope.$digest();
        });
        it('for an ontology-entity-editors', function() {
            expect(element.prop('tagName')).toBe('ONTOLOGY-ENTITY-EDITORS');
        });
        _.forEach(['default-tab', 'ontology-editor', 'class-editor', 'property-editor', 'annotation-editor'], function(item) {
            it('based on ' + item, function() {
                stateManagerSvc.state.editor = item;
                scope.$digest();
                var items = element.find(item);
                expect(items.length).toBe(1);
            });
        });
    });
});