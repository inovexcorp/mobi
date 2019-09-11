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
     * @name ontology-editor.component:associationBlock
     * @requires shared.service:ontologyStateService
     *
     * @description
     * `associationBlock` is a component that creates a section that displays the
     * {@link ontology-editor.component:everythingTree} for the current
     * {@link shared.service:ontologyStateService selected ontology}.
     */
    const associationBlockComponent = {
        templateUrl: 'ontology-editor/components/associationBlock/associationBlock.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: associationBlockComponentCtrl
    };
    
    associationBlockComponentCtrl.$inject = ['ontologyStateService'];

    function associationBlockComponentCtrl(ontologyStateService) {
        var dvm = this;
        dvm.os = ontologyStateService;

        dvm.updateSearch = function(value) {
            dvm.os.listItem.editorTabStates.overview.searchText = value;
        }
    }

    angular.module('ontology-editor')
        .component('associationBlock', associationBlockComponent);
})();
