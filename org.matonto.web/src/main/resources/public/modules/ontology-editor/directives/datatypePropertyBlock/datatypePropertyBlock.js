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

        datatypePropertyBlock.$inject = ['ontologyStateService', 'responseObj'];

        function datatypePropertyBlock(ontologyStateService, responseObj) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/datatypePropertyBlock/datatypePropertyBlock.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.ro = responseObj;
                    dvm.sm = ontologyStateService;

                    dvm.openAddDataPropOverlay = function() {
                        dvm.sm.editingProperty = false;
                        dvm.sm.propertySelect = undefined;
                        dvm.sm.propertyValue = '';
                        dvm.sm.propertyType = undefined;
                        dvm.sm.propertyIndex = 0;
                        dvm.sm.propertyLanguage = 'en';
                        dvm.sm.showDataPropertyOverlay = true;
                    }

                    dvm.editDataProp = function(property, index) {
                        var propertyObj = dvm.sm.selected[dvm.ro.getItemIri(property)][index];
                        var type = _.find(dvm.sm.listItem.dataPropertyRange, datatype => dvm.ro.getItemIri(datatype) === propertyObj['@type']);
                        dvm.sm.editingProperty = true;
                        dvm.sm.propertySelect = property;
                        dvm.sm.propertyValue = propertyObj['@value'];
                        dvm.sm.propertyType = type ? {'@id': dvm.ro.getItemIri(type)} : undefined;
                        dvm.sm.propertyIndex = index;
                        dvm.sm.propertyLanguage = _.get(propertyObj, '@language');
                        dvm.sm.showDataPropertyOverlay = true;
                    }

                    dvm.showRemovePropertyOverlay = function(key, index) {
                        dvm.key = key;
                        dvm.index = index;
                        dvm.showRemoveOverlay = true;
                    }
                }
            }
        }
})();
