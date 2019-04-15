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
     * @name ontology-editor.component:blankNodeValueDisplay
     * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
     *
     * @description
     * `blankNodeValueDisplay` is a component that creates a ui-codemirror container for displaying a blank node with
     * provided `nodeId`. The codemirror syntax is Manchester syntax and is non-editable.
     *
     * @param {string} nodeId The ID of a blank node in the current {@link shared.service:ontologyStateService ontology}
     */
    const blankNodeValueDisplayComponent = {
        templateUrl: 'ontology-editor/components/blankNodeValueDisplay/blankNodeValueDisplay.component.html',
        bindings: {
            nodeId: '<'
        },
        controllerAs: 'dvm',
        controller: blankNodeValueDisplayComponentCtrl
    };

    blankNodeValueDisplayComponentCtrl.$inject = ['ontologyUtilsManagerService'];

    function blankNodeValueDisplayComponentCtrl(ontologyUtilsManagerService) {
        var dvm = this;
        dvm.ontoUtils = ontologyUtilsManagerService;
        dvm.editorOptions = {
            mode: 'text/omn',
            indentUnit: 4,
            lineWrapping: true,
            readOnly: true,
            cursorBlinkRate: -1,
            height: 'dynamic',
            scrollbarStyle: 'null',
            viewportMargin: Infinity
        };
        dvm.value = '';

        dvm.$onChanges = function(changesObj) {
            dvm.value = dvm.ontoUtils.getBlankNodeValue(changesObj.nodeId.currentValue);
        }
    }

    angular.module('ontology-editor')
        .component('blankNodeValueDisplay', blankNodeValueDisplayComponent);
})();
