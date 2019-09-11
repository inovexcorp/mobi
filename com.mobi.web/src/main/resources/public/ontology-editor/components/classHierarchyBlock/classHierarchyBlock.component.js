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
     * @name ontology-editor.component:classHierarchyBlock
     * @requires shared.service:ontologyStateService
     *
     * @description
     * `classHierarchyBlock` is a component that creates a section that displays a
     * {@link ontology-editor.component:hierarchyTree} of the classes in the current
     * {@link shared.service:ontologyStateService selected ontology}.
     */
    const classHierarchyBlockComponent = {
        templateUrl: 'ontology-editor/components/classHierarchyBlock/classHierarchyBlock.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: classHierarchyBlockComponentCtrl
    };

    classHierarchyBlockComponentCtrl.$inject = ['ontologyStateService'];

    function classHierarchyBlockComponentCtrl(ontologyStateService) {
        var dvm = this;
        dvm.os = ontologyStateService;

        dvm.updateSearch = function(value) {
            dvm.os.listItem.editorTabStates.classes.searchText = value;
        }
        dvm.resetIndex = function() {
            dvm.os.listItem.editorTabStates.classes.index = 0;
        }
    }

    angular.module('ontology-editor')
        .component('classHierarchyBlock', classHierarchyBlockComponent);
})();
