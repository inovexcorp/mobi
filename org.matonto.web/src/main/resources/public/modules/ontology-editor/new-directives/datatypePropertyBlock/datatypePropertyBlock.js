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
(function() {
    'use strict';

    angular
        .module('datatypePropertyBlock', [])
        .directive('datatypePropertyBlock', datatypePropertyBlock);

        datatypePropertyBlock.$inject = ['$filter', 'stateManagerService', 'responseObj'];

        function datatypePropertyBlock($filter, stateManagerService, responseObj) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/new-directives/datatypePropertyBlock/datatypePropertyBlock.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.ro = responseObj;
                    dvm.sm = stateManagerService;

                    dvm.openAddDataPropOverlay = function() {
                        dvm.sm.editingProperty = false;
                        dvm.sm.propertySelect = undefined;
                        dvm.sm.propertyValue = '';
                        dvm.sm.propertyType = undefined;
                        dvm.sm.propertyIndex = 0;
                        dvm.sm.showDataPropertyOverlay = true;
                    }

                    dvm.editDataProp = function(property, index) {
                        dvm.sm.editingProperty = true;
                        dvm.sm.propertySelect = property;
                        dvm.sm.propertyValue = dvm.sm.selected[dvm.ro.getItemIri(property)][index]['@value'];
                        dvm.sm.propertyType = _.find(dvm.sm.state.dataPropertyRange, datatype => dvm.ro.getItemIri(datatype) === dvm.sm.selected[dvm.ro.getItemIri(property)][index]['@type']);
                        dvm.sm.propertyIndex = index;
                        dvm.sm.showDataPropertyOverlay = true;
                    }

                    dvm.showRemovePropertyOverlay = function(key, index) {
                        dvm.sm.key = key;
                        dvm.sm.index = index;
                        dvm.sm.showRemoveOverlay = true;
                    }
                }
            }
        }
})();
