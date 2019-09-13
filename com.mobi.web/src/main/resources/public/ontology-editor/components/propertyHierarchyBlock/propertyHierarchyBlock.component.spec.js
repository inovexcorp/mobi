/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import {
    mockComponent,
    mockOntologyState
} from '../../../../../../test/js/Shared';

describe('Property Hierarchy Block component', function() {
    var $compile, scope, ontologyStateSvc;

    beforeEach(function() {
        angular.mock.module('ontology-editor');
        mockComponent('ontology-editor', 'propertyTree');
        mockOntologyState();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
        });

        this.element = $compile(angular.element('<property-hierarchy-block></property-hierarchy-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('propertyHierarchyBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        it('updateSearch changes properties search text', function() {
            expect(ontologyStateSvc.listItem.editorTabStates.properties.searchText).toEqual('');
            this.controller.updateSearch('newValue');
            expect(ontologyStateSvc.listItem.editorTabStates.properties.searchText).toEqual('newValue');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('PROPERTY-HIERARCHY-BLOCK');
            expect(this.element.querySelectorAll('.property-hierarchy-block').length).toEqual(1);
        });
        it('depending on whether the tree is empty', function() {
            expect(this.element.find('info-message').length).toEqual(1);
            expect(this.element.find('property-tree').length).toEqual(0);

            ontologyStateSvc.listItem.dataProperties.flat = [{}];
            scope.$digest();
            expect(this.element.find('info-message').length).toEqual(0);
            expect(this.element.find('property-tree').length).toEqual(1);
        });
    });
});