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
(function () {
    'use strict';

    /**
     * @ngdoc component
     * @name catalog.component:openRecordButton
     *
     * @description
     * `openRecordButton` is a component which creates an Open Record button that will open the provided recoord in the
     * appropriate module.
     * 
     * @param {String} recordIri The recordIri to open
     */
    const openRecordButtonComponent = {
        templateUrl: 'catalog/components/openRecordButton/openRecordButton.component.html',
        bindings: {
            recordIri: '<',
            stopProp: '<'
        },
        controllerAs: 'dvm',
        controller: openRecordButtonComponentCtrl
    };

    openRecordButtonComponentCtrl.$inject = [];

    function openRecordButtonComponentCtrl() {
        var dvm = this;

        dvm.$onInit = function() {
            console.log(dvm.stopProp)
        }
        dvm.openRecord = function(event) {
            if (dvm.stopProp) {
                event.stopPropagation();
            }
        }
        dvm.openOntology = function() {
            $state.go('root.ontology-editor');
            if (!_.isEmpty(os.listItem)) {
                os.listItem.active = false;
            }
            os.listItem = {};
        }
        dvm.openMapping = function() {
            $state.go('root.mapper');
        }
        dvm.openDataset = function() {
            $state.go('root.datasets');

        }
    }

    angular.module('catalog')
        .component('openRecordButton', openRecordButtonComponent);
})();
