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
describe('Ontology Trees directive', function() {
    var $compile,
        scope,
        element,
        controller,
        stateManagerSvc;

    beforeEach(function() {
        module('templates');
        module('ontologyTrees');
        mockStateManager();

        inject(function(_$compile_, _$rootScope_, _stateManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            stateManagerSvc = _stateManagerService_;
        });
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            element = $compile(angular.element('<ontology-trees></ontology-trees>'))(scope);
            scope.$digest();
        });
        it('for an ontology-trees', function() {
            expect(element.prop('tagName')).toBe('ONTOLOGY-TREES');
        });
        it('based on tab-button-container', function() {
            var container = element.find('tab-button-container');
            expect(container.length).toBe(1);
        });
        it('based on tab-buttons', function() {
            var buttons = element.find('tab-button');
            expect(buttons.length).toBe(6);
        });
        _.forEach([
                {tag: 'everything-tree', text: 'everything'},
                {tag: 'class-tree', text: 'class'},
                {tag: 'property-tree', text: 'object'},
                {tag: 'property-tree', text: 'datatype'},
                {tag: 'annotation-tree', text: 'annotation'}
            ], function(item) {
            it('based on ' + item.tag, function() {
                stateManagerSvc.state.tab = item.text;
                scope.$digest();
                var items = element.find(item.tag);
                expect(items.length).toBe(1);
            });
        });
    });
});