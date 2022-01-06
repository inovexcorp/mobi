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
import './conceptSchemeHierarchyBlock.component.scss';

const template = require('./conceptSchemeHierarchyBlock.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:conceptSchemeHierarchyBlock
 * @requires shared.service:ontologyStateService
 *
 * @description
 * `conceptSchemeHierarchyBlock` is a component that creates a section that displays a
 * {@link ontology-editor.component:hierarchyTree} of the concept schemes and concepts in the current
 * {@link shared.service:ontologyStateService selected ontology/vocabulary}.
 */
const conceptSchemeHierarchyBlockComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: conceptSchemeHierarchyBlockComponentCtrl
};

conceptSchemeHierarchyBlockComponentCtrl.$inject = ['ontologyStateService'];

function conceptSchemeHierarchyBlockComponentCtrl(ontologyStateService) {
    var dvm = this;
    dvm.os = ontologyStateService;

    dvm.updateSearch = function(value) {
        dvm.os.listItem.editorTabStates.schemes.searchText = value;
    }
    dvm.resetIndex = function() {
        dvm.os.listItem.editorTabStates.schemes.index = 0;
    }
}

export default conceptSchemeHierarchyBlockComponent;
