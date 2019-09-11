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
(function() {
    'use strict';

    /**
     * @ngdoc component
     * @name ontology-editor.component:conceptHierarchyBlock
     * @requires shared.service:ontologyStateService
     *
     * @description
     * `conceptHierarchyBlock` is a component that creates a section that displays a
     * {@link ontology-editor.component:hierarchyTree} of the concepts in the current
     * {@link shared.service:ontologyStateService selected ontology/vocabulary}.
     */
    const conceptHierarchyBlockComponent = {
        templateUrl: 'ontology-editor/components/conceptHierarchyBlock/conceptHierarchyBlock.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: conceptHierarchyBlockComponentCtrl
    };

    conceptHierarchyBlockComponentCtrl.$inject = ['ontologyStateService'];

    function conceptHierarchyBlockComponentCtrl(ontologyStateService) {
        var dvm = this;
        dvm.os = ontologyStateService;

        dvm.updateSearch = function(value) {
            dvm.os.listItem.editorTabStates.concepts.searchText = value;
        }
        dvm.resetIndex = function() {
            dvm.os.listItem.editorTabStates.concepts.index = 0;
        }
    }

    angular.module('ontology-editor')
        .component('conceptHierarchyBlock', conceptHierarchyBlockComponent);
})();
