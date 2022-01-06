/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

const template = require('./individualHierarchyBlock.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:individualHierarchyBlock
 * @requires shared.service:ontologyStateService
 *
 * @description
 * `individualHierarchyBlock` is a component that creates a section that displays a
 * {@link ontology-editor.component:individualTree} of the individuals in the current
 * {@link shared.service:ontologyStateService selected ontology} underneath their class types.
 */
const individualHierarchyBlockComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: individualHierarchyBlockComponentCtrl
};

individualHierarchyBlockComponentCtrl.$inject = ['ontologyStateService'];

function individualHierarchyBlockComponentCtrl(ontologyStateService) {
    var dvm = this;
    dvm.os = ontologyStateService;

    dvm.updateSearch = function(value) {
        dvm.os.listItem.editorTabStates.individuals.searchText = value;
    }
}

export default individualHierarchyBlockComponent;
